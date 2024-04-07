/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		initialize: function(options) {
			this.groups = options.groups;
			this.domains = options.domains;
			this.exportGroups = options.exportGroups;
			this.exportInterfaces = options.exportInterfaces;
			this.exportInventory = options.exportInventory;
			this.exportInventoryHistory = options.exportInventoryHistory;
			this.exportLocations = options.exportLocations;
			this.exportCompliance = options.exportCompliance;
			this.exportDeviceDriverAttributes = options.exportDeviceDriverAttributes;
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
			if (this.exportGroups) {
				params.push("groups=true");
			}
			if (this.exportInterfaces) {
				params.push("interfaces=true");
			}
			if (this.exportInventory) {
				params.push("inventory=true");
				if (this.exportInventoryHistory) {
					params.push("inventoryhistory=true");
				}
			}
			if (this.exportLocations) {
				params.push("locations=true");
			}
			if (this.exportCompliance) {
				params.push("compliance=true");
			}
			if (this.exportDeviceDriverAttributes) {
				params.push("devicedriverattributes=true");
			}
			if (params.length) {
				url += "?" + params.join("&");
			}
			return url;
		}

	});

});
