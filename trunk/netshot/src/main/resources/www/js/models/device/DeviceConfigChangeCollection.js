/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
	'models/device/DeviceConfigChangeModel'
], function(_, Backbone, DeviceConfigChangeModel) {

	return Backbone.Collection.extend({

		url: "api/changes",

		model: DeviceConfigChangeModel,

		toDate: new Date(),
		fromDate: new Date(),

		fetch: function(options) {
			options || (options = {});
			var data = (options.data || {});

			options.url = this.url;
			options.type = "POST";
			options.contentType = "application/json; charset=utf-8";
			options.data = JSON.stringify({
				fromDate: this.fromDate.getTime(),
				toDate: this.toDate.getTime()
			});

			return Backbone.Collection.prototype.fetch.call(this, options);
		},

	});

});
