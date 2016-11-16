"use strict";

var express = require('express');
var ms = require('ms');
var fs = require('fs');
var models = require('../orm');
var app = require('../server');
var auth = require('../helpers/auth')
var config = require('../config')
var standardRouter = require('./standard')
var userRouter = require('./user')
var adminRouter = require('./admin')
var jwt = require('jsonwebtoken')
var bcrypt = require('bcrypt')

// -------------------------------------
// API ROUTES ---------------------------
// get an instance of the router for api routes

var router = express.Router();

// Route to authenticate a user (POST http://localhost:8080/api/authenticate)
var tokenExpiration = '1h';

/**
* @api {get} authenticate Authenticates User Account
* @apiName Authenticate
* @apiGroup User
* @apiPermission none
* @apiVersion 0.1.0
* 
* @apiDescription Authenticates a user
* @apiDescription If the user is an admin, it simply returns a 200 status code.
* @apiParam {String} name Username
* @apiParam {String} password User's Password 
*
* @apiSuccess (200) {JSON} Returns success boolean, time (ms), expiration time (ms), message, username, admin, and token
* 
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 Permissions Denied
*     {
*       "success": true,
*       "time": 1468289900241,
*       "expires": 1468293500241,
*       "message": "Enjoy your token!",
*       "username": "testUser",
*       "admin": true,
*       "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyIkX18iOnsic3RyaWN0TW9kZSI6dHJ1ZSwiZ2V0dGVycyI6e30sIndhc1BvcHVsYXRlZCI6ZmFsc2UsImFjdGl2ZVBhdGhzIjp7InBhdGhzIjp7ImZhdm9yaXRlcyI6ImRlZmF1bHQiLCJfX3YiOiJpbml0IiwiYWRtaW4iOiJpbml0IiwicGFzc3dvcmQiOiJpbml0IiwibmFtZSI6ImluaXQiLCJfaWQiOiJpbml0In0sInN0YXRlcyI6eyJpZ25vcmUiOnt9LCJkZWZhdWx0Ijp7ImZhdm9yaXRlcyI6dHJ1ZX0sImluaXQiOnsiX192Ijp0cnVlLCJhZG1pbiI6dHJ1ZSwicGFzc3dvcmQiOnRydWUsIm5hbWUiOnRydWUsIl9pZCI6dHJ1ZX0sIm1vZGlmeSI6e30sInJlcXVpcmUiOnt9fSwic3RhdGVOYW1lcyI6WyJyZXF1aXJlIiwibW9kaWZ5IiwiaW5pdCIsImRlZmF1bHQiLCJpZ25vcmUiXX0sImVtaXR0ZXIiOnsiZG9tYWluIjpudWxsLCJfZXZlbnRzIjp7fSwiX2V2ZW50c0NvdW50IjowLCJfbWF4TGlzdGVuZXJzIjowfX0sImlzTmV3IjpmYWxzZSwiX2RvYyI6eyJmYXZvcml0ZXMiOltdLCJfX3YiOjAsImFkbWluIjp0cnVlLCJwYXNzd29yZCI6InRlc3RwYXNzIiwibmFtZSI6InRlc3RVc2VyIiwiX2lkIjoiNTZkZDIzZDI2NTJjMWE0NDE5NzUyYWRjIn0sIl9wcmVzIjp7IiRfX29yaWdpbmFsX3NhdmUiOltudWxsLG51bGxdfSwiX3Bvc3RzIjp7IiRfX29yaWdpbmFsX3NhdmUiOltdfSwiaWF0IjoxNDY4Mjg5OTAwLCJleHAiOjE0NjgyOTM1MDB9.eFzeXCHGMuw8QpNzxVdNASk9fjfC8PaeDPard37_fmY"
*     }
* @apiError (401) {JSON} UserNotFound Returns {success: false, message: 'Authentication failed. User not found.' }
* @apiError (401) {JSON} InvalidPassword Returns {success: false, message: 'Authentication failed. Incorrect password.'}
*
*/
router.post('/authenticate', function(req, res){
  tokenExpiration = req.body.forever ? '1y' : tokenExpiration
  var username = req.body.name
  // ------------------------------------------------------------
  models.user.find({
    where: {email: username},
    include: [{model: models.role, as: 'roles'}]
  }).then(function (user) {
    if (user && bcrypt.compareSync(req.body.password, user.get('password'))) {
        var token = jwt.sign(
          JSON.stringify(user),
          app.get('apiSecret'),{
            expiresIn : tokenExpiration
        })
        console.log(user)
        let date = Date.now(); 
        return res.json({
          success: true,
          time: date,
          expires: date + ms(tokenExpiration), 
          message: 'Enjoy your token!',
          username: user.full_name,
          token: token
        })
    }
    else {
      return res.status(401).json({ success: false, message: 'Authentication failed.' });  
    }
  }).catch(function (err) {
    console.log(err)
    res.status(401).json({ success: false, message: 'Query failed.' });
  })
});

router.use(auth());

// route to show a random message (GET http://localhost:8080/api)
router.get('/', function (req,res) {
  res.json({ message: 'Standard-Search API'});
});

router.use('/standards', standardRouter)
router.use('/admin', adminRouter)
router.use('/user', userRouter)

module.exports = router



