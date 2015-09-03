/** Copyright 2013-2014 NetFishers */
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
			"Confirm": function(event) {
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
					var error = $.parseJSON(data.responseText);
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			},
			"Cancel": function() {
				this.close();
			}
		}

	});
});
