/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		urlRoot: "api/credentialsets",

		defaults: {
			'type': "SNMP v2",
			'name': "Name",
			'community': "public",
			'username': "login",
			'password': "=",
			'superPassword': "=",
			'publicKey': "",
			'privateKey': ""
		},

		save: function(attrs, options) {
			attrs = attrs || this.toJSON();
			options = options || {};
			var type = (typeof attrs['type'] == 'undefined' ? this.get('type')
					: attrs['type']);
			var selAttrs = [
				'id',
				'type',
				'name',
				'mgmtDomain'
			];
			if (type.match(/SNMP/i)) {
				selAttrs.push('community');
			}
			else if (type.match(/(Telnet|SSH)/i)) {
				selAttrs.push('username', 'password', 'superPassword');
				if (type.match(/Key/)) {
					selAttrs.push('publicKey', 'privateKey');
				}
			}
			options.attrs = _.pick(attrs, selAttrs);
			return Backbone.Model.prototype.save.call(this, attrs, options);
		}

	});

});
