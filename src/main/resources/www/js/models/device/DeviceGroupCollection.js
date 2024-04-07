/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
	'models/device/DeviceGroupModel'
], function(_, Backbone, DeviceGroupModel) {

	return Backbone.Collection.extend({

		url: "api/groups",
		model: DeviceGroupModel,

		comparator: function(config) {
			return config.get('name');
		}

	});

});
