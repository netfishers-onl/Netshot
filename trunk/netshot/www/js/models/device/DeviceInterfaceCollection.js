define([
	'underscore',
	'backbone',
	'models/device/DeviceInterfaceModel'
], function(_, Backbone, DeviceInterfaceModel) {

	var DeviceInterfaceCollection = Backbone.Collection.extend({

		initialize: function(models, options) {
			this.device = options.device;
		},

		url: function() {
			return "rs/devices/" + this.device.get('id') + "/interfaces"
		},

		model: DeviceInterfaceModel,

	});

	return DeviceInterfaceCollection;

});
