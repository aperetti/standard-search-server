

'use strict';

module.exports = function(sequelize, Types) {
	var StandardReference = sequelize.define(
			'standardReference', 
			{},
			{
			    freezeTableName: true
			})
	return StandardReference
}



