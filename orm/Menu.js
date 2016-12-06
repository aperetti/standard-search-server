
'use strict';

module.exports = function(sequelize, Types) {
    var Menu = sequelize.define(
        'menu',
        {
            id: {
                type: Types.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
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
            hierarchy: true,
            classMethods: {
                associate: function(models) {
                    Menu.hasMany(models.standard, {
                        as: 'standards'
                    })
                }
            }
        }
    )
    
    return Menu
}



