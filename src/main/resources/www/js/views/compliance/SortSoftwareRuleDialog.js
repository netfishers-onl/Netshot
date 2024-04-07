/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/compliance/SortSoftwareRuleModel',
	'text!templates/compliance/sortSoftwareRule.html'
], function($, _, Backbone, Dialog, SortSoftwareRuleModel, sortSoftwareRuleTemplate) {

	return Dialog.extend({

		template: _.template(sortSoftwareRuleTemplate),

		dialogOptions: {
			title: "Sort software rules",
		},

		buttons: {
			"Cancel": function() {
				this.close();
				this.options.onCancel();
			},
			"Confirm": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var saveModel = new SortSoftwareRuleModel({
					ruleId: that.model.get('id'),
					nextRuleId: that.options.nextRuleId,
				});
				saveModel.save().done(function(data) {
					that.close();
					that.options.onChanged(that.model);
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			},
		},

	});
});
