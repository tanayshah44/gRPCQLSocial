const { ApolloServer } = require('@apollo/server');
const express = require('express');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');
const bodyParser = require('body-parser');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');


// Load gRPC proto for user
const userProtoPath = path.join(__dirname, './protos/user.proto');
const userPackageDef = protoLoader.loadSync(userProtoPath);
const userProto = grpc.loadPackageDefinition(userPackageDef).user;

// Load gRPC proto for post
const postProtoPath = path.join(__dirname, './protos/post.proto');
const postPackageDef = protoLoader.loadSync(postProtoPath);
const postProto = grpc.loadPackageDefinition(postPackageDef).post;


const userClient = new userProto.UserService('user-service:50051', grpc.credentials.createInsecure());
const postClient = new postProto.PostService('post-service:50052', grpc.credentials.createInsecure());

function grpcCallWithRetry(clientFn, request) {
  return new Promise((resolve, reject) => {
    const maxRetries = 5;
    let attempt = 0;

    function tryCall() {
      clientFn(request, (err, res) => {
        if (!err) return resolve(res);
        if (err.code === 14 && attempt < maxRetries) {
          attempt++;
          console.log(`⏳ Retry attempt ${attempt}...`);
          return setTimeout(tryCall, 1000);
        }
        return reject(err);
      });
    }

    tryCall();
  });
}


// GraphQL schema
const typeDefs = `
  type User {
    id: String
    name: String
    posts: [Post]
  }
  
  type Post {
    id: String
    title: String
    content: String
  }

  type Query {
    user(id: String!): User
    post(id: String!): Post
  }
`;

const userPostMap = {
  "101": ["201", "202"],
  "102": ["203"]
};

// GraphQL resolvers
const resolvers = {
  Query: {
    user: async (_, args) =>
      grpcCallWithRetry(userClient.GetUser.bind(userClient), { id: args.id }),

    post: async (_, args) =>
      grpcCallWithRetry(postClient.GetPost.bind(postClient), { id: args.id })
  },

  User: {
    posts: async (parent) => {
      const postIds = userPostMap[parent.id] || [];
      const postPromises = postIds.map((postId) =>
        grpcCallWithRetry(postClient.GetPost.bind(postClient), { id: postId })
      );
      return Promise.all(postPromises);
    }
  }
};

const app = express();
const server = new ApolloServer({ typeDefs, resolvers });

async function startServer() {
  await server.start();
  app.use(cors(), bodyParser.json(), expressMiddleware(server));
  app.listen(4000, () => {
    console.log(`🚀 GraphQL Gateway running at http://localhost:4000`);
  });
}

startServer();