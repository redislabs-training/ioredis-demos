const Redis = require('ioredis');

// Basic connection, will use defaults if object not provided.
const redis = new Redis({
  port: 6379,
  host: '127.0.0.1',
  // password: 'sssssh',
});

const PLANET_STREAM_KEY = "planetstream";

const ioRedisReplyTransformer = async () => {
  // Standard XADD name, value strings...
  pipeline = redis.pipeline();
  await pipeline
    .del(PLANET_STREAM_KEY)
    .xadd(PLANET_STREAM_KEY, '*', 'name', 'Mercury', 'diameter', 4879, 'diameterUnit', 'km')
    .xadd(PLANET_STREAM_KEY, '*', 'name', 'Venus', 'diameter', 12104, 'diameterUnit', 'km')
    .xadd(PLANET_STREAM_KEY, '*', 'name', 'Earth', 'diameter', 12756, 'diameterUnit', 'km')
    .xadd(PLANET_STREAM_KEY, '*', 'name', 'Mars', 'diameter', 6779, 'diameterUnit', 'km')
    .exec();

  // Standard response...
  let planetsFromStream = await redis.xrange(PLANET_STREAM_KEY, '-', '+', 'COUNT', 2);
  /* 
    [
      [
        '1590185150185-0',
        [ 'name', 'Mercury', 'diameter', '4879', 'diameterUnit', 'km' ]
      ],
      [
        '1590185150185-1',
        [ 'name', 'Venus', 'diameter', '12104', 'diameterUnit', 'km' ]
      ]
    ]
  */
  console.log('XRANGE, standard response:');
  console.log(planetsFromStream);

  // Streams with reply transformer to get an array of objects...
  Redis.Command.setReplyTransformer('xrange', function (result) {
    if (Array.isArray(result)) {
      const newResult = [];
      for (const r of result) {
        const obj = {
          id: r[0]
        };

        const keysValues = r[1];

        for (let n = 0; n < keysValues.length; n += 2) {
          const k = keysValues[n];
          const v = keysValues[n + 1];
          obj[k] = v;
        }

        newResult.push(obj);
      }

      return newResult;
    }

    return result;
  });

  planetsFromStream = await redis.xrange(PLANET_STREAM_KEY, '-', '+', 'COUNT', 2);
  console.log('XRANGE, response with reply transformer:');
  console.log(planetsFromStream);
};

const ioRedisArgumentTransformer = async () => {
  // XADD with argument transformer...
  Redis.Command.setArgumentTransformer("xadd", function (args) {
    if (args.length === 3) {
      const argArray = [];

      argArray.push(args[0], args[1]); // Key Name & ID.

      // Transform object into array of key then value.
      const keyValuePairs = args[2];

      for (const key in keyValuePairs) {
        argArray.push(key, keyValuePairs[key]);
      }

      return argArray;
    }

    return args;
  });

  const id = await redis.xadd(PLANET_STREAM_KEY, '*', { 
    'name': 'Mercury', 
    'diameter': 4879,
    'diameterUnit': 'km'
  });

  console.log(`ADD, ID for entry added with argument transformer: ${id}`);
};

const runIoRedisTransformers = async () => {
  await ioRedisReplyTransformer();
  await ioRedisArgumentTransformer();

  // Disconnect
  redis.quit();
};

try {
  runIoRedisTransformers();
} catch (e) {
  console.error(e);
}