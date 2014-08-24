define([
	'underscore',
	'backbone',
	'models/credentials/CredentialSetModel'
], function(_, Backbone, CredentialSetModel) {

	var CredentialSetCollection = Backbone.Collection.extend({

		url : "rs/credentialsets",

		model: CredentialSetModel,

	});

	return CredentialSetCollection;

});
