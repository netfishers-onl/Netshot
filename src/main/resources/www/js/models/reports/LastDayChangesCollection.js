/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Collection.extend({

		url: "api/reports/last7dayschangesbyday",

		url: function() {
			var url = "api/reports/last7dayschangesbyday";
			try {
				var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
				url += "?tz=" + encodeURIComponent(tz);
			}
			catch (e) {
				// Proceed without TZ
			}
			return url;
		},

	});

});
