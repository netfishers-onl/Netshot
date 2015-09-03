/** Copyright 2013-2014 NetFishers */
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
