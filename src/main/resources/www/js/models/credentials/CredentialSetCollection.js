/** Copyright 2013-2025 Netshot */
define([
	'underscore',
	'backbone',
	'models/credentials/CredentialSetModel'
], function(_, Backbone, CredentialSetModel) {

	return Backbone.Collection.extend({

		url : "api/credentialsets",

		model: CredentialSetModel,

	});

});
