define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var RuleTestModel = Backbone.Model.extend({

		urlRoot: "rs/rules/test",

	});

	return RuleTestModel;

});
