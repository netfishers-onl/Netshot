define([
	'jquery',
	'underscore',
	'backbone',
	'jquery-ui'
], function($, _, Backbone) {

	var Dialog = Backbone.View.extend({

		el: "#nsdialog",

		template: null,

		initialize: function() {
			this.render();
		},

		templateData: function() {
			if (typeof (this.model) == "object") {
				return this.model.toJSON();
			}
			return {};
		},
		buttons: function() {
			return {};
		},

		dialogOptions: {},

		onCreate: function() {
		},

		onClose: function() {
		},

		render: function() {
			var that = this;
			var buttons = {};
			_.each(this.buttons, function(value, key) {
				buttons[key] = function(e) {
					value.call(that, e);
				}
			});
			var defaultDialogOptions = {
				title: "Dialog",
				width: 500,
				modal: true,
				resizable: false,
				buttons: buttons,
				create: function() {
					that.$('form').keydown(function(e) {
						if ($(e.target).is('textarea')) {
							return;
						}
						if (e.which == 13) {
							e.preventDefault();
							that.dialogButtons().filter(":not(:disabled)").first().click();
							return false;
						}
					});
					that.$('#error').hide();
					that.onCreate();
				},
				close: function() {
					that.close();
				}
			};

			var options = _.extend(defaultDialogOptions, this.dialogOptions);
			this.$el.html(this.template(this.templateData())).hide();
			this.$el.dialog(options);
			return this;
		},

		close: function() {
			var r = this.onClose();
			if (r !== false) {
				this.$el.dialog('destroy').html("");
			}
		},

		dialogButtons: function() {
			return this.$el.closest('[role="dialog"]')
					.find('.ui-dialog-buttonpane button');
		}

	});
	return Dialog;
});
