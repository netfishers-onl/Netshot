define([
	'underscore',
	'backbone',
	'models/device/DeviceConfigChangeModel'
], function(_, Backbone, DeviceConfigChangeModel) {

	var DeviceConfigChangeCollection = Backbone.Collection.extend({

		url: "rs/changes",

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

	return DeviceConfigChangeCollection;

});
