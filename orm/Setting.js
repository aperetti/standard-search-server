
'use strict';

module.exports = function(sequelize, Types) {
    var Setting = sequelize.define(
        'setting',
        {
            id: {
                type: Types.STRING,
                primaryKey: true
            },
            value: {
                type: Types.TEXT()
            }
        }
    )

    return Setting
}



