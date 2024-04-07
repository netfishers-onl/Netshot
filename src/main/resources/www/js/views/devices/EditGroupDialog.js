/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'models/device/DeviceCollection',
	'models/device/DeviceGroupModel',
	'text!templates/devices/editGroup.html',
	'text!templates/devices/editStaticGroup.html',
	'text!templates/devices/editDynamicGroup.html',
	'text!templates/devices/editStaticGroupDeviceListItem.html',
	'views/devices/SearchToolbox' ], function($, _, Backbone, Dialog,
			DeviceCollection, DeviceGroupModel, editGroupTemplate,
			editStaticGroupTemplate, editDynamicGroupTemplate,
			editStaticGroupDeviceListItemTemplate, SearchToolbox) {

	return Dialog.extend({

		template: _.template(editGroupTemplate),
		staticGroupDeviceListItemTemplate: _.template(editStaticGroupDeviceListItemTemplate),

		dialogOptions: {
			title: "Edit group",
			width: "700px"
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
				var group = {
					'name': that.$('#groupname').val(),
					'folder': that.$('#groupfolder').val(),
					'hiddenFromReports': that.$('#hiddenfromreports').prop('checked')
				};

				if (that.model.get('type').match(/StaticDeviceGroup$/)) {
					group.staticDevices = [];
					that.$('#devices>ul li').each(function() {
						group.staticDevices.push($(this).data('device-id'));
					});
				}
				else if (that.model.get('type').match(/DynamicDeviceGroup$/)) {
					group.driver = that.$('#devicetype').val();
					group.query = that.$('#expression').val();
				}

				saveModel.save(group).done(function(data) {
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

		onCreate: function() {
			if (this.model.get('type').match(/StaticDeviceGroup$/)) {
				this.renderStaticGroup();
			}
			else if (this.model.get('type').match(/DynamicDeviceGroup$/)) {
				this.renderDynamicGroup();
			}
		},

		renderStaticGroup: function() {
			var that = this;
			var template = _.template(editStaticGroupTemplate);
			this.$('#groupdetails').html(template(this.model.toJSON()));
			this.staticDevices = new DeviceCollection([]);
			this.staticDevices.filter = {
				type: "group",
				group: this.model.get('id')
			};
			this.staticDevices.fetch().done(function() {
				that.htmlBuffer = "";
				that.staticDevices.each(that.renderSearchedDeviceListItem, that);
				that.$('#devices>ul').html(that.htmlBuffer).find('li').each(function() {
					that.addStaticMember($(this));
				});
			});
			this.$('#adddevice').button({
				icons: {
					primary: "ui-icon-caret-1-e"
				},
				text: false,
				disabled: true
			})
			.click(
					function() {
						that.$("#devices>ul li.active").removeClass("active");
						that.$("#alldevices>ul li.active")
						.each(
								function() {
									var id = $(this).data('device-id');
									if (that.$('#devices>ul li[data-device-id="' + id
											+ '"]').length == 0) {
										that.addStaticMember($(this).clone());
									}
								}).removeClass('active').hide();
						that.refreshAddState();
						that.refreshRemoveState();
						return false;
					});
			this.$('#removedevice').button({
				icons: {
					primary: "ui-icon-caret-1-w"
				},
				text: false,
				disabled: true
			}).click(
					function() {
						that.$('#alldevices>ul li').removeClass('active');
						that.$("#devices>ul li.active").each(
								function() {
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
		},

		renderDynamicGroup: function() {
			var that = this;
			var template = _.template(editDynamicGroupTemplate);
			this.$('#groupdetails').html(template(this.model.toJSON()));
			var searchToolbox = new SearchToolbox({
				onRendered: function() {
					that.$('#devicetype').val(that.model.get('driver'));
					that.$('#expression').val(that.model.get('query'));
				}
			});
			this.$('#preview').button({
				icons: {
					primary: "ui-icon-search"
				}
			}).click(function() {
				var $this = $(this);
				$this.button('disable');
				that.$("#error").hide();
				that.searchedDevices = new DeviceCollection([]);
				that.searchedDevices.filter = {
					type: "advanced",
					query: that.$('#expression').val(),
					driver: that.$('#devicetype').val()
				};
				that.searchedDevices.fetch().done(function() {
					that.htmlBuffer = "";
					that.searchedDevices.each(that.renderSearchedDeviceListItem, that);
					that.$("#previewdevices").html(that.htmlBuffer).show();
					$this.button('enable');
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$this.button('enable');
				});
				return false;
			});
		},

		renderSearchedDevices: function() {
			var that = this;
			this.htmlBuffer = "";
			this.searchedDevices.each(this.renderSearchedDeviceListItem, this);
			this.$("#alldevices>ul").html(this.htmlBuffer);
			this.$(".placeholder").toggle(this.searchedDevices.length === 0);
			this.refreshAddState();
			this.$("#alldevices>ul li").mouseenter(function() {
				var $this = $(this);
				if (!$this.hasClass("active")) {
					$this.addClass("hover");
				}
			}).mouseleave(function() {
				$(this).removeClass("hover");
			}).click(function(e) {
				that.$("#devices>ul .active").removeClass("active");
				that.$('#removedevice').button('disable');
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
					$this.closest('ul').find('li').slice(i <= j ? i : j,
							(i <= j ? j : i) + 1).addClass('active');
				}
				else {
					$this.closest('ul').find('.active').removeClass('active');
					$this.addClass("active");
				}
				that.refreshAddState();
			}).each(function() {
				var id = $(this).data('device-id');
				if (that.$('#devices>ul li[data-device-id="' + id + '"]').length > 0) {
					$(this).hide();
				}
			});
		},

		refreshAddState: function() {
			if (this.$('#alldevices>ul li.active').length > 0) {
				this.$('#adddevice').button('enable');
			}
			else {
				this.$('#adddevice').button('disable');
			}
		},

		refreshRemoveState: function() {
			if (this.$('#devices>ul li.active').length > 0) {
				this.$('#removedevice').button('enable');
			}
			else {
				this.$('#removedevice').button('disable');
			}
		},

		addStaticMember: function(item) {
			var that = this;
			$(item).appendTo(this.$("#devices>ul")).mouseenter(function() {
				var $this = $(this);
				if (!$this.hasClass("active")) {
					$this.addClass("hover");
				}
			}).mouseleave(function() {
				$(this).removeClass("hover");
			}).click(function(e) {
				var $this = $(this);
				that.$("#alldevices>ul .active").removeClass("active");
				that.$('#adddevice').button('disable');
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
					$this.closest('ul').find('li').slice(i <= j ? i : j,
							(i <= j ? j : i) + 1).addClass('active');
				}
				else {
					$this.closest('ul').find('.active').removeClass('active');
					$this.addClass("active");
				}
				that.refreshRemoveState();
			});
		},

		renderSearchedDeviceListItem: function(device) {
			this.htmlBuffer += this
				.staticGroupDeviceListItemTemplate(device.toJSON());
		},

	});
});
