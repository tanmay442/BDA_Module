const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI = uri;
  process.env._MONGO_SERVER_PID = mongoServer.instanceInfo?.pid;
  global.__MONGO_SERVER__ = mongoServer;
};
