define([
	'underscore',
	'backbone',
	'models/device/DeviceTypeModel'
], function(_, Backbone, DeviceTypeModel) {

	var DeviceTypeCollection = Backbone.Collection.extend({

		url: "rs/devicetypes",

		model: DeviceTypeModel,
		
		comparator: "name"

	});

	return DeviceTypeCollection;

});
