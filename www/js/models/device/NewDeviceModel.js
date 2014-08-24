define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var NewDeviceModel = Backbone.Model.extend({

		url: "rs/devices",

		defaults: {
			'name': "No name",
			'ipAddress': "",
			'autoDiscover': true,
			'deviceType': "",
			'domainId': -1,
			'autoDiscoveryTask': -1
		}

	});

	return NewDeviceModel;

});
