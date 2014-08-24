define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/compliance/HardwareRuleModel',
	'models/device/DeviceGroupCollection',
	'models/device/DeviceTypeCollection',
	'models/device/DeviceFamilyCollection',
	'text!templates/compliance/addHardwareRule.html',
	'models/device/PartNumberCollection'
], function($, _, Backbone, Dialog, HardwareRuleModel, DeviceGroupCollection,
		DeviceTypeCollection, DeviceFamilyCollection, addHardwareRuleTemplate,
		PartNumberCollection) {

	var EditHardwareRuleDialog = Dialog.extend({

		template: _.template(addHardwareRuleTemplate),

		dialogOptions: {
			title: "Edit hardware rule",
		},

		initialize: function() {
			var that = this;
			this.groups = new DeviceGroupCollection([]);
			this.deviceTypes = new DeviceTypeCollection([]);
			this.deviceFamilies = new DeviceFamilyCollection([]);
			this.partNumbers = new PartNumberCollection([]);
			$.when(this.groups.fetch(), this.deviceTypes.fetch(), this.deviceFamilies
					.fetch(), this.partNumbers.fetch()).done(function() {
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
					'deviceClass': that.$('#devicetype').val(),
					'partNumber': that.$('#partnumber').val(),
					'partNumberRegExp': that.$('#partnumberregexp').prop('checked'),
					'family': that.$('#family').val(),
					'familyRegExp': that.$('#familyregexp').prop('checked'),
					'endOfLife': that.$('#endoflife').datepicker('getDate'),
					'endOfSale': that.$('#endofsale').datepicker('getDate')
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
			$('<option />').attr('value', "org.netshot.device.Device").text("[Any]")
					.appendTo(this.$('#devicetype'));
			_.each(this.deviceTypes.models, function(deviceType) {
				$('<option />').attr('value', deviceType.get('name')).text(deviceType
						.get('description')).appendTo(that.$('#devicetype'));
			});
			if (typeof (this.model.get('targetGroup')) == "object") {
				this.$('#group').val(this.model.get('targetGroup').id);
			}
			this.$('#devicetype').val(this.model.get('deviceClass'));
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
			})
			this.$('.nsdatepicker').datepicker({
				dateFormat: "dd/mm/y",
				autoSize: true,
				changeMonth: true,
				changeYear: true,
				onSelect: function() {
				}
			});
			if (typeof(this.model.get('endOfSale')) == "number") {
				this.$("#endofsale").datepicker('setDate', new Date(this.model.get('endOfSale')));
			}
			if (typeof(this.model.get('endOfLife')) == "number") {
				this.$("#endoflife").datepicker('setDate', new Date(this.model.get('endOfLife')));
			}
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
		},

	});
	return EditHardwareRuleDialog;
});
