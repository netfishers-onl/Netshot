/** Copyright 2013-2025 Netshot */
define([
	'underscore',
	'backbone',
	'models/user/ApiTokenModel'
], function(_, Backbone, ApiTokenModel) {

	return Backbone.Collection.extend({

		url: "api/apitokens",
		model: ApiTokenModel

	});

});
