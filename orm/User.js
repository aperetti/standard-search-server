'use strict'


module.exports = function(sequelize, Types) {
	var bcrypt = require('bcrypt')
	const saltRounds = 10
	var User = sequelize.define(
		'user',
		{
			full_name: {
				type: Types.STRING,
				allowNull: false
			},
			password: {
				type: Types.STRING,
				set: function (val) {
					var hash = bcrypt.hashSync(val, saltRounds)
					this.setDataValue('password', hash)
				},
				allowNull: false
			},
			email: {
				primaryKey: true,
				type: Types.STRING,
				allowNull: false
			},
			passwordExpired: {
				field: 'password_expired',
				type: Types.BOOLEAN,
				defaultValue: false
			}
		},
		{
			classMethods: {
				associate: function(models) {
					User.belongsToMany(models.role, {
						as: 'roles',
						through: 'userRole',
						onDelete: 'CASCADE'
					})
					User.belongsToMany(models.standard, {
						as: 'favorites',
						through: 'userStandardFavorite',
						onDelete: 'CASCADE'
					})
					User.belongsToMany(models.standard, {
						as: 'history',
						through: 'userStandardHistory',
						onDelete: 'CASCADE'
					})
					User.hasMany(models.project, {
						foreignKey: 'ownerId'
					})
					User.belongsToMany(models.project, {
						as: 'projectSubcriptions',
						through: 'userProjectSubscription'
					})
				}
			}
		}
	)
	return User
}
