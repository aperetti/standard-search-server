
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
				}
			}
		}
	)
	return Standard
}
