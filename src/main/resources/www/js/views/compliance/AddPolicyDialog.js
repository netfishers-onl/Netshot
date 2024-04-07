/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'views/devices/SelectGroupDialog',
	'models/device/DeviceGroupCollection',
	'models/compliance/PolicyModel',
	'text!templates/compliance/addPolicy.html',
	'text!templates/devices/groupStaticItem.html',
], function($, _, Backbone, Dialog, SelectGroupDialog, DeviceGroupCollection, PolicyModel,
		addPolicyTemplate, groupStaticItemTemplate) {

	return Dialog.extend({

		template: _.template(addPolicyTemplate),
		staticGroupTemplate: _.template(groupStaticItemTemplate),

		initialize: function() {
			var that = this;
			this.groups = new DeviceGroupCollection([]);
			this.groups.fetch().done(function() {
				that.render();
			});
			this.selectedGroupIds = [];
		},

		dialogOptions: {
			title: "Add policy",
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Add": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var policy = new PolicyModel();
				policy.save({
					'name': that.$('#policyname').val(),
					'targetGroups': this.selectedGroupIds,
				}).done(function(data) {
					that.close();
					var policy = new PolicyModel(data);
					that.options.onAdded(policy);
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			}
		},

		renderGroupField: function() {
			var that = this;
			this.$('#groups>.placeholder').toggle(this.selectedGroupIds.length === 0);
			this.$('#groups>ul').toggle(this.selectedGroupIds.length > 0);
			var $groupField = this.$('#groups>ul');
			$groupField.empty();
			_.each(this.selectedGroupIds, function(groupId) {
				var group = that.groups.get(groupId);
				if (group) {
					$groupField.append($(that.staticGroupTemplate(group.toJSON())));
				}
			});
		},

		onCreate: function() {
			var that = this;
			this.renderGroupField();
			this.$('#groups').click(function(event) {
				new SelectGroupDialog({
					groups: that.groups,
					preselectedGroupIds: that.selectedGroupIds,
					constraints: {
						min: 0,
						max: Number.POSITIVE_INFINITY,
					},
					onSelected: function(groupIds) {
						that.selectedGroupIds = groupIds;
						that.renderGroupField();
					},
				});
				return false;
			});
		}

	});
});
