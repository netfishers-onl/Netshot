/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
	'models/device/PartNumberModel'
], function(_, Backbone, PartNumberModel) {

	return Backbone.Collection.extend({

		url: "api/partnumbers",

		model: PartNumberModel,

	});

});
