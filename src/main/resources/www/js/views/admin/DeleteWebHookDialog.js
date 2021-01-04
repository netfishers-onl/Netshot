/** Copyright 2013-2021 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/hook/HookModel',
	'text!templates/admin/deleteWebHook.html'
], function($, _, Backbone, Dialog, HookModel, deleteWebHookTemplate) {

	return Dialog.extend({

		template: _.template(deleteWebHookTemplate),

		dialogOptions: {
			title: "Delete Web hook",
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Delete": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var saveModel = this.model.clone();
				saveModel.destroy().done(function(data) {
					that.close();
					that.options.onDeleted();
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			}
		}

	});
});
