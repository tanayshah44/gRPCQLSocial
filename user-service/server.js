require('dotenv').config();
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load user.proto
const packageDef = protoLoader.loadSync(
  path.join(__dirname, './protos/user.proto')
);
const grpcObject = grpc.loadPackageDefinition(packageDef);
const userPackage = grpcObject.user;

// Create server and define methods
const server = new grpc.Server();

const User = require('./models/User');


server.addService(userPackage.UserService.service, {
  // GetUser handler
  GetUser: async (call, callback) => {
    const user = await User.findOne({ id: call.request.id });
    if (!user) return callback(null, {});
    callback(null, { id: user.id, name: user.name });
  },

  // CreateUser handler
  CreateUser: async (call, callback) => {
    const { id, name } = call.request;
    const newUser = new User({ id, name });
    await newUser.save();
    callback(null, { id, name });
  }
});


const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Start server
const port = 50051;
server.bindAsync(
  '0.0.0.0:50051', // for user-service
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log(`UserService running on port 50051`);
    server.start();
  }
);
