const Redis = require('ioredis');

// Basic connection, will use defaults if object not provided.
const redis = new Redis({
  port: 6379,
  host: '127.0.0.1',
  // password: 'sssssh',
});

const ioRedisBasics = async () => {
  // First example.
  redis.hincrby('mykey', 'myfield', 5, function (err, results) {
    console.log(results);
  });

  const results = await redis.hincrby('mykey', 'myfield', 5);
  console.log(results);

  // Basic Redis commands.
  const PLANET_LIST_KEY = 'planets';
  const planets = [
    'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 
    'Saturn', 'Uranus', 'Neptune', 'Pluto'
  ];

  await redis.del(PLANET_LIST_KEY);

  const listLength = await redis.lpush(PLANET_LIST_KEY, planets);
  console.log(`LPUSH, planets list length is ${listLength}.`);

  // LRANGE returns an array of strings.
  const somePlanets = await redis.lrange(PLANET_LIST_KEY, 0, 4);
  console.log('LRANGE, retrieved:');
  console.log(somePlanets);

  // Pipelining with chained commands.  Transactions 
  // work in the same manner.

  await redis.pipeline()
    .hset('planet:mercury', 'name', 'Mercury', 'diameter', 4879, 
          'diameterUnit', 'km')
    .hset('planet:venus', 'name', 'Venus', 'diameter', 12104, 
          'diameterUnit', 'km')
    .hset('planet:earth', 'name', 'Earth', 'diameter', 12756, 
          'diameterUnit', 'km')
    .hset('planet:mars', 'name', 'Mars', 'diameter', 6779, 
          'diameterUnit', 'km')
    .exec();

  // HGETALL returns an object by default.
  const planet = await redis.hgetall('planet:earth');
  console.log('HGETALL planet:earth');
  console.log(planet);
  
  // Get results from a pipeline.
  const pipeResults = await redis.pipeline()
    .hgetall('planet:venus')
    .hgetall('planet:earth')
    .exec();

  /*
     pipeResults is an array of arrays, each containing any 
     error, and the response object from the hgetall command.

    [
       [ null, { name: 'Venus', diameter: '12104', 
                 diameterUnit: 'km' } ],
       [ null, { name: 'Earth', diameter: '12756', 
                 diameterUnit: 'km' } ]
    ]
  */
  console.log('Pipeline results:');
  console.log(pipeResults);

  // Disconnect
  redis.quit();
};

try {
  ioRedisBasics();
} catch (e) {
  console.error(e);
}