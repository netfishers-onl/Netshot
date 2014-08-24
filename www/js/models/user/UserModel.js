define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var UserModel = Backbone.Model.extend({

		urlRoot: 'rs/users',

		defaults: {
			username: "login",
			local: true,
			level: 10,
			password: ""
		}

	});

	return UserModel;

});
