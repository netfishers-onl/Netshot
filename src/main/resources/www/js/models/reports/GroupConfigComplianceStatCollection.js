/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Collection.extend({
		
		initialize: function(models, options) {
			this.domains = options.domains;
			this.deviceGroups = options.deviceGroups;
			this.policies = options.policies;
		},

		url: function() {
			var url = "api/reports/groupconfigcompliancestats";
			var params = [];
			if (this.domains) {
				_.forEach(this.domains, function(domain) {
					params.push("domain=" + domain);
				});
			}
			if (this.deviceGroups) {
				_.forEach(this.deviceGroups, function(group) {
					params.push("group=" + group);
				});
			}
			if (this.policies) {
				_.forEach(this.policies, function(policy) {
					params.push("policy=" + policy);
				});
			}
			if (params.length) {
				url += "?" + params.join("&");
			}
			return url;
		},

	});

});