define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var DeviceInterfaceModel = Backbone.Model.extend({

		urlRoot: "rs/devices",

		defaults: {
			'name': "None"
		},

	});

	return DeviceInterfaceModel;

});
