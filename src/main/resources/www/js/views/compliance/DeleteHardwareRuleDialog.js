/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/compliance/HardwareRuleModel',
	'text!templates/compliance/deleteHardwareRule.html'
], function($, _, Backbone, Dialog, HardwareRuleModel,
		deleteHardwareRuleTemplate) {

	return Dialog.extend({

		template: _.template(deleteHardwareRuleTemplate),

		dialogOptions: {
			title: "Delete hardware rule",
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Delete": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var saveModel = that.model.clone();
				saveModel.destroy().done(function(data) {
					that.close();
					that.options.onDeleted(that.model);
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			}
		},

	});
});
