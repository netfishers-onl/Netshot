define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/compliance/SoftwareRuleModel',
	'text!templates/compliance/deleteSoftwareRule.html'
], function($, _, Backbone, Dialog, SoftwareRuleModel,
		deleteSoftwareRuleTemplate) {

	var DeleteSoftwareRuleDialog = Dialog.extend({

		template: _.template(deleteSoftwareRuleTemplate),

		dialogOptions: {
			title: "Delete software rule",
		},

		buttons: {
			"Confirm": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var saveModel = that.model.clone();
				saveModel.destroy().done(function(data) {
					that.close();
					that.options.onDeleted(that.model);
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

	});
	return DeleteSoftwareRuleDialog;
});