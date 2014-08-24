define([
	'underscore',
	'backbone',
	'models/device/DeviceModel'
], function(_, Backbone, DeviceModel) {

	var DeviceCollection = Backbone.Collection
			.extend({

				url: "rs/devices",
				searchUrl: "rs/devices/search",
				groupUrl: "rs/devices/group/",
				ruleUrl: "rs/devices/rule/",
				model: DeviceModel,
				
				initialize: function() {
					this.resetFilter();
				},
				
				resetFilter: function() {
					this.filter = {
						type: "none", // simple, advanced, group, rule
						text: "",
						query: "",
						group: 0,
						rule: 0,
						vendorModel: "org.netshot.device.Device"
					};
				},

				fetch: function(options) {
					options || (options = {});
					var data = (options.data || {});
					
					if (this.filter.type == "group") {
						options.url = this.groupUrl + this.filter.group;
					}
					else if (this.filter.type == "rule") {
						options.url = this.ruleUrl + this.filter.rule;
					}
					else if (this.filter.type == "simple" || this.filter.type == "advanced") {
						options.url = this.searchUrl;
						options.type = "POST";
						options.contentType = "application/json; charset=utf-8";
						if (this.filter.type == "simple") {
							this.autoQuery();
						}
						options.data = JSON.stringify({
							query: this.filter.query,
							deviceClassName: this.filter.vendorModel
						});
					}
					return Backbone.Collection.prototype.fetch.call(this, options);
				},

				parse: function(response, options) {
					this.filter.query = "";
					if (!$.isArray(response) && typeof (response['query']) == "string") {
						this.filter.query = response['query'];
						response = response['devices'];
					}
					return response;
				},

				autoQuery: function() {
					var text = this.filter.text;
					var query = "";
					var ipv4 = "(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)";
					var maskv4 = "/([0-9]|1[0-9]|2[0-9]|3[0-2])";
					var ipv6 = "((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|(([0-9A-Fa-f]{1,4}:){0,5}:((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|(::([0-9A-Fa-f]{1,4}:){0,5}((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))";
					var maskv6 = "/([0-9]|[0-9][0-9]|1[01][0-9]|12[0-8])";
					if (text.match(new RegExp("^" + ipv4 + maskv4 + "$"))
							|| text.match(new RegExp("^" + ipv6 + maskv6 + "$"))) {
						query = "[IP] IN " + text;
					}
					else if (text.match(new RegExp("^" + ipv4 + "$"))
							|| text.match(new RegExp("^" + ipv6 + "$"))) {
						query = "[IP] IS " + text;
					}
					else {
						query = '[Name] CONTAINS "' + text.replace(/"/, "\\\"") + '"';
					}
					this.filter.query = query;
					this.filter.vendorModel = "org.netshot.device.Device";
				},

				comparator: function(config) {
					return config.get('name');
				}

			});

	return DeviceCollection;

});
