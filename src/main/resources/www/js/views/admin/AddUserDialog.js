/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/user/UserModel',
	'text!templates/admin/addUser.html'
], function($, _, Backbone, Dialog, UserModel, addUserTemplate) {

	return Dialog.extend({

		template: _.template(addUserTemplate),

		initialize: function() {
			this.model = new UserModel();
			this.render();
		},

		dialogOptions: {
			title: "Add user",
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Add": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				this.model.save({
					'username': that.$('#username').val(),
					'local': !that.$('#remoteuser').prop('checked'),
					'level': that.$('input[name="role"]:checked').data('level'),
					'password': that.$('#password1').val()
				}).done(function(data) {
					that.close();
					that.options.onAdded();
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			},
		},

		onCreate: function() {
			var that = this;
			this.$("#remoteuser").change(function() {
				var remote = $(this).prop('checked');
				if (remote) {
					that.$("#password").hide();
				}
				else {
					that.$("#password").show();
				}
			});
			this.$('input[type="password"]').on("keyup", function() {
				if (that.$('#password1').val() == that.$('#password2').val()) {
					that.dialogButtons().eq(1).button('enable');
				}
				else {
					that.dialogButtons().eq(1).button('disable');
				}
			});
			this.$("#username").select();
		}

	});
});
