/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		initialize: function(options) {
			this.groups = options.groups;
			this.domains = options.domains;
			this.interfaces = options.interfaces;
			this.inventory = options.inventory;
			this.locations = options.locations;
			this.compliance = options.compliance;
		},

		getDownloadUrl: function() {
			var url = "api/reports/export";
			var params = [];
			if (typeof this.days !== "undefined") {
				params.push("days=" + this.days);
			}
			if (this.domains) {
				_.forEach(this.domains, function(domain) {
					params.push("domain=" + domain);
				});
			}
			if (this.groups) {
				_.forEach(this.groups, function(group) {
					params.push("group=" + group);
				});
			}
			if (this.interfaces) {
				params.push("interfaces=true");
			}
			if (this.inventory) {
				params.push("inventory=true");
			}
			if (this.locations) {
				params.push("locations=true");
			}
			if (this.compliance) {
				params.push("compliance=true");
			}
			if (params.length) {
				url += "?" + params.join("&");
			}
			return url;
		}

	});

});
