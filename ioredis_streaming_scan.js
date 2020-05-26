const Redis = require('ioredis');

// Basic connection, will use defaults if object not provided.
const redis = new Redis({
  port: 6379,
  host: '127.0.0.1',
  // password: 'sssssh',
});

const LARGE_SET_KEY = 'large_set';

const createLargeSet = async () => {
  // Create a set of 1000 integers.
  await redis.del(LARGE_SET_KEY);

  const setMembers = [];
  for (let n = 0; n < 1000; n++) {
    setMembers.push(n);
  }

  // Create the set.
  await redis.sadd(LARGE_SET_KEY, setMembers);
};

const ioRedisRegularSetScan = async () => {
  let it = '0';
  const allMembers = [];

  do {
    const response = await redis.sscan(LARGE_SET_KEY, it);
    // Get next value of cursor and log responses.
    it = response[0];
    const setMembers = response[1];
    allMembers.push(...setMembers);
    console.log(setMembers);
  } while (it !== '0');

  console.log(`Done scanning the large set, read ${allMembers.length} members.`);
};

const ioRedisStreamingSetScan = async () => {
  // Read back all set members, using a scan approach (SSCAN).
  const allMembers = [];
  const stream = redis.sscanStream(LARGE_SET_KEY);

  stream.on('data', function (setMembers) {
    // setMembers is an array of 1 or more members.
    allMembers.push(...setMembers);
    console.log(setMembers);
  });

  stream.on('end', function () {
    console.log(`Done scanning the large set, read ${allMembers.length} members.`);
    redis.quit();
  });
};

const ioRedisLargeSetDemo = async () => {
  await createLargeSet();
  await ioRedisRegularSetScan();
  await ioRedisStreamingSetScan();
};

try {
  ioRedisLargeSetDemo();
} catch (e) {
  console.error(e);
}