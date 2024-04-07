/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
	'models/hook/HookModel'
], function(_, Backbone, HookModel) {

	return Backbone.Collection.extend({

		url: "api/hooks",
		model: HookModel

	});

});
