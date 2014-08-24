define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var DeviceTypeModel = Backbone.Model.extend({

		defaults: {
			'name': "No name",
			'description': "No description"
		}

	});

	return DeviceTypeModel;

});
