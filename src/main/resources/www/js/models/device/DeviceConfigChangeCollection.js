/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
	'models/device/DeviceConfigChangeModel'
], function(_, Backbone, DeviceConfigChangeModel) {

	return Backbone.Collection.extend({

		url: "api/changes",

		model: DeviceConfigChangeModel,

		toDate: new Date(),
		fromDate: new Date(),

		url: function() {
			return "api/configs" + "?after=" + this.fromDate.getTime() + "&before=" + this.toDate.getTime();
		},

	});

});
