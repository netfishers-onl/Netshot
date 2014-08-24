define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var RuleModel = Backbone.Model.extend({

		urlRoot: "rs/rules",

		save: function(attrs, options) {
			attrs = attrs || this.toJSON();
			options = options || {};
			attrs = _.pick(attrs, [
				'id',
				'name',
				'enabled',
				'policy',
				'script',
				'exemptions'
			]);
			options.attrs = attrs;
			return Backbone.Model.prototype.save.call(this, attrs, options);
		},

	});

	return RuleModel;

});
