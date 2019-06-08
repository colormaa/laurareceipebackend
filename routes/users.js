var express = require('express');
var router = express.Router();
var User = require('../models/User');
var mongoose = require('mongoose');

const isEmpty = require('../is-empty');
const validator = require('validator');
var bcrypt = require('bcryptjs');
const keys = require('../keys');
var jwt = require("jsonwebtoken");
const passport = require('passport');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
router.post('/login', function(req, res){
  const password = !isEmpty(req.body.password) ? req.body.password: null;
  const email = !isEmpty(req.body.email) ? req.body.email.toLowerCase(): null;
  let errors = {}
  console.log("login here ",req.body);
 
  if(isEmpty(password)){
    errors.password = "Password is required";
  }
  if(isEmpty(email)){
    errors.email = "Email is required";
  }

  if(!validator.isEmail(req.body.email)){
    errors.email = "Email is not valid.";
  }
  console.log("register ", errors);
  if(isEmpty(errors)){
    User.findOne({email: email})
    .then(user =>{
      if(user){
        console.log("user", user)
        const value = bcrypt.compareSync(password, user.password);
        console.log("value ", value);
        if(value){
            const payload = {
              id: user._id, username: user.username, email: user.email, role: user.role
            }
            const token = jwt.sign(payload, keys.secretOrKey, {expiresIn: 3600});
            return res.json({token: 'Bearer '+token});
        }else{
          console.log("wrong password")
          errors.password = "Wrong password";
          return res.status(400).json({err: errors});
        }
        
      }else{
        console.log("email is not registered")
        errors.email = "Email is not registered";
        return res.status(400).json({err: errors});
      }
    })
    .catch(err=>{
      console.log("err login ", err);
      errors.msg = "Can not find user";
      return res.status(400).json({err: errors});
    });
  }else{
    errors.msg = "Fill all fields";
    console.log("error s ", errors);
    return res.status(400).json({err: errors});
  }
});

router.post('/register', function(req, res){
  const username = !isEmpty(req.body.username) ? req.body.username.toLowerCase(): null;
  const password = !isEmpty(req.body.password) ? req.body.password: null;
  const email = !isEmpty(req.body.email) ? req.body.email.toLowerCase(): null;
  const role = req.body.role ? req.body.role : 'user';
  let errors = {}
  console.log(" register here ",req.body);
 if(isEmpty(username)){
    errors.username = "Username is required.";
  }
  if(isEmpty(password)){
    errors.password = "Password is required";
  }
  if(isEmpty(email)){
    errors.email = "Email is required";
  }

  if(!validator.isEmail(req.body.email)){
    errors.email = "Email is not valid.";
  }
  console.log("register ", errors);
  if(isEmpty(errors)){
    
    bcrypt.genSalt(10, (err, salt)=>{
      bcrypt.hash(password, salt, (err, hash)=>{
        if(err){
          throw err;
        }
        User.findOne({email: email})
        .then(user=>{
          if(user){
            //console.log("emai usre ", user);
            errors.email = "Email is already registered."
            return res.status(400).json({err: errors});
          }else{
            const temp = {
              username: username, 
              password: hash, 
              role: role, 
              email: email
            }
            const usermod = new User(temp);
            usermod.save()
            .then(user=>{
              const payload = {id: user._id, username: user.name,role: user.role, email: user.email};
              const token = jwt.sign(payload,keys.secretOrKey, {expiresIn: 3600} );
              console.log("token ", 'Bearer '+token);
              return res.json({token: 'Bearer '+token});
            })
            .catch(err => {
              console.log("err can not add user", err);
              errors.msg = "Can not add user";
              return res.status(400).json({err: errors});
          });
          }
        })
        .catch(err=>{
          console.log("err", err);
          errors.msg = "Can not get user.";
          return res.status(400).json({err: errors});
        })
       
        
      });
    });
    
  }else{
    return res.status(400).json({err: errors});
  }
  
});
router.get('/current', passport.authenticate('jwt', {session: false}), (req, res)=>{
  console.log(" logged in ");
  res.json({id: req.user.id, username: req.user.username, email: req.user.email});
});
module.exports = router;
