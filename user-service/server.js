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

server.addService(userPackage.UserService.service, {
  GetUser: (call, callback) => {
    const userId = call.request.id;
    console.log(`Received gRPC request for user ID: ${userId}`);
    callback(null, { id: userId, name: 'Alice Tanay' });
  }
});

const mongoose = require('mongoose');
mongoose.connect('mongodb://mongo:27017/myapp?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Start server
const port = 50051;
server.bindAsync(
  '0.0.0.0:50051', // for user-service
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log(`🚀 UserService running on port 50051`);
    server.start();
  }
);
