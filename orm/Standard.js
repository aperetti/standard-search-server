var esRiver = require('../helpers/esRiver')()
'use strict'

module.exports = function(sequelize, Types) {
	var Standard = sequelize.define(
		'standard',
		{
			code: {
				type: Types.STRING,
				allowNull: false,
				field: 'code',
				primaryKey: true
			},
			description: {
				type: Types.STRING,
			},
			status: {
				type: Types.ENUM('ACTIVE', 'OBSOLETE', 'DELETED'),
				defaultValue: 'ACTIVE'
			}
		},
		{
			hooks: {
				afterCreate: function (instance, options) {
					esRiver.indexStandard(instance.code, instance).then(() => console.log('Updated Standard'))
				},
				afterUpdate: function (instance, options) {
					esRiver.indexStandard(instance.code, instance).then(() => console.log('Updated Standard'))
				},
				afterSave: function (instance, options) {
					esRiver.indexStandard(instance.code, instance).then(() => console.log('Updated Stadnard'))
				},
				afterDelete: function (instance, options) {
					esRiver.deleteStandard(instance.code).then(() => console.log('Deleted Standard'))
				}
			},
			classMethods: {
				associate: function(models) {
					Standard.belongsTo(models.standard, {
						as: 'model',
						foreignKey: 'derived_standard'
					})
					Standard.hasMany(models.standard, {
						as: 'derived',
						foreignKey: 'derived_standard'
					})
					Standard.belongsTo(models.category, {
						foreignKey: 'category_name'
					})
					Standard.belongsTo(models.menu, {
						as: 'menu',
						foreignKey: 'menu_id'
					})
					Standard.belongsToMany(models.user, {
						through: 'userStandardFavorite',
						onDelete: 'CASCADE'
					})
					Standard.belongsToMany(models.user, {
						through: 'userStandardHistory',
						onDelete: 'CASCADE'
					})
					Standard.belongsToMany(models.project, {
						as: 'projects',
						through: 'projectStandard',
						onDelete: 'CASCADE'
					})
					Standard.hasMany(models.standardVersion, {
						as: 'versions',
						foreignKey: 'code'
					})
					Standard.belongsToMany(models.standard, {
						through: 'standardReference',
						as: {
							singular: 'reference',
							plural: 'references'
						},
						foreignKey: 'code'
					})
					Standard.belongsToMany(models.standard, {
						through: 'standardReference',
						as: {
							singular: 'referrer',
							plural: 'referrers'
						},
						foreignKey: 'reference'
					})
				}
			}
		}
	)
	return Standard
}
