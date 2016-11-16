// get an isntance of mongoose and mongoose.Schema
var mongoose = require('mongoose')
var Standard = require('./standard')
var Schema = mongoose.Schema
var bcrypt = require('bcrypt-nodejs')
var SALT_WORK_FACTOR = 10


// set up a mongoose and pass it using module.exports
var userSchema = new Schema({
  username: { type: String, required: true, index: {unique: true } },
  password: { type: String, required: true, select: false },
  favorites: [{type: Schema.Types.ObjectId, ref: 'Standard'}], // Array of Standard Ids
  history: [{type: Schema.Types.ObjectId, ref: 'Standard'}],
  scopes: [{type: String}]
})

userSchema.statics.addHistory = function (userId, standardId, cb) {
	return this.findOne({_id: ObjectId(userId)}, function (err, user) {
  	//Check if standard exists
  	if(user) {
	  	Standard.getStandard(standardId, function (error, standard) {
		  	if (standard) {
		  		//For Compatibility if users was created before history
			  	if (Object.keys(user._doc).indexOf('history') === -1) {
			  		user.history = []
			  	}

			  	//Determines if the user has existing history of standard and then remove
			  	if (user.history.indexOf(standardId) !== -1) {
			  		user.history.splice(user.history.indexOf(standardId),1)
			  	}

			  //Add history to beginning of the array and caps the length of the array to 50
				user.history.splice(0,0,standardId)
				if (user.history.length > 50) {
					user.history.pop()
				}
				user.save()
				cb(err, user)
		  	} else {
		  			err = "Invalid Standard"
		  			cb(err, user)
		  	}
	  	})
	  } else {
	  	err = "Invalid User"
	  	cb(err, user)
	  }
	})
}

userSchema.statics.getHistory = function (userId, cb) {
	var query = this.findOne({_id: ObjectId(userId)})
	query.populate('history', {_id: 1, code: 1}).select('history').exec(function (err, history) {
		cb(err, history)
	})
}

userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err)
        cb(null, isMatch)
    })
}

userSchema.pre('save', function (next) {
	var user = this

	//only hash password if password has change or is new
	if (!user.isModified('password')) return next();
	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		if (err) return next(err)
		bcrypt.hash(user.password, salt, function () {}, function (err, hash) {
			if (err) return next(err)
			user.password = hash
			next()
		})
	})
})

var User = mongoose.model('User', userSchema)

module.exports = User
