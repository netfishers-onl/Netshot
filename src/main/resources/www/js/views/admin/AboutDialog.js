/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'text!templates/admin/about.html'
], function($, _, Backbone, Dialog, aboutTemplate) {

	return Dialog.extend({

		template: _.template(aboutTemplate),

		templateData: function() {
			return {
				serverInfo: window.serverInfo.toJSON()
			};
		},

		dialogOptions: {
			title: "About Netshot",
		},

		buttons: {
			"Close": function() {
				this.close();
			},
		}

	});
});
