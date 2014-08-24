define([
	'underscore',
	'backbone',
	'models/user/UserModel'
], function(_, Backbone, UserModel) {

	var UserCollection = Backbone.Collection.extend({

		url: "rs/users",
		model: UserModel

	});

	return UserCollection;

});
