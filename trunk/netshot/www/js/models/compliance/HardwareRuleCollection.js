define([
	'underscore',
	'backbone',
	'models/compliance/HardwareRuleModel'
], function(_, Backbone, HardwareRuleModel) {

	var HardwareRuleCollection = Backbone.Collection.extend({

		url: "rs/hardwarerules",

		model: HardwareRuleModel,

	});

	return HardwareRuleCollection;

});
