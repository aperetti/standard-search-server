var fs = require('fs')
var path = require('path')
var Sequelize = require('sequelize-hierarchy')()
var sqlDb = require('../config.js')
var sequelize = new Sequelize(sqlDb.sqlDb.connect)
var db = {}
db.sequelize = sequelize
db.Sequelize = Sequelize
fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js')
  })
  .forEach(function(file) {
    console.log(file)
    var model = sequelize.import(path.join(__dirname, file))
    db[model.name] = model
  })

Object.keys(db).forEach(function(modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db)
  }
})

module.exports = db