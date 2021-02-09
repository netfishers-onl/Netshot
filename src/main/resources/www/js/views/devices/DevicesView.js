/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/devices/devices.html',
	'text!templates/devices/devicesToolBar.html',
	'text!templates/devices/deviceListItem.html',
	'text!templates/devices/groupListItem.html',
	'text!templates/devices/groupFolderListItem.html',
	'text!templates/devices/searchDeviceStatus.html',
	'views/devices/AddDeviceDialog',
	'views/devices/ScanSubnetsDialog',
	'views/devices/AddGroupDialog',
	'views/devices/DeleteGroupDialog',
	'models/device/DeviceCollection',
	'models/device/DeviceGroupCollection',
	'views/devices/DeviceView',
	'views/devices/MultiDevicesView',
	'views/devices/AdvancedSearchDialog',
	'views/devices/EditGroupDialog',
	'models/device/DeviceTypeCollection',
	'views/tasks/CreateTaskDialog'
],

function($, _, Backbone, devicesTemplate, devicesToolbarTemplate,
		deviceListItemTemplate, groupListItemTemplate, groupFolderListItemTemplate,
		searchDeviceStatusTemplate, AddDeviceDialog, ScanSubnetsDialog,
		AddGroupDialog, DeleteGroupDialog, DeviceCollection, DeviceGroupCollection,
		DeviceView, MultiDevicesView, AdvancedSearchDialog, EditGroupDialog,
		DeviceTypeCollection, CreateTaskDialog) {

	makeLoadProgress(13);

	var DevicesView = Backbone.View.extend({

		el: $("#page"),

		template: _.template(devicesTemplate),
		itemTemplate: _.template(deviceListItemTemplate),
		groupItemTemplate: _.template(groupListItemTemplate),
		groupFolderItemTemplate: _.template(groupFolderListItemTemplate),
		searchDeviceStatusTemplate: _.template(searchDeviceStatusTemplate),

		initialize: function(options) {
			this.initialDevice = options.id;
			this.devices = new DeviceCollection([]);
			this.groups = new DeviceGroupCollection([]);
			this.deviceTypes = new DeviceTypeCollection([]);
			this.device = null;
			this.group = null;
			this.restoreFilter();
			this.deviceView = null;
			this.advancedSearchDialog = null;
			try {
				DevicesView.savedGroupListHeight = parseInt(localStorage.getItem("DevicesView.savedGroupListHeight"));
			}
			catch (e) {
				// Ignore
			}
			try {
				DevicesView.savedListWidth = parseInt(localStorage.getItem("DevicesView.savedListWidth"));
			}
			catch (e) {
				// Ignore
			}
		},

		render: function() {
			var that = this;
			$('#nstoolbar-devices').prop('checked', true);
			$('#nstoolbarpages').buttonset('refresh');

			this.$el.html(this.template);

			// The following is needed, otherwise this item gets a duplicate
			$('#nstoolbar-devices-addmenu').remove();
			$('#nstoolbar-section').html(_.template(devicesToolbarTemplate));
			if (!user.isReadWrite()) {
				$('#nstoolbar-section').empty();
			}
			$('#nstoolbar-devices-add').unbind('click').button().click(function() {
				var addDeviceMenu = $('#nstoolbar-devices-addmenu');
				$('.nstoolbarmenu').not(addDeviceMenu).hide();
				addDeviceMenu.toggle()
						.prependTo('#container').position({
							my: "left top",
							at: "left bottom",
							of: this
						});
				$('#nstoolbar-devices-addmenu #addsimple').unbind('click')
						.click(function() {
							addDeviceMenu.hide();
							var addDeviceDialog = new AddDeviceDialog({
								deviceTypes: that.deviceTypes
							});
							return false;
						});
				$('#nstoolbar-devices-addmenu #scansubnets').unbind('click')
						.click(function() {
							addDeviceMenu.hide();
							var scanSubnetsDialog = new ScanSubnetsDialog();
							return false;
						});
				$('#nstoolbar-devices-addmenu #addgroup').unbind('click')
						.click(function() {
							addDeviceMenu.hide();
							var addGroupDialog = new AddGroupDialog({
								onAdded: function(group) {
									that.group = group;
									that.fetchGroups();
								}
							});
							return false;
						});
				$(document).one('click', function() {
					addDeviceMenu.hide();
				});
				return false;
			});
			$('#nstoolbar-devices-add').buttonset();
			$('#nstoolbar-devices-addmenu').hide().menu();
			this.$('#nsdevices-openadvancedsearch').unbind('click').button({
				icons: {
					primary: "ui-icon-newwin"
				},
				text: false
			}).click(function() {
				that.advancedSearchDialog = new AdvancedSearchDialog({
					devicesView: that
				});
			});
			$('#nstoolbar-devices-schedule').button().off('click').on('click', function() {
				createTaskDialog = new CreateTaskDialog();
			});
			this.$('#nsdevices-clearsearch').unbind('click').button({
				icons: {
					primary: "ui-icon-close"
				},
				text: false
			}).click(function() {
				$(this).button('disable');
				that.devices.resetFilter();
				that.fetchDevices();
				return false;
			}).hide();
			this.$('#nsdevices-refreshsearch').unbind('click').button({
				icons: {
					primary: "ui-icon-refresh"
				},
				text: false
			}).click(function() {
				$(this).button('disable');
				that.fetchDevices();
				return false;
			});
			this.$('#nsdevices-selectall').unbind('click').button({
				icons: {
					primary: "ui-icon-grip-dotted-vertical"
				},
				text: false
			}).click(function() {
				$(this).button('disable');
				that.$('#nsdevices-listbox>ul li').addClass("active");
				that.renderMultiDevices();
				$(this).button('enable');
				return false;
			});
			this.$('#nsdevices-listbox').keydown(function(e) {
				if (e.which == 40) {
					$(this).find('.active').next().click();
				}
				else if (e.which == 38) {
					$(this).find('.active').prev().click();
				}
				return false;
			});
			this.$('#nsdevices-searchfield').keypress(function(e) {
				if (e.which == 13) {
					that.$('#nsdevices-searchfield').unbind('focus').unbind('focusout');
					var text = that.$('#nsdevices-searchfield').val();
					that.devices.resetFilter();
					that.devices.filter.type = "simple";
					that.devices.filter.query = text;
					that.devices.filter.text = text;
					that.fetchDevices();
				}
			});

			var setGroupHeight = function(h) {
				that.$("#nsdevices-groups").css("height", (h - 15) + "px");
				that.$("#nsdevices-list").css("top", (h + 5) + "px");
			};

			this.$("#nsdevices-sidedivider").draggable({
				containment: "#nsdevices-sidedividerzone",
				axis: "y",
				drag: function(event, ui) {
					setGroupHeight(ui.position.top);
					DevicesView.savedGroupListHeight = ui.position.top;
					try {
						localStorage.setItem("DevicesView.savedGroupListHeight", String(DevicesView.savedGroupListHeight));
					}
					catch (e) {
						// Ignore
					}
				}
			});
			if (DevicesView.savedGroupListHeight) {
				setGroupHeight(DevicesView.savedGroupListHeight);
				this.$("#nsdevices-sidedivider").css("top", DevicesView.savedGroupListHeight);
			}

			var setSideWidth = function(w) {
				that.$(".nssidebar").css("width", (w - 15) + "px");
				that.$("#nsdevices-search").css("width", (w - 7) + "px");
				that.$("#nsdevices-search>input").css("width", (w - 39) + "px");
				that.$("#nsdevices-listheader").css("width", (w - 70) + "px");
				that.$("#nsdevices-listbox").css("width", (w - 15) + "px");
				that.$("#nsdevices-device").css("left", (w + 10) + "px");
			};
			this.$("#nsdevices-sidewidthdivider").draggable({
				containment: "#nsdevices-sidewidthdividerzone",
				axis: "x",
				drag: function(event, ui) {
					setSideWidth(ui.position.left);
					DevicesView.savedListWidth = ui.position.left;
					try {
						localStorage.setItem("DevicesView.savedListWidth", String(DevicesView.savedListWidth));
					}
					catch (e) {
						// Ignore
					}
				}
			});
			if (DevicesView.savedListWidth) {
				setSideWidth(DevicesView.savedListWidth);
				this.$("#nsdevices-sidewidthdivider").css("left", DevicesView.savedListWidth);
			}

			this.fetchGroups();
			this.initFetchDevices();

			return this;
		},
		
		initFetchDevices: function() {
			var that = this;
			$.when(this.deviceTypes.fetch(), this.devices.fetch()).done(function() {
				that.renderDeviceList();
				that.saveFilter();
			});
		},

		fetchDevices: function() {
			var that = this;
			this.devices.fetch().done(function() {
				that.renderDeviceList();
				that.saveFilter();
			});
		},
		
		restoreFilter: function() {
			if (DevicesView.savedDeviceFilter) {
				this.devices.filter = DevicesView.savedDeviceFilter;
				this.group = DevicesView.savedGroup;
			}
		},
		
		saveFilter: function() {
			DevicesView.savedDeviceFilter = this.devices.filter;
			DevicesView.savedGroup = this.group;
		},

		fetchGroups: function() {
			var that = this;
			this.groups.fetch().done(function() {
				that.renderGroupList();
			});
		},

		renderDeviceList: function() {
			if (this.deviceView instanceof MultiDevicesView) {
				this.deviceView.destroy();
			}
			if (this.devices.filter.type == "none") {
				this.$("#nsdevices-searchfield").val("");
				this.$("#nsdevices-clearsearch").hide();
			}
			else if (typeof this.devices.filter.text === "string") {
				this.$("#nsdevices-searchfield").val(this.devices.filter.text);
				if (this.devices.filter.text != "") {
					this.$("#nsdevices-clearsearch").show().button("enable");
				}
				else {
					this.$("#nsdevices-clearsearch").hide();
				}
			}
			if (this.devices.filter.type != "group") {
				this.group = null;
				this.selectGroup(null);
			}
			if (this.devices.filter.type != "simple") {
				this.$("#nsdevices-searchfield").unbind('focus').unbind('focusout').focus(function() {
					$(this).data("oldval", $(this).val());
					$(this).val('');
					return false;
				}).focusout(function() {
					$(this).val($(this).data("oldval"));
					return false;
				});
			}
			this.renderDeviceHeader();
			this.htmlBuffer = "";
			this.devices.each(this.renderDeviceListItem, this);
			this.$("#nsdevices-listbox>ul").html(this.htmlBuffer);
			this.decorateDeviceList();
			this.$("#nsdevices-refreshsearch").button("enable");
			if (this.device != null) {
				this.highlightDevice(this.device.get('id'));
			}
			else if (typeof this.initialDevice === "number") {
				this.selectDevice(this.initialDevice);
				this.initialDevice = null;
			}
		},
		
		renderDeviceHeader: function() {
			this.$('#nsdevices-listheader').html(this.searchDeviceStatusTemplate({
				number: this.devices.length
			}));
		},
		
		renderDeviceListItem: function(device) {
			this.htmlBuffer += this.itemTemplate(device.toJSON());
		},
		
		getDeviceListItem: function(id) {
			if (typeof id === "undefined") {
				id = this.device.get('id');
			}
			return this.$('#nsdevices-listbox>ul li[data-device-id="' + id + '"]');
		},
		
		rerenderDeviceListItem: function() {
			var html = $(this.itemTemplate(this.device.toJSON()));
			this.getDeviceListItem().attr('class', html.attr('class')).html(html
					.html()).addClass("active");
		},
		
		deleteDeviceListItem: function() {
			this.getDeviceListItem().remove();
		},

		decorateDeviceList: function() {
			var that = this;
			this.$("#nsdevices-listbox>ul li").unbind().mouseenter(function() {
				var $this = $(this);
				if (!$this.hasClass("active")) {
					$this.addClass("hover");
				}
			}).mouseleave(function() {
				$(this).removeClass("hover");
			}).click(function(e) {
				var id = $(this).data('device-id');
				if (e.ctrlKey || e.shiftKey) {
					var $item = that.getDeviceListItem(id);
					if (e.ctrlKey) {
						$item.toggleClass("active");
					}
					else {
			      document.getSelection().removeAllRanges();
			      var i = $item.closest('ul').find('.active').last().index();
			      var j = $item.index();
			      $item.closest('ul').find('li').slice(i <= j ? i : j,
			          (i <= j ? j : i) + 1).addClass('active');
					}
					that.renderMultiDevices();
				}
				else {
					that.selectDevice(id);
				}
				return false;
			});
		},

		renderGroupList: function() {
			var that = this;
			this.$("#nsdevices-groups>ul").html("");
			this.groups.each(this.renderGroupListItem, this);
			this.decorateGroupList();
			if (this.group != null) {
				this.highlightGroup(this.group.get('id'));
			}
			this.sortGroupList();
		},

		renderGroupListItem: function(group) {
			var $folder = this.$("#nsdevices-groups>ul");
			var path = group.getPath();
			for (f in path) {
				var $child = $folder.children('li[data-folder="' + $.escapeSelector(path[f]) + '"]');
				if ($child.length === 0) {
					var item = this.groupFolderItemTemplate({
						name: path[f]
					});
					$folder.append($(item));
				}
				$folder = $folder.children('li[data-folder="' + $.escapeSelector(path[f]) + '"]').children('ul');
			}
			var item = this.groupItemTemplate(group.toJSON());
			$folder.append($(item));
		},
		
		sortGroupList: function(root) {
			var that = this;
			var $folder = (root ? root : this.$("#nsdevices-groups>ul"));
			$folder.children('li[data-folder]').children('ul').each(function() {
				that.sortGroupList($(this));
			});
			$folder.children().detach().sort(function(a, b) {
				if ($(a).data('folder') && !$(b).data('folder')) {
					return -1;
				}
				if (!$(a).data('folder') && $(b).data('folder')) {
					return 1;
				}
				var aK = $(a).find('.name').text().toLowerCase();
				var bK = $(b).find('.name').text().toLowerCase();
				return (aK < bK ? -1 : aK > bK ? 1 : 0);
			}).appendTo($folder);
		},

		decorateGroupList: function() {
			var that = this;
			this.$("#nsdevices-groups>ul li.nsdevices-list-groupfolder")
					.unbind().click(function() {
						$(this).toggleClass('expanded');
						if (!$(this).hasClass('expanded')) {
							$(this).find("li.nsdevices-list-groupfolder")
									.removeClass('expanded');
						}
						return false;
					});
			this.$("#nsdevices-groups>ul li.nsdevices-list-group").unbind()
					.mouseenter(function() {
						var $this = $(this);
						if (!$this.hasClass("active")) {
							$this.addClass("hover");
						}
					}).mouseleave(function() {
						$(this).removeClass("hover");
					}).click(function() {
						if ($(this).hasClass("active")) return;
						var id = $(this).data('group-id');
						that.selectGroup(id);
						return false;
					});
			if (!user.isReadWrite()) {
				this.$("#nsdevices-groups .edit").remove();
				this.$("#nsdevices-groups .delete").remove();
			}
			this.$("#nsdevices-groups .edit").unbind("click").button({
				icons: {
					primary: "ui-icon-wrench"
				},
				text: false
			}).click(function() {
				var editGroupDialog = new EditGroupDialog({
					model: that.group,
					onEdited: function() {
						var $folder = that.$("#nsdevices-groups>ul");
						var path = that.group.getPath();
						for (f in path) {
							var $child = $folder.children('li[data-folder="' + path[f] + '"]');
							if ($child.length === 0) {
								var item = that.groupFolderItemTemplate({
									name: path[f]
								});
								$folder.append($(item));
							}
							var $folder = $folder
									.find('li[data-folder="' + path[f] + '"]>ul');
							$folder.parent().addClass('expanded');
						}
						var item = that
								.$('#nsdevices-groups li.nsdevices-list-group[data-group-id="'
										+ that.group.get('id') + '"]');
						var parent = item.closest('ul');
						item = item.detach();
						$folder.append($(item));
						while (!parent.is("#nsdevices-groups>ul")) {
							if (parent.children().length === 0) {
								var newParent = parent.parent().closest('ul');
								parent.parent().remove();
								parent = newParent;
							}
							else {
								break;
							}
						}
						that.sortGroupList();
						that.decorateGroupList();
						that.fetchDevices();
					}
				});
				return false;
			});
			this.$("#nsdevices-groups .delete").unbind("click").button({
				icons: {
					primary: "ui-icon-trash"
				},
				text: false
			}).click(function() {
				var deleteGroupDialog = new DeleteGroupDialog({
					model: that.group,
					onDeleted: function(group) {
						that.devices.resetFilter();
						that.group = null;
						that.fetchGroups();
						that.fetchDevices();
					}
				});
				return false;
			});
		},

		selectDevice: function(id) {
			var that = this;
			this.$('#nsdevices-listbox>ul li.active').removeClass("active");
			var device = this.devices.get(id);
			if (device == null && id != null) {
				this.initialDevice = id;
				this.fetchDevices();
				return;
			}
			device.fetch().done(function() {
				that.device = device;
				that.renderDevice();
			});
			if (device) {
				this.highlightDevice(id);
			}
		},
		
		highlightDevice: function(id) {
			var item = this.getDeviceListItem(id);
			if (item.length > 0) {
				item.removeClass("hover").addClass("active");
				if (item.position().top > this.$('#nsdevices-listbox').height() - 30) {
					this.$('#nsdevices-listbox').scrollTop(item.position().top
							+ this.$('#nsdevices-listbox').scrollTop());
				}
			}
			else {
				this.device = null;
				this.renderDevice();
			}
		},
		
		renderDevice: function() {
			var that = this;
			if (this.deviceView != null) this.deviceView.destroy();
			if (this.device != null) {
				this.deviceView = new DeviceView({
					model: this.device,
					devicesView: this,
					deviceTypes: this.deviceTypes,
					onEdited: function() {
						that.device = that.deviceView.model;
						that.rerenderDeviceListItem();
						that.decorateDeviceList();
					},
					onDeleted: function() {
						that.device = that.deviceView.model;
						that.deleteDeviceListItem();
						that.devices.remove(that.device);
						that.device = null;
						that.renderDeviceHeader();
					}
				});
				this.deviceView.render();
			}
			this.decorateDeviceList();
		},
		
		renderMultiDevices: function() {
			var $items = this.$("#nsdevices-listbox>ul li.active");
			if ($items.length > 1) {
				if (this.deviceView != null) this.deviceView.destroy();
				this.device = null;
				this.deviceView = new MultiDevicesView({
					devicesView: this,
					deviceTypes: this.deviceTypes,
					onEdited: function(id) {
					},
					onDeleted: function() {
					}
				});
				this.deviceView.render();
			}
			else if ($items.length == 1) {
				this.selectDevice($items.data('device-id'));
			}
		},
		
		selectGroup: function(id) {
			this.$('#nsdevices-groups>ul li.active').removeClass("active");
			if (id == null) {
				return;
			}
			this.group = this.groups.get(id);
			if (this.group) {
				this.highlightGroup(id);
			}
		},
		
		highlightGroup: function(id) {
			var item = this.$('#nsdevices-groups>ul li[data-group-id="' + id + '"]');
			item.removeClass("hover").addClass("active");
			item.parents(".nsdevices-list-groupfolder").addClass("expanded");
			if (item.position().top > this.$('#nsdevices-groups').height() - 30) {
				this.$('#nsdevices-groups').scrollTop(item.position().top
						+ this.$('#nsdevices-groups').scrollTop());
			}
			this.devices.resetFilter;
			this.devices.filter.type = "group";
			this.devices.filter.text = "Group: " + this.group.get('name');
			this.devices.filter.group = id;
			this.fetchDevices();
		},

		destroy: function() {
			if (this.deviceView) {
				this.deviceView.destroy();
			}
		}

	});
	return DevicesView;
});
