'use strict'

module.exports = function(sequelize, Types) {
  var Standard = sequelize.define(
    'standard', {
      id: {
        type: Types.UUID,
        defaultValue: Types.UUIDV4,
        primaryKey: true
      },
      code: {
        type: Types.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Types.STRING,
      },
      status: {
        type: Types.ENUM('ACTIVE', 'OBSOLETE', 'DELETED'),
        defaultValue: 'ACTIVE'
      }
    }, {
      paranoid: true,
      classMethods: {
        associate: function(models) {
          Standard.belongsTo(models.category, {
            foreignKey: 'category_name'
          })
          Standard.belongsTo(models.menu, {
            as: 'menu',
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
            onDelete: 'CASCADE'
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
