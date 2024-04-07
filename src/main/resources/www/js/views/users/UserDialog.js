/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'text!templates/users/user.html'
], function($, _, Backbone, Dialog, userTemplate) {

	return Dialog.extend({

		template: _.template(userTemplate),

		dialogOptions: {
			title: "User details",
		},

		buttons: {
			"Logout": function() {
				user.destroy().done(function() {
					location.reload();
				});
			},
			"Change password": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				user.save({
					'username': this.model.get('username'),
					'password': this.$('#currentpassword').val(),
					'newPassword': this.$('#newpassword1').val()
				}).done(function() {
					that.close();
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			},
			"Close": function() {
				this.close();
			},
		},

		onCreate: function() {
			var that = this;
			this.dialogButtons().eq(1).button('disable');
			this.$('input[type="password"]').on("keyup", function() {
				var action = "enable";
				that.$('input[type="password"]').each(function(i, item) {
					if ($(item).val() == "") {
						action = "disable";
					}
				});
				if (that.$('#newpassword1').val() != that.$('#newpassword2').val()) {
					action = "disable";
				}
				that.dialogButtons().eq(1).button(action);
			});
		}

	});
});
