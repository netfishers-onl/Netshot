/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/compliance/RuleModel',
	'models/device/DeviceCollection',
	'text!templates/compliance/editRule.html',
	'text!templates/compliance/editRuleDeviceListItem.html',
	'text!templates/compliance/editRuleExemptedDeviceListItem.html'
	], function($, _, Backbone, Dialog, RuleModel, DeviceCollection,
	editRuleTemplate, editRuleDeviceListItemTemplate,
	editRuleExemptedDeviceListItemTemplate) {

	return Dialog.extend({

		template: _.template(editRuleTemplate),
		deviceListItemTemplate: _.template(editRuleDeviceListItemTemplate),
		exemptedDeviceListItemTemplate: _
		.template(editRuleExemptedDeviceListItemTemplate),

		dialogOptions: {
			title: "Edit rule",
			width: "650px"
		},

		initialize: function() {
			var that = this;
			that.render();
		},

		buttons: {
			"Save": function(event) {
				var that = this;
				that.$("#error").hide();
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var saveModel = that.model.clone();

				var exemptions = {};
				that.$("#devices>ul li").each(function() {
					exemptions[$(this).data('device-id')] = $(this)
					.data('exemption-date');
				});

				saveModel.save({
					'name': that.$('#rulename').val(),
					'exemptions': exemptions,
					'enabled': that.$('#ruleenabled').prop('checked')
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
			"Cancel": function() {
				this.close();
			}

		},

		onCreate: function() {
			var that = this;

			this.$('#selectdevice').button({
				icons: {
					primary: "ui-icon-caret-1-e"
				},
				text: false,
				disabled: true
			}).click(function() {
				that.$("#devices>ul li.active").removeClass("active");
				that
				.$("#alldevices>ul li.active")
				.each(function() {
					var id = $(this).data('device-id');
					if (that.$('#devices>ul li[data-device-id="' + id + '"]').length == 0) {
						that.addStaticMember(that.searchedDevices.get(id));
					}
				}).removeClass('active').hide();
				that.refreshAddState();
				that.refreshRemoveState();
				return false;
			});
			this.$('#unselectdevice').button({
				icons: {
					primary: "ui-icon-caret-1-w"
				},
				text: false,
				disabled: true
			}).click(function() {
				that.$('#alldevices>ul li').removeClass('active');
				that.$("#devices>ul li.active").each(function() {
					var id = $(this).data('device-id');
					that.$('#alldevices>ul li[data-device-id="' + id + '"]')
					.addClass('active').show();
				}).remove();
				that.refreshAddState();
				that.refreshRemoveState();
				return false;
			});
			this.$('#devicesearch').keydown(function(e) {
				if (e.which == 13) {
					that.$("#error").hide();
					that.searchedDevices = new DeviceCollection({});
					that.searchedDevices.filter.type = "simple";
					that.searchedDevices.filter.text = that.$('#devicesearch').val();
					that.searchedDevices.fetch().done(function() {
						that.renderSearchedDevices();
					}).fail(function(data) {
						var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
						that.$("#errormsg").text("Error: " + error.errorMsg);
						that.$("#error").show();
					});
					e.preventDefault();
					return false;
				}
			});
			this.$('#exemptiondate').datepicker({
				dateFormat: "'End date: 'dd/mm/y",
				autoSize: true,
				onSelect: function() {
				}
			}).datepicker('setDate', new Date(new Date().getTime() + 3600 * 24
					* 7 * 1000));
			this.exemptedDevices = new DeviceCollection([]);
			this.exemptedDevices.filter.type = "rule";
			this.exemptedDevices.filter.rule = this.model.get('id');
			this.exemptedDevices.fetch().done(function() {
				that.htmlBuffer = "";
				that.exemptedDevices.each(that.addStaticMember, that);
			});
		},

		renderSearchedDevices: function() {
			var that = this;
			this.htmlBuffer = "";
			this.searchedDevices.each(this.renderSearchedDeviceListItem, this);
			this.$("#alldevices>ul").html(this.htmlBuffer);
			this.refreshAddState();
			this
			.$("#alldevices>ul li")
			.mouseenter(function() {
				var $this = $(this);
				if (!$this.hasClass("active")) {
					$this.addClass("hover");
				}
			})
			.mouseleave(function() {
				$(this).removeClass("hover");
			})
			.click(function(e) {
				var $this = $(this);
				if (e.ctrlKey) {
					if ($this.hasClass('active')) {
						$this.removeClass('active');
					}
					else {
						$this.addClass("active");
					}
				}
				else if (e.shiftKey) {
					document.getSelection().removeAllRanges();
					var i = $this.closest('ul').find('.active').last().index();
					var j = $this.index();
					$this.closest('ul').find('li').slice(i <= j ? i : j, (i <= j
							? j : i) + 1).addClass('active');
				}
				else {
					$this.closest('ul').find('.active').removeClass('active');
					$this.addClass("active");
				}
				that.refreshAddState();
			})
			.each(function() {
				var id = $(this).data('device-id');
				if (that.$('#devices>ul li[data-device-id="' + id + '"]').length > 0) {
					$(this).hide();
				}
			});
		},

		refreshAddState: function() {
			if (this.$('#alldevices>ul li.active').length > 0) {
				this.$('#selectdevice').button('enable');
			}
			else {
				this.$('#selectdevice').button('disable');
			}
		},

		refreshRemoveState: function() {
			if (this.$('#devices>ul li.active').length > 0) {
				this.$('#unselectdevice').button('enable');
			}
			else {
				this.$('#unselectdevice').button('disable');
			}
		},

		addStaticMember: function(device) {
			var that = this;
			device.set("exemptionDate", $("#exemptiondate").datepicker('getDate'));
			var item = this.exemptedDeviceListItemTemplate(device.toJSON());
			$(item).appendTo(this.$("#devices>ul")).mouseenter(function() {
				var $this = $(this);
				if (!$this.hasClass("active")) {
					$this.addClass("hover");
				}
			}).mouseleave(function() {
				$(this).removeClass("hover");
			}).click(function(e) {
				var $this = $(this);
				if (e.ctrlKey) {
					if ($this.hasClass('active')) {
						$this.removeClass('active');
					}
					else {
						$this.addClass("active");
					}
				}
				else if (e.shiftKey) {
					document.getSelection().removeAllRanges();
					var i = $this.closest('ul').find('.active').last().index();
					var j = $this.index();
					$this.closest('ul').find('li').slice(i <= j ? i : j, (i <= j ? j
							: i) + 1).addClass('active');
				}
				else {
					$this.closest('ul').find('.active').removeClass('active');
					$this.addClass("active");
				}
				that.refreshRemoveState();
			});
		},

		renderSearchedDeviceListItem: function(device) {
			this.htmlBuffer += this.deviceListItemTemplate(device.toJSON());
		},

	});
});
