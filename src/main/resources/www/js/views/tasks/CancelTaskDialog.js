/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/task/TaskModel',
	'text!templates/tasks/cancelTask.html'
], function($, _, Backbone, Dialog, TaskModel, cancelTaskTemplate) {

	return Dialog.extend({

		template: _.template(cancelTaskTemplate),

		dialogOptions: {
			title: "Cancel task",
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
				saveModel.save({
					'cancelled': true,
				}).done(function(data) {
					that.close();
					that.options.onCancelled(that.model);
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			},
		}

	});
});
