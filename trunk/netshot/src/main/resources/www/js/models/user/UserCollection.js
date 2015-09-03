/** Copyright 2013-2014 NetFishers */
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
