/** Copyright 2013-2014 NetFishers */
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
