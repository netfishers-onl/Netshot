define([
	'underscore',
	'backbone',
	'models/device/DeviceGroupModel'
], function(_, Backbone, DeviceGroupModel) {

	var DeviceGroupCollection = Backbone.Collection.extend({

		url: "rs/groups",
		model: DeviceGroupModel,

		comparator: function(config) {
			return config.get('name');
		}

	});

	return DeviceGroupCollection;

});
