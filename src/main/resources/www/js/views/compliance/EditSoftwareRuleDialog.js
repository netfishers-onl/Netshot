/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/compliance/SoftwareRuleModel',
	'models/device/DeviceGroupCollection',
	'models/device/DeviceTypeCollection',
	'models/device/DeviceFamilyCollection',
	'text!templates/compliance/addSoftwareRule.html',
], function($, _, Backbone, Dialog, SoftwareRuleModel, DeviceGroupCollection,
		DeviceTypeCollection, DeviceFamilyCollection, addSoftwareRuleTemplate) {

	return Dialog.extend({

		template: _.template(addSoftwareRuleTemplate),

		dialogOptions: {
			title: "Edit software rule",
		},

		initialize: function() {
			var that = this;
			this.groups = new DeviceGroupCollection([]);
			this.deviceTypes = new DeviceTypeCollection([]);
			this.deviceFamilies = new DeviceFamilyCollection([]);
			$.when(this.groups.fetch(), this.deviceTypes.fetch(), this.deviceFamilies
					.fetch()).done(function() {
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
				saveModel.set({
					'group': that.$('#group').val(),
					'driver': that.$('#devicetype').val(),
					'version': that.$('#version').val(),
					'versionRegExp': that.$('#versionregexp').prop('checked'),
					'family': that.$('#family').val(),
					'familyRegExp': that.$('#familyregexp').prop('checked'),
					'level': that.$('input[name="level"]:checked').attr('id')
							.toUpperCase()
				});

				saveModel.save().done(function(data) {
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
			$('<option />').attr('value', -1).text("[Any]")
					.appendTo(this.$('#group'));
			this.groups.each(function(group) {
				$('<option />').attr('value', group.get('id')).text(group.get('name'))
						.appendTo(that.$('#group'));
			});
			$('<option />').attr('value', "onl.netfishers.netshot.device.Device").text("[Any]")
					.appendTo(this.$('#devicetype'));
			_.each(this.deviceTypes.models, function(deviceType) {
				$('<option />').attr('value', deviceType.get('name')).text(deviceType
						.get('description')).appendTo(that.$('#devicetype'));
			});
			var targetGroup = this.model.get('targetGroup'); 
			if (typeof targetGroup === "object" && targetGroup) {
				this.$('#group').val(targetGroup.id);
			}
			this.$('#devicetype').val(this.model.get('driver') ? this.model.get('driver') :
				"onl.netfishers.netshot.device.Device");
			this.$('input[name="level"]').filter('#'
					+ this.model.get('level').toLowerCase()).click();
			var families = [];
			this.deviceFamilies.each(function(family) {
				families.push(family.get('deviceFamily'));
			});
			this.$('#family').autocomplete({
				source: families
			});
		},

	});
});
