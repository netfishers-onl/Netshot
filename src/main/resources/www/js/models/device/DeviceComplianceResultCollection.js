/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
	'models/compliance/RuleModel'
	], function(_, Backbone, RuleModel) {

	return Backbone.Collection.extend({

		model: RuleModel,

		initialize: function(models, options) {
			this.device = options.device;
		},

		url: function() {
			return "api/devices/" + this.device.get('id') + "/complianceresults";
		},

		comparator: function(config) {
			return config.get('name');
		}

	});

});
