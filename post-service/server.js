const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load post.proto
const packageDef = protoLoader.loadSync(
  path.join(__dirname, './protos/post.proto')
);
const grpcObject = grpc.loadPackageDefinition(packageDef);
const postPackage = grpcObject.post;

// Create server
const server = new grpc.Server();

server.addService(postPackage.PostService.service, {
  GetPost: (call, callback) => {
    const postId = call.request.id;
    console.log(`📦 Received gRPC request for post ID: ${postId}`);
    callback(null, {
      id: postId,
      title: 'Hello from gRPC',
      content: 'This post was served via gRPC service!',
    });
  },
  CreatePost: (call, callback) => {
    const { id, title, content } = call.request;
    console.log(`📨 Creating post: ${id}, ${title}, ${content}`);
    callback(null, { id, title, content });
  }
});

const mongoose = require('mongoose');
mongoose.connect('mongodb://mongo:27017/myapp?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


const port = 50052;
server.bindAsync(
  '0.0.0.0:50052',
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log(`🚀 PostService running on port 50052`);
    server.start();
  }
);
