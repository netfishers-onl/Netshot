/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
	'models/user/UserModel'
], function(_, Backbone, UserModel) {

	return Backbone.Collection.extend({

		url: "api/users",
		model: UserModel

	});

});
