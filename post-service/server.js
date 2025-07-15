const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const mongoose = require('mongoose');


// Load post.proto
const packageDef = protoLoader.loadSync(
  path.join(__dirname, './protos/post.proto')
);
const grpcObject = grpc.loadPackageDefinition(packageDef);
const postPackage = grpcObject.post;

// Create server
const server = new grpc.Server();

const Post = require('./models/Post');


server.addService(postPackage.PostService.service, {
  GetPost: async (call, callback) => {
    const post = await Post.findOne({ id: call.request.id });
    if (!post) return callback(null, {});
    callback(null, { id: post.id, title: post.title, content: post.content });
  },

  CreatePost: async (call, callback) => {
    const { id, title, content } = call.request;
    const newPost = new Post({ id, title, content });
    await newPost.save();
    callback(null, { id, title, content });
  }
});

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


const port = 50052;
server.bindAsync(
  '0.0.0.0:50052',
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log(`🚀 PostService running on port ${port}`);
    server.start();
  }
);
