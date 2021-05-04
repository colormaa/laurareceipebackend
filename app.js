var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var graphqlHTTP = require('express-graphql');
const config = require('./config/keys_dev')
//var schema = require('./graphql/bookSchema');
var cors = require('cors');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var mainCategoryRouter = require('./routes/maincategories');
var categoriesRouter = require('./routes/categories');
var recipesRouter = require('./routes/recipes');
 var passport = require('passport');

var app = express();
app.use('*', cors());
/*
app.use('/graphql', cors(), graphqlHTTP({
  schema: schema, 
  rootValue: global, 
  graphiql: true
}))
*/
mongoose.connect(config.mongoURI, {promiseLibrary: require('bluebird'), createIndex:true,  useNewUrlParser: true})
.then(()=>{
  console.log("connection successfulty db");
})
.catch((err)=> console.log(err));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
 app.use(passport.initialize());
 require('./config/passport')(passport);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/maincategories', mainCategoryRouter);
app.use('/api/recipes', recipesRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
