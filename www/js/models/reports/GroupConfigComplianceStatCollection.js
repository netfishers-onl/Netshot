define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var GroupConfigComplianceStatCollection = Backbone.Collection.extend({

		url: "rs/reports/groupconfigcompliancestats",

	});

	return GroupConfigComplianceStatCollection;

});