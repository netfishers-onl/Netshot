define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var DeviceConfigChangeModel = Backbone.Model.extend({

		urlRoot: "rs/changes",

		defaults: {}

	});

	return DeviceConfigChangeModel;

});
