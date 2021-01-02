/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
	'models/device/DeviceTypeModel'
], function(_, Backbone, DeviceTypeModel) {

	return Backbone.Collection.extend({

		model: DeviceTypeModel,

		initialize: function(models, options) {
			if (options) {
				this.refresh = options.refresh;
			}
		},

		url: function() {
			var u = "api/devicetypes";
			if (this.refresh) {
				u += "?refresh=true";
			}
			return u;
		},
		
		comparator: "name"

	});

});
