define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'text!templates/admin/about.html'
], function($, _, Backbone, Dialog, aboutTemplate) {

	var AboutDialog = Dialog.extend({

		template: _.template(aboutTemplate),

		templateData: function() {
			return {
				user: user.toJSON()
			};
		},

		dialogOptions: {
			title: "About Netshot",
		},

		buttons: {
			"Close": function() {
				this.close();
			}
		}

	});
	return AboutDialog;
});
