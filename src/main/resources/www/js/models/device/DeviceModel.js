/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		urlRoot: "api/devices",

		constructor: function(attributes, options) {
			Backbone.Model.apply(this, [
				attributes,
				_.omit(options, 'url')
			]);
		},

		defaults: {
			'name': "No name"
		},

		save: function(attrs, options) {
			attrs = attrs || this.toJSON();
			options = options || {};
			attrs = _.pick(attrs, [
				'id',
				'ipAddress',
				'comments',
				'autoTryCredentials',
				'credentialSetIds',
				'clearCredentialSetIds',
				'enabled',
				'mgmtDomain',
				'connectIpAddress',
				'sshPort',
				'telnetPort',
				'specificCredentialSet'
			]);
			options.attrs = attrs;
			return Backbone.Model.prototype.save.call(this, attrs, options);
		},

		getPrimaryCredentialSet: function() {
			var that = this;
			var all = this.get("credentialSets");
			var options = [
				function() { return that.get("specificCredentialSet"); },
				function() { return _.findWhere(all, { type: "SSH" }); },
				function() { return _.findWhere(all, { type: "Telnet" }); },
			];
			for (var option of options) {
				var result = option();
				if (result) {
					return result;
				}
			}
			return null;
		},

		getConnectUri: function() {
			var protocol = null;
			var host = null;
			var port = null;
			var primaryCredSet = this.getPrimaryCredentialSet();
			if (!primaryCredSet) {
				return null;
			}
			if (primaryCredSet.type === "SSH") {
				protocol = "ssh://";
				port = this.get("sshPort") || 22;
			}
			else if (primaryCredSet.type === "Telnet") {
				protocol = "telnet://";
				port = this.get("telnetPort") || 23;
			}
			else {
				return null;
			}
			host = this.get("connectAddress") || this.get("mgmtAddress");
			return protocol + host + ":" + port;
		},

	});

});
