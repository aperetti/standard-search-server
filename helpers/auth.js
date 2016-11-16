var jwt = require('jsonwebtoken')
var app = require('../server.js')
module.exports = () => {
  return function(req, res, next){
    if (req.headers.authorization) {
      req.token = req.headers.authorization.split(" ")[1]
    } 
    var token = req.token || req.body.token || req.query.token || req.headers['x-access-token'] ;
    if (token) {
      jwt.verify(token, app.get('apiSecret'), function(err, decodedToken) {
        if (err) {
          return res.json({ success: false, message: 'Faileded to authenticate token.' });
        } else {
          req.decodedToken = decodedToken;
          next();
        }
      });
    } else {
      return res.status(403).send({
        success: false,
        message: 'No token provided.'
      });
    }
  }
}