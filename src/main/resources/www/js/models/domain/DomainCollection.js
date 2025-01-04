/** Copyright 2013-2025 Netshot */
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
