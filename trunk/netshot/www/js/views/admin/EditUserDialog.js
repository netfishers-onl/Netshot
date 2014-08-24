define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/user/UserModel',
	'text!templates/admin/addUser.html'
], function($, _, Backbone, Dialog, UserModel, addUserTemplate) {

	var EditUserDialog = Dialog.extend({

		template: _.template(addUserTemplate),

		dialogOptions: {
			title: "Edit user",
		},

		buttons: {
			"Save": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var saveModel = that.model.clone();
				var data = {
					'username': that.$('#username').val(),
					'local': !that.$('#remoteuser').prop('checked'),
					'level': that.$('input[name="role"]:checked').data('level'),
					'password': that.$('#password1').val()
				};
				saveModel.save(data).done(function(data) {
					that.close();
					that.options.onEdited();
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText);
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			},
			"Cancel": function() {
				this.close();
			}
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
			this.$('input[type="password"]').change(function() {
				if (that.$('#password1').val() == that.$('#password2').val()) {
					that.dialogButtons().eq(0).button('enable');
				}
				else {
					that.dialogButtons().eq(0).button('disable');
				}
			});
		}

	});
	return EditUserDialog;
});
