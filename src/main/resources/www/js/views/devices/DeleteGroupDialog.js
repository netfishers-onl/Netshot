/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceGroupModel',
	'text!templates/devices/deleteGroup.html'
], function($, _, Backbone, Dialog, DeviceGroupModel, deleteGroupTemplate) {

	return Dialog.extend({

		template: _.template(deleteGroupTemplate),

		dialogOptions: {
			title: "Delete group",
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
				saveModel.destroy().done(function(data) {
					that.close();
					that.options.onDeleted(that.model);
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
