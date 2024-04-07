/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceTypeCollection',
	'models/device/DeviceGroupCollection',
	'models/device/DeviceFamilyCollection',
	'models/device/PartNumberCollection',
	'models/compliance/SoftwareRuleModel',
	'text!templates/compliance/addSoftwareRule.html'
], function($, _, Backbone, Dialog, DeviceTypeCollection,
		DeviceGroupCollection, DeviceFamilyCollection, PartNumberCollection,
		SoftwareRuleModel, addSoftwareRuleTemplate) {

	return Dialog.extend({

		template: _.template(addSoftwareRuleTemplate),

		initialize: function() {
			var that = this;
			this.model = new SoftwareRuleModel();
			this.groups = new DeviceGroupCollection([]);
			this.deviceTypes = new DeviceTypeCollection([]);
			this.deviceFamilies = new DeviceFamilyCollection([]);
			this.partNumbers = new PartNumberCollection([]);
			$.when(this.groups.fetch(), this.deviceTypes.fetch(), this.deviceFamilies
					.fetch(), this.partNumbers.fetch()).done(function() {
				that.render();
			});
		},

		dialogOptions: {
			title: "Add software version rule",
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Add": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var rule = new SoftwareRuleModel();
				rule.save({
					'group': that.$('#group').val(),
					'driver': that.$('#devicetype').val(),
					'version': that.$('#version').val(),
					'versionRegExp': that.$('#versionregexp').prop('checked'),
					'family': that.$('#family').val(),
					'familyRegExp': that.$('#familyregexp').prop('checked'),
					'partNumber': that.$('#partnumber').val(),
					'partNumberRegExp': that.$('#partnumberregexp').prop('checked'),
					'level': that.$('input[name="level"]:checked').attr('id')
							.toUpperCase()
				}).done(function(data) {
					that.close();
					var rule = new SoftwareRuleModel(data);
					that.options.onAdded(rule);
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
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
			var families = [];
			this.deviceFamilies.each(function(family) {
				families.push(family.get('deviceFamily'));
			});
			this.$('#family').autocomplete({
				source: families
			});
			var partNumbers = [];
			this.partNumbers.each(function(partNumber) {
				partNumbers.push(partNumber.get('partNumber'));
			});
			this.$('#partnumber').autocomplete({
				source: partNumbers
			});
		}

	});
});
