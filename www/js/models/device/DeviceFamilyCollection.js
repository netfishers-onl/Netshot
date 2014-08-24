define([
	'underscore',
	'backbone',
	'models/device/DeviceFamilyModel'
], function(_, Backbone, DeviceFamilyModel) {

	var DeviceFamilyCollection = Backbone.Collection.extend({

		url: "rs/devicefamilies",

		model: DeviceFamilyModel,

	});

	return DeviceFamilyCollection;

});
