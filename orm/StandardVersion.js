var esRiver = require('../helpers/esRiver')()

'use strict';

module.exports = function(sequelize, Types) {
	var StandardVersion = sequelize.define(
		'standardVersion',
		{
			sv_id: {
				type: Types.UUID,
				defaultValue: Types.UUIDV4,
				primaryKey: true
			},
			text: {
				type: Types.TEXT('medium')
			},
			file: {
				type: Types.BLOB('medium')
			},
			note: {
				type: Types.TEXT('small')
			}
		},
		{
			hooks: {
				afterCreate: function (instance, options) {
					esRiver.indexStandardVersion(instance.code, {text: instance.text}).then(() => console.log('Updated Standard'))
				},
				afterUpdate: function (instance, options) {

					esRiver.indexStandardVersion(instance.code, {text: instance.text}).then(() => console.log('Updated Standard'))
				},
				afterSave: function (instance, options) {
					esRiver.indexStandardVersion(instance.code, {text: instance.text}).then(() => console.log('Updated Standard'))
				},
				afterDelete: function (instance, options) {
					esRiver.deleteStandardVersion(instance.code).then(() => console.log('Deleted Standard'))
				}
			},
      		classMethods: {
				associate: function(models) {
					StandardVersion.belongsTo(models.standard, {
						foreignKey: 'code',
						onDelete: 'CASCADE',
            			as: 'standard'
					})
				}
			}
		}
	)
	return StandardVersion
}



