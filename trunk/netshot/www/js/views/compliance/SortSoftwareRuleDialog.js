define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/compliance/SoftwareRuleModel',
	'text!templates/compliance/sortSoftwareRule.html'
], function($, _, Backbone, Dialog, SoftwareRuleModel, sortSoftwareRuleTemplate) {

	var SortSoftwareRuleDialog = Dialog.extend({

		template: _.template(sortSoftwareRuleTemplate),

		dialogOptions: {
			title: "Sort software rules",
		},

		buttons: {
			"Confirm": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var saveModel = that.model.clone();
				saveModel.set({
					priority: this.options.priority,
					group: (typeof (saveModel.get('targetGroup')) == "object" ? saveModel
							.get('targetGroup').id : -1)
				});
				saveModel.save().done(function(data) {
					that.close();
					that.options.onChanged(that.model);
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText);
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			},
			"Cancel": function() {
				this.close();
				this.options.onCancel();
			}
		},

	});
	return SortSoftwareRuleDialog;
});
