/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
	'models/device/DeviceModuleModel'
], function(_, Backbone, DeviceModuleModel) {

	return Backbone.Collection.extend({

		initialize: function(models, options) {
			this.device = options.device;
		},

		url: function() {
			return "api/devices/" + this.device.get('id') + "/modules"
		},

		model: DeviceModuleModel,

	});

});
