var esRiver = require('../helpers/es').river()

'use strict';

module.exports = function(sequelize, Types) {
  var StandardVersion = sequelize.define(
    'standardVersion', {
      id: {
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
    }, {
      classMethods: {
        associate: function(models) {
          StandardVersion.belongsTo(models.standard, {
            onDelete: 'CASCADE',
            as: 'standard'
          })
        }
      }
    }
  )
  return StandardVersion
}
