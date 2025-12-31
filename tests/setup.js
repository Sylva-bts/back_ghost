const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  // Increase default timeout for starting Mongo in CI or slow environments
  jest.setTimeout(30000);

  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

  if (process.env.MONGO_URI) {
    // Use provided Mongo instance (useful for CI or local Docker)
    await mongoose.connect(process.env.MONGO_URI);
    return;
  }

  try {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();
    // connect mongoose (tests will require the app which expects DB connection to be established by tests)
    await mongoose.connect(process.env.MONGO_URI);
  } catch (err) {
    console.error('mongodb-memory-server failed to start. If your environment blocks downloading mongo binaries, set MONGO_URI to a running MongoDB instance for tests.');
    throw err;
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
