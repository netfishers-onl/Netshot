/** Copyright 2013-2025 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		urlRoot: "api/devices",

		defaults: {
			'name': "None"
		},

	});

});
