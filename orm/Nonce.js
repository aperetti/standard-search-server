
'use strict';

module.exports = function(sequelize, Types) {
	var TempStandard = sequelize.define(
		'tempStandard',
		{
			id: {
				type: Types.UUID,
				defaultValue: Types.UUIDV4,
				primaryKey: true
			}
		}
	)
	return TempStandard
}
