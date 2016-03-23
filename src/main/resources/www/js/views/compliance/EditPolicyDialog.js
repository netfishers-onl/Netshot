/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/compliance/PolicyModel',
	'models/device/DeviceGroupCollection',
	'text!templates/compliance/editPolicy.html',
], function($, _, Backbone, Dialog, PolicyModel, DeviceGroupCollection,
		editPolicyTemplate) {

	return Dialog.extend({

		template: _.template(editPolicyTemplate),

		dialogOptions: {
			title: "Edit policy",
		},

		initialize: function() {
			var that = this;
			this.groups = new DeviceGroupCollection([]);
			this.groups.fetch().done(function() {
				that.render();
			});
		},

		buttons: {
			"Save": function(event) {
				var that = this;
				that.$("#error").hide();
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var saveModel = that.model.clone();

				saveModel.save({
					'name': that.$('#policyname').val(),
					'group': that.$('#group').val()
				}).done(function(data) {
					that.close();
					that.model.set(data);
					that.options.onEdited();
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

		},

		onCreate: function() {
			var that = this;
			this.groups.each(function(group) {
				$('<option />').attr('value', group.get('id')).text(group.get('name'))
						.appendTo(that.$('#group'));
			});
			this.$('#group').val(this.model.get('targetGroup') ? this.model.get('targetGroup').id : -1);
		},

	});
});
