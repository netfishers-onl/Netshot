/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
	'models/domain/DomainModel'
], function(_, Backbone, DomainModel) {

	return Backbone.Collection.extend({

		url: "api/domains",

		model: DomainModel,

	});

});
