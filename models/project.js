// get an isntance of mongoose and mongoose.Schema
var mongoose = require('mongoose')
var Schema = mongoose.Schema

// set up a mongoose and pass it using module.exports
var projectSchema = new Schema({
  name: {type: String, unique: true, required: true},
  description: String,
  owners: [{type: [Schema.Types.ObjectId], ref: 'User'}],
  standards: [{type: Schema.Types.ObjectId, ref: 'Standard'}]
})

projectSchema.methods.isOwner = function (ownerId, cb) { 
	if (this.owners.indexOf(ownerId) === -1) return false
	return true
}

var Project = mongoose.model('Project', projectSchema)

module.exports = Project