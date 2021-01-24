/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		urlRoot: "api/tasks",

		constructor: function(attributes, options) {
			Backbone.Model.apply(this, [
				attributes,
				_.omit(options, 'url')
			]);
		},

		getSignificantDate: function() {
			switch (this.get('status')) {
			case "SCHEDULED":
				var d = this.get('nextExecutionDate');
				if (typeof (d) == "undefined") {
					return "As soon as possible";
				}
				return this.get('nextExecutionDate');
			case "RUNNING":
			case "SUCCESS":
			case "FAILURE":
				return this.get('executionDate');
			default:
				return 0;
			}
		},

		getDebugLogUrl: function() {
			return this.urlRoot + "/" + this.get('id') + "/debuglog";
		},

		toJSON: function() {
			var j = _(this.attributes).clone();
			j.significantDate = this.getSignificantDate();
			return j;
		},

		save: function(attrs, options) {
			attrs = attrs || this.toJSON();
			options = options || {};
			attrs = _.pick(attrs, [
				'id',
				'cancelled',
				'type',
				'device',
				'domain',
				'group',
				'subnets',
				'scheduleReference',
				'scheduleType',
				'scheduleFactor',
				'comments',
				'limitToOutofdateDeviceHours',
				'daysToPurge',
				'configDaysToPurge',
				'configSizeToPurge',
				'configKeepDays',
				'driver',
				'script',
				'debugEnabled',
				'dontRunDiagnostics',
				'dontCheckCompliance'
			]);
			options.attrs = attrs;
			return Backbone.Model.prototype.save.call(this, attrs, options);
		},

	});

});
