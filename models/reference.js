// get an isntance of mongoose and mongoose.Schema
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var referenceSchema = new Schema({
  group: {type: String, required: true},
  regex: {type: String, required: true},
  modifiers: {type: String, default: 'g'}
})

var Reference = mongoose.model('Reference', referenceSchema)

module.exports = Reference
