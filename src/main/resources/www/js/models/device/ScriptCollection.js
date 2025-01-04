/** Copyright 2013-2025 Netshot */
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
