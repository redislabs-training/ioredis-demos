const Redis = require('ioredis');

// Basic connection, will use defaults if object not provided.
const redis = new Redis({
  port: 6379,
  host: '127.0.0.1',
  // password: 'sssssh',
});

const STREAM_KEY = 'temphumidity';

const ioRedisArgumentTransformer = async () => {
  // Standard XADD using name, value strings...
  await redis.pipeline()
    .del(STREAM_KEY)
    .xadd(STREAM_KEY, '*', 'sensorId', '1afc', 'temp', 72.1, 'humidity', 55.4)
    .xadd(STREAM_KEY, '*', 'sensorId', '2b03', 'temp', 65.3, 'humidity', 38.1)
    .xadd(STREAM_KEY, '*', 'sensorId', 'e4af', 'temp', 83.5, 'humidity', 82.7)
    .xadd(STREAM_KEY, '*', 'sensorId', '1afc', 'temp', 45.4, 'humidity', 12.8)
    .exec();

  // XADD with argument transformer to accept an object...
  Redis.Command.setArgumentTransformer('xadd', function (args) {
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

  const id = await redis.xadd(STREAM_KEY, '*', { 
    'sensorId': '0c14', 
    'temp': 48.6,
    'humidity': 22.3,
  });

  console.log(`XADD, ID for entry added with argument transformer: ${id}`);
};

const ioRedisReplyTransformer = async () => {
  // Standard response...
  let streamEntries = await redis.xrange(STREAM_KEY, '-', '+', 'COUNT', 2);

  console.log('XRANGE, standard response:');
  console.log(streamEntries);

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

  streamEntries = await redis.xrange(STREAM_KEY, '-', '+', 'COUNT', 2);

  console.log('XRANGE, response with reply transformer:');
  console.log(streamEntries);
};

const runIoRedisTransformers = async () => {
  await ioRedisArgumentTransformer();
  await ioRedisReplyTransformer();
  
  // Disconnect
  redis.quit();
};

try {
  runIoRedisTransformers();
} catch (e) {
  console.error(e);
}