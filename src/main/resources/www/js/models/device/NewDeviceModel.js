/** Copyright 2013-2025 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		url: "api/devices",

		defaults: {
			'name': "No name",
			'ipAddress': "",
			'autoDiscover': true,
			'deviceType': "",
			'domainId': -1,
			'autoDiscoveryTask': -1
		}

	});

});
