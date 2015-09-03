/** Copyright 2013-2014 NetFishers */
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
