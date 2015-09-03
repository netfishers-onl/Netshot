/** Copyright 2013-2014 NetFishers */
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
