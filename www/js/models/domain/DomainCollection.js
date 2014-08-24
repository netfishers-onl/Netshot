define([
	'underscore',
	'backbone',
	'models/domain/DomainModel'
], function(_, Backbone, DomainModel) {

	var DomainCollection = Backbone.Collection.extend({

		url: "rs/domains",

		model: DomainModel,

	});

	return DomainCollection;

});
