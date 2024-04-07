/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Collection.extend({

		initialize: function(models, options) {
			this.group = options.group;
			this.domains = options.domains;
			this.policies = options.policies;
		},

		url: function() {
			var url = "api/reports/groupconfignoncompliantdevices/" + this.group;
			var params = [];
			if (this.domains) {
				_.forEach(this.domains, function(domain) {
					params.push("domain=" + domain);
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

		comparator: function(config) {
			return config.get('id') + config.get('policyName');
		}

	});

});