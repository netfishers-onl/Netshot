/** Copyright 2013-2020 NetFishers */
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
