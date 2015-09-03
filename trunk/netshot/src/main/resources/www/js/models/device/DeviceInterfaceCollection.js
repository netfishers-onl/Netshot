/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
	'models/device/DeviceInterfaceModel'
], function(_, Backbone, DeviceInterfaceModel) {

	return Backbone.Collection.extend({

		initialize: function(models, options) {
			this.device = options.device;
		},

		url: function() {
			return "api/devices/" + this.device.get('id') + "/interfaces"
		},

		model: DeviceInterfaceModel,

	});
});
