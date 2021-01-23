/** Copyright 2013-2020 NetFishers */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		urlRoot: "api/hooks",

		allTriggers: [{
			type: "POST_TASK",
			item: "TakeSnapshotTask",
			description: "After device snapshot",
		}, {
			type: "POST_TASK",
			item: "RunDeviceScriptTask",
			description: "After JS script executed on device",
		}, {
			type: "POST_TASK",
			item: "RunDiagnosticsTask",
			description: "After diagnostics performed on device",
		}],

		defaults: {
			name: "",
			enabled: true,
			sslValidation: true,
			type: "Web",
			url: "https://example.com/callback",
			action: "POST_JSON",
			triggers: [],
		},
		
		save: function(attrs, options) {
			attrs = attrs || this.toJSON();
			options = options || {};
			attrs = _.pick(attrs, [
				"id",
				"name",
				"enabled",
				"type",
				"url",
				'action',
				"triggers",
				'sslValidation',
			]);
			options.attrs = attrs;
			return Backbone.Model.prototype.save.call(this, attrs, options);
		},

	});

});
