// get an isntance of mongoose and mongoose.Schema
var mongoose = require('mongoose')
var mongoosastic = require('mongoosastic')
var Schema = mongoose.Schema

// set up a mongoose and pass it using module.exports
var standardSchema = new Schema({
  menu: {type: [String]},
  path: String,
  code: {type: String, required: true, index: true, es_index:true},
  desc: {type: String, required: true, es_index:true},
  text: {type: String, es_index:true},
  references: [{type: String, es_index:true}],
  versions: [{
    date: Date,
    entry: String,
    file: {type:Schema.Types.ObjectId, ref: 'fs.file'}
  }],
  status: {type: String, enum: ['ACTIVE','INACTIVE','DELETED'], required: true, es_index: true}
})

standardSchema.statics.getStandard = function (id, cb) {
  return this.findOne({_id: ObjectId(id)}).exec(cb)
}

standardSchema.statics.codeExists = function (code, cb) {
  return this.find({code: code}, cb)
}

standardSchema.statics.getMenu = function(cb) {
  return this.distinct("path", cb)
}

standardSchema.plugin(mongoosastic)

// before saving  the record, the model will read the array of menu paths
// and concatenate them for easier search. Both the array and the string of menus
// will be saved to the DB.
standardSchema.pre('save', function (next) {
	this.path = this.menu ? this.menu.join('|') : ''
	next()
})

var Standard = mongoose.model('Standard', standardSchema)

module.exports = Standard
