/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'jquery-ui'
], function($, _, Backbone) {

	return Backbone.View.extend({

		el: "#nsdialog",

		template: null,

		initialize: function() {
			this.render();
		},

		templateData: function() {
			var data = {};
			if (typeof this.model === "object" && this.model) {
				data = this.model.toJSON();
				data.isNew = this.model.isNew();
			}
			return data;
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
					that.$('#info').hide();
					that.onCreate();
					var $dialog = $(this).closest(".ui-dialog");
					$dialog.find(".ui-button:contains('Finish')").addClass("primary");
					$dialog.find(".ui-button:contains('Save')").addClass("primary");
					$dialog.find(".ui-button:contains('Add')").addClass("primary");
					$dialog.find(".ui-button:contains('Select')").addClass("primary");
					$dialog.find(".ui-button:contains('Confirm')").addClass("primary");
					$dialog.find(".ui-button:contains('Scan')").addClass("primary");
					$dialog.find(".ui-button:contains('Search')").addClass("primary");
					$dialog.find(".ui-button:contains('Delete')").addClass("danger");
					$dialog.find(".ui-button:contains('Logout')").addClass("danger");
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
});
