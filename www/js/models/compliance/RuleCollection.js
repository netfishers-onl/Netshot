define([
	'underscore',
	'backbone',
	'models/compliance/RuleModel'
], function(_, Backbone, RuleModel) {

	var RuleCollection = Backbone.Collection.extend({

		model: RuleModel,

		initialize: function(options) {
			this.policy = options.policy;
		},

		url: function() {
			return "rs/rules/policy/" + this.policy.get('id');
		},

		comparator: function(config) {
			return config.get('name');
		}

	});

	return RuleCollection;

});
