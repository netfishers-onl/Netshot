/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		urlRoot: "api/user",

		isAdmin: function() {
			return this.get('level') >= 1000;
		},

		isExecuteReadWrite: function() {
			return this.get('level') >= 500;
		},

		isReadWrite: function() {
			return this.get('level') >= 100;
		},

		isOperator: function() {
			return this.get('level') >= 50;
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

});
