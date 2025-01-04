/** Copyright 2013-2025 Netshot */
define([
	'underscore',
	'backbone',
	'models/compliance/SoftwareRuleModel'
], function(_, Backbone, SoftwareRuleModel) {

	return Backbone.Collection.extend({

		url: "api/softwarerules",

		model: SoftwareRuleModel,

	});

});
