/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
	'models/device/ScriptModel'
], function(_, Backbone, ScriptModel) {

	return Backbone.Collection.extend({

		url: "api/scripts",

		model: ScriptModel,
		
		comparator: "name"

	});

});
