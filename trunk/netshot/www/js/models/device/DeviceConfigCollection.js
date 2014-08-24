define([
	'underscore',
	'backbone',
	'models/device/DeviceConfigModel'
], function(_, Backbone, DeviceConfigModel) {

	var DeviceConfigCollection = Backbone.Collection.extend({

		initialize: function(models, options) {
			this.device = options.device;
		},

		url: function() {
			return "rs/devices/" + this.device.get('id') + "/configs"
		},

		model: DeviceConfigModel,

		comparator: function(config) {
			return config.get('changeDate') * -1;
		}

	});

	return DeviceConfigCollection;

});
