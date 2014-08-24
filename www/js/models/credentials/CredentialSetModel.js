define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var CredentialSetModel = Backbone.Model.extend({

		urlRoot: "rs/credentialsets",

		defaults: {
			'type': ".DeviceSnmpv2cCommunity",
			'name': "Name",
			'community': "public",
			'username': "login",
			'password': "=",
			'superPassword': "="
		},

		getProtocol: function() {
			switch (this.get('type')) {
			case ".DeviceSnmpv1Community":
				return "SNMP v1";
			case ".DeviceSnmpv2cCommunity":
				return "SNMP v2c";
			case ".DeviceSshAccount":
				return "SSH";
			case ".DeviceTelnetAccount":
				return "Telnet";
			}
			return "Unknown";
		},

		toJSON: function() {
			var j = _(this.attributes).clone();
			j.protocol = this.getProtocol();
			return j;
		},

		save: function(attrs, options) {
			attrs = attrs || this.toJSON();
			options = options || {};
			var type = (typeof attrs['type'] == 'undefined' ? this.get('type')
					: attrs['type']);
			if (type.match(/Snmp/)) {
				attrs = _.pick(attrs, [
					'id',
					'type',
					'name',
					'mgmtDomain',
					'community'
				]);
			}
			else if (type.match(/(Telnet|Ssh)/)) {
				attrs = _.pick(attrs, [
					'id',
					'type',
					'name',
					'mgmtDomain',
					'username',
					'password',
					'superPassword'
				]);
			}
			options.attrs = attrs;
			return Backbone.Model.prototype.save.call(this, attrs, options);
		}

	});

	return CredentialSetModel;

});
