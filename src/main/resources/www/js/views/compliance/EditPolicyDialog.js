/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'views/devices/SelectGroupDialog',
	'models/compliance/PolicyModel',
	'models/device/DeviceGroupCollection',
	'text!templates/compliance/editPolicy.html',
	'text!templates/devices/groupStaticItem.html',
], function($, _, Backbone, Dialog, SelectGroupDialog, PolicyModel, DeviceGroupCollection,
		editPolicyTemplate, groupStaticItemTemplate) {

	return Dialog.extend({

		template: _.template(editPolicyTemplate),
		staticGroupTemplate: _.template(groupStaticItemTemplate),

		dialogOptions: {
			title: "Edit policy",
		},

		initialize: function() {
			var that = this;
			this.groups = new DeviceGroupCollection([]);
			this.groups.fetch().done(function() {
				that.render();
			});
			this.selectedGroupIds = _.map(this.model.get("targetGroups"), function(g) { return g.id });
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Save": function(event) {
				var that = this;
				that.$("#error").hide();
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var saveModel = that.model.clone();

				saveModel.save({
					'name': that.$('#policyname').val(),
					'targetGroups': this.selectedGroupIds,
				}).done(function(data) {
					that.close();
					that.model.set(data);
					that.options.onEdited();
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			},
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
		},

	});
});
