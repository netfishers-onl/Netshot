define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'text!templates/users/reauth.html'
], function($, _, Backbone, Dialog, reAuthTemplate) {

	var ReAuthDialog = Dialog.extend({

		template: _.template(reAuthTemplate),

		initialize: function() {
			if (!this.$("#nsadmin-reauth").length) {
				this.render();
			}
		},

		dialogOptions: {
			title: "Authentication needed",
			dialogClass: "no-close"
		},

		buttons: {},

		onCreate: function() {
			this.$(".refresh").click(function() {
				location.reload();
				return false;
			});
		}

	});
	return ReAuthDialog;
});
