/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
	'models/compliance/RuleModel'
], function(_, Backbone, RuleModel) {

	return Backbone.Collection.extend({

		model: RuleModel,

		initialize: function(options) {
			this.policy = options.policy;
		},

		url: function() {
			return "api/rules/policy/" + this.policy.get('id');
		},

		comparator: function(config) {
			return config.get('name');
		}

	});

});
