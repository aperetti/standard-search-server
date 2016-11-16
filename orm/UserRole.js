

'use strict';

module.exports = function(sequelize, Types) {
    var UserRole = sequelize.define(
        'userRole',
        {
            ur_id: {
                type: Types.UUID,
                defaultValue: Types.UUIDV4,
                primaryKey: true
            }
        }
    )
    return UserRole
}

