var GraphQLSchema = require('graphql').GraphQLSchema;
var GraphQLObjectType = require('graphql').GraphQLObjectType;
var GraphQLList = require('graphql').GraphQLList;
var GraphQLObjectType = require('graphql').GraphQLObjectType;
var GraphQLNonNull = require('graphql').GraphQLNonNull;
var GraphQLID = require('graphql').GraphQLID;
var GraphQLString = require('graphql').GraphQLString;
var GraphQLInt = require('graphql').GraphQLInt;
var GraphQLDate = require('graphql-date');

var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../keys');

var BookModel = require('../models/Book');
var UserModel =require('../models/User');

var bookType = new GraphQLObjectType({
    name: 'book', 
    fields: function(){
        return{
            _id: {
                type: GraphQLString
            }, 
            isbn: {
                type: GraphQLString
            }, 
            title: {
                type: GraphQLString
            }, 
            author: {
                type: GraphQLString
            }, 
            description: {
                type: GraphQLString
            }, 
            published_year:{
                type: GraphQLInt
            }, 
            publisher: {
                type: GraphQLString
            }, 
            updated_date:{
                type: GraphQLDate
            }
        }
    }
});
var userType = new GraphQLObjectType({
  name: 'user', 
  fields: function(){
      return{
          _id: {
              type: GraphQLString
          },
          username: {
              type: GraphQLString
          }, 
          password: {
              type: GraphQLString
          }, 
          role: {
              type: GraphQLString
          }, 
          createdDate: {
              type: GraphQLDate
          }
      }
  }
});

var queryType = new GraphQLObjectType({
    name: 'Query', 
    fields: function(){
        return{
            books: {
                type: new GraphQLList(bookType), 
                resolve: function(){
                    const books = BookModel.find().exec()
                    if(!books){
                        throw new Error('Error')
                    }
                    return books;
                }
            }, 
            book: {
                type: bookType, 
                args: {
                    id: {
                        name: '_id', 
                        type: GraphQLString
                    }
                }, 
                resolve: function(root, params){
                    const bookDetails = BookModel.findById(params.id).exec()
                    if(!bookDetails){
                        throw new Error('Error')
                    }
                    return bookDetails
                }
            }, 
            users: {
              type: new GraphQLList(userType), 
              resolve: function(){
                const userList = UserModel.find({role: 'user'}).select(['username', 'role', 'createdDate']).exec();
                if(!userList){
                  throw new Error('Error')
                }
                return userList;
              }
            },
            
            
        }
    }
});
var mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: function () {
      return {
        addUser: {
          type: userType, 
          args: {
            username: {
              type: new GraphQLNonNull(GraphQLString)
            }, 
            password: {
              type: new GraphQLNonNull(GraphQLString)
            }, 
            role: {
              type: new GraphQLNonNull(GraphQLString)
            }, 
          }, 
          resolve: function(root, params){
            //console.log("params ", params);
            bcrypt.genSalt(10, (err, salt)=>{
              bcrypt.hash(params.password, salt, async (err, hash)=>{
                if(err){
                  throw new Error("Error");
                }
                const muser = {
                  username: params.username, 
                  password: hash, 
                  role: params.role
                }
                const userModel = new UserModel(muser);
                var user= await userModel.save();
                console.log("user ", user);
                if(!user){
                  throw new Error("Error");
                }
                const payload = {id: user._id, name: user.username, role: user.role};
                  console.log("return ");
                const token = await jwt.sign(payload, keys.secretOrKey, {expiresIn: 3600});
                  console.log("token ", token);
                return token;
                
              })
            })
        }
      },
        addBook: {
          type: bookType,
          args: {
            isbn: {
              type: new GraphQLNonNull(GraphQLString)
            },
            title: {
              type: new GraphQLNonNull(GraphQLString)
            },
            author: {
              type: new GraphQLNonNull(GraphQLString)
            },
            description: {
              type: new GraphQLNonNull(GraphQLString)
            },
            published_year: {
              type: new GraphQLNonNull(GraphQLInt)
            },
            publisher: {
              type: new GraphQLNonNull(GraphQLString)
            }
          },
          resolve: function (root, params) {
            const bookModel = new BookModel(params);
            const newBook = bookModel.save();
            if (!newBook) {
              throw new Error('Error');
            }
            return newBook
          }
        },
        updateBook: {
          type: bookType,
          args: {
            id: {
              name: 'id',
              type: new GraphQLNonNull(GraphQLString)
            },
            isbn: {
              type: new GraphQLNonNull(GraphQLString)
            },
            title: {
              type: new GraphQLNonNull(GraphQLString)
            },
            author: {
              type: new GraphQLNonNull(GraphQLString)
            },
            description: {
              type: new GraphQLNonNull(GraphQLString)
            },
            published_year: {
              type: new GraphQLNonNull(GraphQLInt)
            },
            publisher: {
              type: new GraphQLNonNull(GraphQLString)
            }
          },
          resolve(root, params) {
            return BookModel.findByIdAndUpdate(params.id, { isbn: params.isbn, title: params.title, author: params.author, description: params.description, published_year: params.published_year, publisher: params.publisher, updated_date: new Date() }, function (err) {
              if (err) return next(err);
            });
          }
        },
        removeBook: {
          type: bookType,
          args: {
            id: {
              type: new GraphQLNonNull(GraphQLString)
            }
          },
          resolve(root, params) {
            const remBook = BookModel.findByIdAndRemove(params.id).exec();
            if (!remBook) {
              throw new Error('Error')
            }
            return remBook;
          }
        }
      }
    }
  });
module.exports = new GraphQLSchema({query: queryType, 
  mutation: mutation});