/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/compliance/RuleTestModel',
	'text!templates/compliance/ruleTestLogs.html',
], function($, _, Backbone, Dialog, RuleTestModel, ruleTestLogsTemplate) {

	return Dialog.extend({

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
});
