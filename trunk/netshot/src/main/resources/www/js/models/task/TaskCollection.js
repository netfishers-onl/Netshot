/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
	'models/task/TaskModel'
], function(_, Backbone, TaskModel) {

	return Backbone.Collection.extend({

		initialize: function(models, options) {
			if (typeof(options) == "object" && typeof(options.device) == "object") {
				this.device = options.device;
			}
		},
		
		url: "api/tasks",
		searchUrl: "api/tasks/search",
		deviceUrl: function() {
			return "api/devices/" + this.device.get('id') + "/tasks";
		},
		model: TaskModel,

		status: "ANY",
		day: new Date(),
		device: null,

		fetch: function(options) {
			options || (options = {});
			var data = (options.data || {});
			
			if (this.device) {
				options.url = this.deviceUrl();
			}
			else {
				options.url = this.searchUrl;
				options.type = "POST";
				options.contentType = "application/json; charset=utf-8";
				options.data = JSON.stringify({
					status: this.status,
					day: this.day.getTime()
				});
			}

			return Backbone.Collection.prototype.fetch.call(this, options);
		},
		
	});

});
