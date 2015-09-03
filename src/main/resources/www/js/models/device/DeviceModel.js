/** Copyright 2013-2014 NetFishers */
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
				'mgmtDomain'
			]);
			options.attrs = attrs;
			return Backbone.Model.prototype.save.call(this, attrs, options);
		},

	});

});
