define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var GroupSoftwareComplianceStatCollection = Backbone.Collection.extend({

		url: "rs/reports/groupsoftwarecompliancestats",

	});

	return GroupSoftwareComplianceStatCollection;

});