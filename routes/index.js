var express = require('express');
var router = express.Router();
const Category = require('../models/Category');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
