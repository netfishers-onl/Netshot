define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var CurrentUserModel = Backbone.Model.extend({

		urlRoot: 'rs/user',

		isAdmin: function() {
			return this.get('level') >= 1000;
		},

		defaults: {
			clientVersion: '0.2.8'
		},

		save: function(attrs, options) {
			attrs = attrs || this.toJSON();
			options = options || {};
			attrs = _.pick(attrs, [
				'username',
				'password',
				'newPassword'
			]);
			options.attrs = attrs;
			return Backbone.Model.prototype.save.call(this, attrs, options);
		},

	});

	return CurrentUserModel;

});
