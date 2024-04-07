/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'models/task/TaskModel'
], function($, _, Backbone, TaskModel) {

	return Backbone.Collection.extend({

		initialize: function(models, options) {
			if (typeof options === "object" && options && typeof options.device === "object" && options.device) {
				this.device = options.device;
			}
		},
		
		url: "api/tasks",

		deviceUrl: function() {
			return "api/devices/" + this.device.get('id') + "/tasks";
		},
		model: TaskModel,

		day: new Date(),
		device: null,
		limit: 20,
		offset: 0,

		fetch: function(options) {
			options || (options = {});
			
			if (this.device) {
				options.url = this.deviceUrl() + "?" + $.param({
					limit: this.limit,
				})
			}
			else {
				var params = {};
				if (this.status !== undefined) {
					params.status = this.status;
				}
				if (this.before !== undefined) {
					params.before = this.before;
				}
				if (this.after !== undefined) {
					params.after = this.after;
				}
				options.url = this.url + "?" + $.param(params);
			}

			return Backbone.Collection.prototype.fetch.call(this, options);
		},
		
	});

});
