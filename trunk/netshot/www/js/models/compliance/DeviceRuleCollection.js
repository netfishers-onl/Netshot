define([
    'underscore',
    'backbone',
    'models/compliance/RuleModel' ], function(_, Backbone, RuleModel) {

	var DeviceRuleCollection = Backbone.Collection.extend({

	  model: RuleModel,
	  
	  initialize: function(models, options) {
	  	this.device = options.device;
	  },
	  
	  url: function() {
	  	return "rs/rules/device/" + this.device.get('id');
	  },
	  
		comparator: function(config) {
			return config.get('name');
		}
	  
	});

	return DeviceRuleCollection;

});
