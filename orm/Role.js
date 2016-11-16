
'use strict';

module.exports = function(sequelize, Types) {
    var Role = sequelize.define(
        'role',
        {
            type: {
                type: Types.STRING,
                allowNull: false,
                primaryKey: true
            }
        },
        {
            classMethods: {
                associate: function(models) {
                    Role.belongsToMany(models.user, {
                        through: 'userRole',
                        onDelete: 'CASCADE'
                    })
                }
            }
        }
    )

    return Role
}



