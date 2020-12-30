/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/user/ApiTokenModel',
	'text!templates/admin/deleteApiToken.html'
], function($, _, Backbone, Dialog, ApiTokenModel, deleteApiTokenTemplate) {

	return Dialog.extend({

		template: _.template(deleteApiTokenTemplate),

		dialogOptions: {
			title: "Delete API token",
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
