"use strict";

var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var ms          = require('ms');
var fs          = require('fs');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config');
var User   = require('./app/models/user');
var Standard = require('./app/models/standard');


//Configuration
var port = process.env.PORT || 8080;
mongoose.connect(config.database);
console.log("Mongoose Connection Status: " + mongoose.connection.readyState);
app.set('apiSecret', config.secret);

//use body parser so we can get infor from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false  }));
app.use(bodyParser.json());

// use morgan to log request to the console
app.use(morgan('dev'));

// ============
// routes ====
// ===========
//basic route 

app.get('/', function(req,res){
  res.send('Standards API - Please see documentation for use.');
});
/*
app.get('/setup', function(req,res) {
  var test = new User({
    name: 'testUser',
    password: 'testpass',
    admin: true
  });
  test.save(function(err){
    if (err) {
      console.log(err);
      handleError(res,err);
    }
    else {
    console.log('User saved successfully');
    res.json({ success:true });
    }
  });
}); 
*/

// -------------------------------------
// API ROUTES ---------------------------
// get an instance of the router for api routes

var apiRoutes = express.Router();

// Route to authenticate a user (POST http://localhost:8080/api/authenticate)
var tokenExpiration = '1h';

apiRoutes.post('/authenticate', function(req, res){
  User.findOne({
    name: req.body.name
  }, function(err, user){ 
    if (err) throw err;

    if(!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.)' });
    } else if (user) {

      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {
        var token = jwt.sign(user, app.get('apiSecret'),{
          expiresIn : tokenExpiration
        });
        let date = Date.now(); 
        res.json({
          success: true,
          time: date,
          expires: date + ms(tokenExpiration), 
          message: 'Enjoy your token!',
          token: token
        });
      }
    }
  });
});
// TODO: route middleware to verify a token
apiRoutes.use(function(req, res, next){
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if (token) {
    jwt.verify(token, app.get('apiSecret'), function(err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Faileded to authenticate token.' });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    });
  }
});
// route to show a random message (GET http://localhost:8080/api)

apiRoutes.get('/', function (req,res) {
  res.json({ message: 'Standards Application!'});
});

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function(req,res){
  User.find({}, function(err, users){
    res.json(users);
  });
});

apiRoutes.get('/pdf', (req,res) => {
  var file = req.body.file || req.query.file;  
  var path = 'app/pdf/' + file;
  fs.exists(path, function (exists) {
    if (exists) {
      res.sendFile(path, { root : __dirname });
    } else {
      res.json({ message: 'File could not be found: ' + path });
    }
  });
});

apiRoutes.get('/html/:file', (req, res) => {
  var file = req.params.file;
  var htmlFile = file.slice(0,-4) + '.html';
  var path = 'app/html/' + htmlFile;
  fs.exists(path, function (exists) {
    if (exists) {
      res.sendFile(path, { root : __dirname });
    } else {
      res.json({ message: 'File could not be found: ' + path });
    }
  });
});

apiRoutes.get('/es', (req, res) => 0);

apiRoutes.get('/standards', (req, res) => {
  Standard.find({}, (error, standards) => {
    res.json(standards);
  })
});

apiRoutes.post('/standardsByMenu', (req, res) => {
  Standard.find({'menu': { $all: req.body.menu, $size: req.body.menu.length}}, function (error, standards) {
    if (error) { 
      res.json(error)
    } else {
      res.json(standards)
    }
  })
})

apiRoutes.get('/standard/:standard', (req, res) => {
  console.log(req.params.standard)
  Standard.findOne({'file': req.params.standard}, function (error, standard){
    if (error) {
      res.json(error);
    } else {
     res.json(standard)
    }
  });
});


apiRoutes.get('/menu', (req, res) => {
  Standard.distinct("path", function (error, ids) {
    if (error) {
      res.json(error);
    } else {
      let menuArray = []
      ids.forEach( (el) => {
        menuArray.push(el.split("|"));
      });
      res.json(menuArray);    
    }
  });
});

app.use('/api', apiRoutes);

app.listen(port);
console.log('Magic happens at http://localhost:' +port);




