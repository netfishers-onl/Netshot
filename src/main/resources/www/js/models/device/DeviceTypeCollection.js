/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
	'models/device/DeviceTypeModel'
], function(_, Backbone, DeviceTypeModel) {

	return Backbone.Collection.extend({

		url: "api/devicetypes",

		model: DeviceTypeModel,
		
		comparator: "name"

	});

});
