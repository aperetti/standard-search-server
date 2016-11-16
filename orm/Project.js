
'use strict';

module.exports = function(sequelize, Types) {
    var Project = sequelize.define(
        'project',
        {
            id: {
                type: Types.UUID,
                defaultValue: Types.UUIDV4,
                primaryKey: true
            },
            name: {
                type: Types.STRING,
                allowNull: false
            },
            description: {
                type: Types.STRING,
            }
        },
        {
            classMethods: {
                associate: function(models) {
                    Project.belongsToMany(models.standard, {
                        as: 'standards',
                        through: 'projectStandard',
                        onDelete: 'CASCADE'
                    })
                    Project.belongsTo(models.user, {
                        as: 'owner',
                        foreignKey: 'ownerId'
                    })
                    Project.belongsToMany(models.user, {
                        through: 'projectSubscription'
                    })
                }
            }
        }
    )

    return Project
}



