var jwt = require('jsonwebtoken')
var models = require('../orm')
var app = require('../server')
module.exports = () => {
  
  function checkNonce (req) {
    console.log('Checking req')
    console.log(req.query)
    var params = req.originalUrl.split('/')
    console.log(params)
    var nonceId = ''
    if (params[2] == 'standards' && params[3] == 'pdf') {
      nonceId = 'nonce' in req.query ? req.query.nonce : ''
    }
    console.log(nonceId)
    return models.tempStandard.findById(nonceId)
  }

  return function(req, res, next){
    if (req.headers.authorization) {
      req.token = req.headers.authorization.split(" ")[1]
    } 
    var token = req.token || req.body.token || req.query.token || req.headers['x-access-token'] ;
    if (token) {
      jwt.verify(token, app.get('apiSecret'), function(err, decodedToken) {
        if (err) {
          console.log(err)
          return res.json({ success: false, message: 'Failed to authenticate token.' });
        } else {
          req.decodedToken = decodedToken;
          next()
        }
      })
    } else {
      checkNonce(req).then(nonce => {
        console.log(nonce)
        if (nonce) {
          if ((new Date(nonce.createdAt) - new Date()) < 1000 * 60 * 60) {
            nonce.destroy().then(() => next())
          } else {
            nonce.destroy().then(() => {
              res.status(403).send({success: false, message: 'Webpage has expired. Please login again.'})
            })
          }
        } else {
          if (req.query.nonce) return res.status(301).redirect('/')
          return res.status(403).send({
            success: false,
            message: 'No token provided.'
          })
        }
      })
    }
  }
}

