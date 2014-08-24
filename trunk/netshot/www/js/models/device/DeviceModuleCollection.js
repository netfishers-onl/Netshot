define([
	'underscore',
	'backbone',
	'models/device/DeviceModuleModel'
], function(_, Backbone, DeviceModuleModel) {

	var DeviceModuleCollection = Backbone.Collection.extend({

		initialize: function(models, options) {
			this.device = options.device;
		},

		url: function() {
			return "rs/devices/" + this.device.get('id') + "/modules"
		},

		model: DeviceModuleModel,

	});

	return DeviceModuleCollection;

});
