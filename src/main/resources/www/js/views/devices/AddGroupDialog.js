/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceGroupModel',
	'text!templates/devices/addGroup.html'
], function($, _, Backbone, Dialog, DeviceGroupModel, addGroupTemplate) {

	return Dialog.extend({

		template: _.template(addGroupTemplate),

		initialize: function() {
			this.model = new DeviceGroupModel();
			this.render();
		},

		dialogOptions: {
			title: "Add group",
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Add": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				that.model.save({
					'name': that.$('#groupname').val(),
					'folder': that.$('#groupfolder').val(),
					'type': that.$('input[name="grouptype"]:checked').val()
				}).done(function(data) {
					that.close();
					var group = new DeviceGroupModel(data);
					that.options.onAdded(group);
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
