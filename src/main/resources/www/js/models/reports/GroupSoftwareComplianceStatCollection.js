/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Collection.extend({

		initialize: function(models, options) {
			this.domains = options.domains;
		},

		url: function() {
			var url = "api/reports/groupsoftwarecompliancestats";
			var params = [];
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

	});

});