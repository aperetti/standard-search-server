
'use strict';

module.exports = function(sequelize, Types) {
	var Category = sequelize.define(
		'category',
		{
			name: {
				type: Types.STRING,
				primaryKey: true
			},
			description: {
				type: Types.STRING,
				allowNull: false
			},
			regex: {
				type: Types.STRING
			}
		},
        {
            classMethods: {
                associate: function(models) {
                    Category.hasMany(models.standard, {
                        foreignKey: 'category_name'
                    })
                }
            }
        }
	)
	return Category
}
