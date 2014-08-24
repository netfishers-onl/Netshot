define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var DeviceModuleModel = Backbone.Model.extend({

		urlRoot: "rs/devices",

		defaults: {},

	});

	return DeviceModuleModel;

});
