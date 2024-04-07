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
	'models/compliance/HardwareRuleModel',
	'text!templates/compliance/addHardwareRule.html'
], function($, _, Backbone, Dialog, DeviceTypeCollection,
		DeviceGroupCollection, DeviceFamilyCollection, PartNumberCollection,
		HardwareRuleModel, addHardwareRuleTemplate) {

	return Dialog.extend({

		template: _.template(addHardwareRuleTemplate),

		initialize: function() {
			var that = this;
			this.model = new HardwareRuleModel();
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
			title: "Add hardware rule",
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Add": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var rule = new HardwareRuleModel();
				rule.save({
					'group': that.$('#group').val(),
					'driver': that.$('#devicetype').val(),
					'partNumber': that.$('#partnumber').val(),
					'partNumberRegExp': that.$('#partnumberregexp').prop('checked'),
					'family': that.$('#family').val(),
					'familyRegExp': that.$('#familyregexp').prop('checked'),
					'endOfLife': that.$('#endoflife').datepicker('getDate'),
					'endOfSale': that.$('#endofsale').datepicker('getDate')
				}).done(function(data) {
					that.close();
					var rule = new HardwareRuleModel(data);
					that.options.onAdded(rule);
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			},
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
			this.$('.nsdatepicker').datepicker({
				dateFormat: window.dateFormats.picker,
				changeMonth: true,
				changeYear: true,
				autoSize: true,
				onSelect: function() {
				}
			});
			var in3years = new Date();
			in3years.setFullYear(in3years.getFullYear() + 3);
			var in5years = new Date();
			in5years.setFullYear(in5years.getFullYear() + 5);
			this.$("#endofsale").datepicker('setDate', in3years);
			this.$("#endoflife").datepicker('setDate', in5years);
			this.$("#clearendofsale").button({
				icons: { primary: "ui-icon-cancel" },
				text: false
			}).click(function() {
				$.datepicker._clearDate(that.$("#endofsale"));
				return false;
			});
			this.$("#clearendoflife").button({
				icons: { primary: "ui-icon-cancel" },
				text: false
			}).click(function() {
				$.datepicker._clearDate(that.$("#endoflife"));
				return false;
			});
		}

	});
});
