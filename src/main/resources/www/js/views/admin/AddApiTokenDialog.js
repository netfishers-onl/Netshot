/** Copyright 2013-2020 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/user/ApiTokenModel',
	'text!templates/admin/addApiToken.html'
], function($, _, Backbone, Dialog, ApiTokenModel, addApiTokenTemplate) {

	return Dialog.extend({

		template: _.template(addApiTokenTemplate),

		initialize: function() {
			this.model = new ApiTokenModel();
			this.render();
		},

		dialogOptions: {
			title: "Add API token",
		},

		generateToken: function() {
			var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
			var token = '';
			var n = 32;
			for (var i = 0; i < n; i++) {
				token += chars[Math.floor(Math.random() * chars.length)];
			}
			this.$('#token').val(token);
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
					'token': that.$('#token').val(),
					'level': that.$('input[name="role"]:checked').data('level'),
					'description': that.$('#description').val()
				}).done(function(data) {
					that.close();
					that.options.onAdded();
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			}
		},

		onCreate: function() {
			var that = this;
			this.generateToken();
			this.$("#regenerate").button({
				icons: { primary: "ui-icon-refresh" },
				text: false
			}).click(function() {
				that.generateToken();
				return false;
			});
			this.$("#copytoken").button({
				icons: { primary: "ui-icon-copy" },
				text: false
			}).click(function() {
				var $token = that.$('#token');
				$token.focus();
				$token.select();
				document.execCommand("copy");
				return false;
			});
		}

	});
});
