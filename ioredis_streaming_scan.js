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
  let cursor = '0'; // Store cursor value from Redis.
  const allMembers = [];

  do {
    const response = await redis.sscan(LARGE_SET_KEY, cursor);
    // Get next value of cursor and store values returned.
    cursor = response[0];
    allMembers.push(...response[1]);
  } while (cursor !== '0');  // Done when cursor is '0' again.

  return allMembers;
};

const ioRedisStreamingSetScan = async () => {
  return new Promise ((resolve, reject) => {
    try {
      // Read back all set members, using a scan approach (SSCAN).
      const allMembers = [];
      const stream = redis.sscanStream(LARGE_SET_KEY);

      stream.on('data', function (setMembers) {
        // setMembers is an array of 1 or more members.
        allMembers.push(...setMembers);
      });

      stream.on('end', function () {
        // No more members left to read.
        resolve(allMembers);
      });
    } catch (e) {
      // Something went wrong :(
      reject(e);
    }
  });
};

const ioRedisES6GeneratorSetScan = async () => {
  // Read back all set members, using ES6 Generator function approach.
  const setMembersGenerator = async function* () {
    let cursor = '0';

    do {
      const response = await redis.sscan(LARGE_SET_KEY, cursor);

      // Get next value of cursor.
      cursor = response[0];

      // Yield the set members returned from Redis.
      yield response[1];
    } while (cursor !== '0');
  };

  // Get values from the generator.  Using the generator shields us 
  // from the details of the Redis implementation.

  const allMembers = [];
  const setIterator = setMembersGenerator();
  let done = false;

  do {
    let setMembers;

    ({ value: setMembers, done } = await setIterator.next());

    // setMembers will be undefined when done is true.
    if (setMembers) {
      allMembers.push(...setMembers);
    }
  } while (! done);

  return allMembers;
};

const ioRedisLargeSetDemo = async () => {
  console.log('Creating set...');
  await createLargeSet();
  
  let setMembers = await ioRedisRegularSetScan();
  console.log(`Regular scan complete, read ${setMembers.length} members.`);
  
  setMembers = await ioRedisStreamingSetScan();
  console.log(`Streaming scan complete, read ${setMembers.length} members.`);
  
  setMembers = await ioRedisES6GeneratorSetScan();
  console.log(`Generator scan complete, read ${setMembers.length} members.`);

  redis.quit();
};

try {
  ioRedisLargeSetDemo();
} catch (e) {
  console.error(e);
}