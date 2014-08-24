define([
	'underscore',
	'backbone',
	'models/device/PartNumberModel'
], function(_, Backbone, PartNumberModel) {

	var PartNumberCollection = Backbone.Collection.extend({

		url: "rs/partnumbers",

		model: PartNumberModel,

	});

	return PartNumberCollection;

});
