/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Collection.extend({

		initialize: function(models, options) {
			this.days = options.days;
			this.domains = options.domains;
		},

		url: function() {
			var url = "api/reports/accessfailuredevices";
			var params = [];
			if (typeof this.days !== "undefined") {
				params.push("days=" + this.days);
			}
			if (this.domains) {
				_.forEach(this.domains, function(domain) {
					params.push("domain=" + domain);
				});
			}
			if (params.length) {
				url += "?" + params.join("&");
			}
			return url;
		},
		
		comparator: function(item) {
			return [item.get("lastSuccess"), item.get("lastFailure")];
		}

	});

});