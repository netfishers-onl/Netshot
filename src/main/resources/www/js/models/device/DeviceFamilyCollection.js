/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
	'models/device/DeviceFamilyModel'
], function(_, Backbone, DeviceFamilyModel) {

	return Backbone.Collection.extend({

		url: "api/devicefamilies",

		model: DeviceFamilyModel,

	});

});
