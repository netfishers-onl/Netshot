/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
	'models/device/DeviceConfigModel'
], function(_, Backbone, DeviceConfigModel) {

	return Backbone.Collection.extend({

		initialize: function(models, options) {
			this.device = options.device;
		},

		url: function() {
			return "api/devices/" + this.device.get('id') + "/configs";
		},

		model: DeviceConfigModel,

		comparator: function(config) {
			return config.get('changeDate') * -1;
		}

	});

});
