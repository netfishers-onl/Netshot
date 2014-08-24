define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var DeviceConfigModel = Backbone.Model.extend({

		urlRoot: "rs/configs",

		defaults: {
			'creationDate': 0
		},

		getItemUrl: function(item) {
			return this.urlRoot + "/" + this.get('id') + "/" + item;
		}

	});

	return DeviceConfigModel;

});
