/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var CredentialSetModel = Backbone.Model.extend({

		urlRoot: "api/credentialsets",

		defaults: {
			'type': "SNMP v2",
			'name': "Name",
			'community': "public",
			'username': "login",
			'password': "=",
			'superPassword': "=",
			'publicKey': "",
			'privateKey': "",
			'username': "",
			'authType': "SHA",
			'authKey': "",
			'privType': "DES",
			'privKey': ""
		},
		
		authTypes: ["MD5", "SHA"],
		privTypes: ["DES", "AES128", "AES192", "AES256"],

		cleanUp: function(attrs) {
			var type = (typeof attrs['type'] == 'undefined' ? this.get('type') : attrs['type']);
			var selAttrs = [
				'id',
				'type',
				'name',
				'mgmtDomain'
			];
			if (type.match(/SNMP v(1|2)/i)) {
				selAttrs.push('community');
			}
			else if ( type.match(/SNMP v3/i)) {  
				selAttrs.push('username', 'authType', 'authKey' , 'privType', 'privKey');
			}
			else if (type.match(/(Telnet|SSH)/i)) {
				selAttrs.push('username', 'password', 'superPassword');
				if (type.match(/Key/)) {
					selAttrs.push('publicKey', 'privateKey');
				}
			}
			return _.pick(attrs, selAttrs);
		},

		save: function(attrs, options) {
			attrs = attrs || this.toJSON();
			options = options || {};
			options.attrs = this.cleanUp(attrs);
			return Backbone.Model.prototype.save.call(this, attrs, options);
		}

	});

	return CredentialSetModel;

});
