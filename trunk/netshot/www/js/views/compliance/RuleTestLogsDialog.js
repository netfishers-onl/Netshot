define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/compliance/RuleTestModel',
	'text!templates/compliance/ruleTestLogs.html',
], function($, _, Backbone, Dialog, RuleTestModel, ruleTestLogsTemplate) {

	var RuleTestLogsDialog = Dialog.extend({

		el: "#nsdialog-child",

		template: _.template(ruleTestLogsTemplate),

		dialogOptions: {
			title: "Rule test logs",
		},

		buttons: {
			"Close": function() {
				this.close();
			}
		},

	});
	return RuleTestLogsDialog;
});
