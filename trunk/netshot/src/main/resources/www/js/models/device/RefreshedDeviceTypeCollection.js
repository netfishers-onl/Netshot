/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
	'models/device/DeviceTypeCollection'
], function(_, Backbone, DeviceTypeCollection) {

	return DeviceTypeCollection.extend({

		url: "api/refresheddevicetypes",

	});

});
