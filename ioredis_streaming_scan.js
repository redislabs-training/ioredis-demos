const Redis = require('ioredis');

const ioRedisStreamingScan = async () => {
  // Basic connection, will use defaults if object not provided.
  const redis = new Redis({
    port: 6379,
    host: '127.0.0.1',
    // password: 'sssssh',
  });

  // Streaming scan example with a large set of 1000 integers.
  const LARGE_SET_KEY = 'large_set';

  await redis.del(LARGE_SET_KEY);

  const setMembers = [];
  for (let n = 0; n < 1000; n++) {
    setMembers.push(n);
  }

  // Create the set.
  await redis.sadd(LARGE_SET_KEY, setMembers);

  // Read back all set members, using a scan approach (SSCAN).
  const stream = redis.sscanStream(LARGE_SET_KEY);

  stream.on('data', function (setMembers) {
    // setMembers is an array of 1 or more members.
    console.log(setMembers);
  });

  stream.on('end', function () {
    console.log('Done scanning the large set.');
    redis.quit();
  });
};

try {
  ioRedisStreamingScan();
} catch (e) {
  console.error(e);
}