define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var PolicyModel = Backbone.Model.extend({

		urlRoot: "rs/policies",

		save: function(attrs, options) {
			attrs = attrs || this.toJSON();
			options = options || {};
			attrs = _.pick(attrs, [
				'id',
				'name',
				'group'
			]);
			options.attrs = attrs;
			return Backbone.Model.prototype.save.call(this, attrs, options);
		},

	});

	return PolicyModel;

});
