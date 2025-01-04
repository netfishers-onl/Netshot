/** Copyright 2013-2025 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		urlRoot: "api/domains",

		defaults: {
			name: "Domain Name",
			description: "Description",
			ipAddress: "0.0.0.0"
		}

	});

});
