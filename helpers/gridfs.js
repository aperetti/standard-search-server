var mongoose = require('mongoose')
var config = require('../config.js')
var Grid = require('gridfs-stream')
var conn = mongoose.createConnection(config.database)
var gfs = new Grid(conn.db, mongoose.mongo)

module.exports = gfs