/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
	'models/device/DeviceModuleModel'
], function(_, Backbone, DeviceModuleModel) {

	return Backbone.Collection.extend({

		initialize: function(models, options) {
			this.device = options.device;
			this.includeHistory = options.includeHistory;
		},

		url: function() {
			var url = "api/devices/" + this.device.get('id') + "/modules";
			if (this.includeHistory) {
				url += "?history=true"
			}
			return url;
		},

		model: DeviceModuleModel,

	});

});
