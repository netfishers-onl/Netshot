define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceGroupCollection',
	'models/compliance/PolicyModel',
	'text!templates/compliance/addPolicy.html',
	'models/compliance/PolicyModel'
], function($, _, Backbone, Dialog, DeviceGroupCollection, PolicyModel,
		addPolicyTemplate, PolicyModel) {

	var AddPolicyDialog = Dialog.extend({

		template: _.template(addPolicyTemplate),

		initialize: function() {
			var that = this;
			this.groups = new DeviceGroupCollection([]);
			this.groups.fetch().done(function() {
				that.render();
			});
		},

		dialogOptions: {
			title: "Add policy",
		},

		buttons: {
			"Add": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var policy = new PolicyModel();
				policy.save({
					'name': that.$('#policyname').val(),
					'group': that.$('#group').val()
				}).done(function(data) {
					that.close();
					var policy = new PolicyModel(data);
					that.options.onAdded(policy);
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
		}

	});
	return AddPolicyDialog;
});
