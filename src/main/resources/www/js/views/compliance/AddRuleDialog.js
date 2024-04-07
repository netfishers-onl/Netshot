/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceTypeCollection',
	'models/compliance/RuleModel',
	'text!templates/compliance/addRule.html'
], function($, _, Backbone, Dialog, DeviceTypeCollection, RuleModel,
		addRuleTemplate) {

	return Dialog.extend({

		template: _.template(addRuleTemplate),

		dialogOptions: {
			title: "Add rule",
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Add": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var rule = new RuleModel();
				rule.save({
					'name': that.$('#rulename').val(),
					'policy': that.model.get('id'),
					'type': that.$('input[name="ruletype"]:checked').attr('id')
				}).done(function(data) {
					that.close();
					var rule = new RuleModel(data);
					that.options.onAdded(rule);
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
