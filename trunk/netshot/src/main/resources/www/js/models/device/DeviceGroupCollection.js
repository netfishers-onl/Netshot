/** Copyright 2013-2014 NetFishers */
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
