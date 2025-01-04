/** Copyright 2013-2025 Netshot */
define([
	'underscore',
	'backbone',
	'models/compliance/HardwareRuleModel'
], function(_, Backbone, HardwareRuleModel) {

	return Backbone.Collection.extend({

		url: "api/hardwarerules",

		model: HardwareRuleModel,

	});

});
