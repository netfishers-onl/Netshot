/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'models/device/DeviceTypeCollection',
	'text!templates/devices/searchToolbox.html',
	'rangyinput'
], function($, _, Backbone, DeviceTypeCollection,
		searchToolboxTemplate) {

	return Backbone.View.extend({

		el: "#nsdevices-searchtoolbox",
		
		defaultAttributes: [ {
			level: "DEVICE",
			name: "creationDate",
			title: "Creation date",
			type: "DATE",
			searchable: true
		}, {
			level: "DEVICE",
			name: "comments",
			title: "Comments",
			type: "TEXT",
			searchable: true
		}, {
			level: "DEVICE",
			name: "contact",
			title: "Contact",
			type: "TEXT",
			searchable: true
		}, {
			level: "DEVICE",
			name: "location",
			title: "Location",
			type: "TEXT",
			searchable: true
		}, {
			level: "DEVICE",
			name: "modules",
			title: "Module",
			type: "TEXT",
			searchable: true
		}, {
			level: "DEVICE",
			name: "interfaces",
			title: "Interface",
			type: "TEXT",
			searchable: true
		}, {
			level: "DEVICE",
			name: "networkClass",
			title: "Network class",
			type: "ENUM",
			values: [ "FIREWALL", "ROUTER", "SWITCH", "ROUTERSWITCH", "FIREWALL", "UNKNOWN", "LOADBALANCER" ],
			searchable: true
		}, {
			level: "DEVICE",
			name: "ipAddress",
			title: "IP",
			type: "IPADDRESS",
			searchable: true
		}, {
			level: "DEVICE",
			name: "macAddress",
			title: "MAC",
			type: "MACADDRESS",
			searchable: true
		}, {
			level: "DEVICE",
			name: "softwareVersion",
			title: "Software version",
			type: "TEXT",
			searchable: true
		}, {
			level: "DEVICE",
			name: "softwareLevel",
			title: "Software Level",
			type: "ENUM",
			values: [ "GOLD", "SILVER", "BRONZE", "UNKNOWN" ],
			searchable: true
		}, {
			level: "DEVICE",
			name: "status",
			title: "Status",
			type: "ENUM",
			values: [ "INPRODUCTION", "DISABLED", "PREPRODUCTION" ],
			searchable: true
		}, {
			level: "DEVICE",
			name: "vrf",
			title: "VRF",
			type: "TEXT",
			searchable: true
		}, {
			level: "DEVICE",
			name: "name",
			title: "Name",
			type: "TEXT",
			searchable: true
		}, {
			level: "DEVICE",
			name: "vitualName",
			title: "Virtual Name",
			type: "TEXT",
			searchable: true
		}, {
			level: "DEVICE",
			name: "changeDate",
			title: "Last change date",
			type: "DATE",
			searchable: true
		}, {
			level: "DEVICE",
			name: "device",
			title: "Device",
			type: "ID",
			searchable: true
		} ],

		template: _.template(searchToolboxTemplate),

		deviceTypes: new DeviceTypeCollection([]),

		initialize: function(options) {
			var that = this;
			this.deviceTypes.fetch().done(function() {
				that.render();
			});
		},
		
		render: function() {
			var that = this;
			this.$el.html(this.template);
			$('<option />').attr('value', "").text("[Any]").appendTo(this.$('#devicetype'));
			this.deviceTypes.each(function(deviceType) {
				$('<option />').attr('value', deviceType.get('name')).text(deviceType
						.get('description')).appendTo(that.$('#devicetype'));
			});
			this.$('#builder-clear').click(function() {
				that.$('#expression').focus().val("");
				return false;
			});
			this.$('#builder-not').click(function() {
				that.$('#expression').focus().val('NOT (' + that.$('#expression').val() + ')');
				return false;
			});
			this.$('#builder-and').click(function() {
				var text = '(' + that.$('#expression').val() + ') AND ()';
				that.$('#expression').focus().val(text);
				var l = text.length;
				that.$('#expression').setSelection(l - 1, l - 1);
				return false;
			});
			this.$('#builder-or').click(function() {
				var text = '(' + that.$('#expression').val() + ') OR ()';
				that.$('#expression').focus().val(text);
				var l = text.length;
				that.$('#expression').setSelection(l - 1, l - 1);
				return false;
			});
			this.$('#fieldname').change(function() {
				that.$('#fieldbuttons button').button('destroy');
				that.$('#fieldbuttons').empty();
				var attributes = that.defaultAttributes;
				if (typeof that.driver === "object" && that.driver) {
					attributes = _.union(attributes, that.driver.get("attributes"));
				}
				var attribute = _.findWhere(attributes, { name: $(this).val() });
				var name = attribute.title;
				var type = attribute.type;

				var actions = {
					'TEXT': {
						'IS': '[' + name + '] IS "text"',
						'CONTAINS': '[' + name + '] CONTAINS "text"',
						'STARTSWITH': '[' + name + '] STARTSWITH "text"',
						'ENDSWITH': '[' + name + '] ENDSWITH "text"',
					},
					'LONGTEXT': {
						'IS': '[' + name + '] IS "text"',
						'CONTAINS': '[' + name + '] CONTAINS "text"',
						'STARTSWITH': '[' + name + '] STARTSWITH "text"',
						'ENDSWITH': '[' + name + '] ENDSWITH "text"',
					},
					'NUMERIC': {
						'IS': '[' + name + '] IS 16',
						'LESSTHAN': '[' + name + '] LESSTHAN 16',
						'GREATERTHAN': '[' + name + '] GREATERTHAN 16'
					},
					'ID': {
						'IS': '[' + name + '] IS 16',
					},
					'DATE': {
						'IS': '[' + name + '] IS "2012-01-16"',
						'BEFORE': '[' + name + '] BEFORE "2012-01-16"',
						'AFTER': '[' + name + '] AFTER "2012-01-16"',
					},
					'IPADDRESS': {
						'IS': '[' + name + '] IS 16.16.16.16',
						'IN': '[' + name + '] IN 16.16.0.0/16'
					},
					'MACADDRESS': {
						'IS': '[' + name + '] IS 1616.1616.1616',
						'IN': '[' + name + '] IN 1616.1616.1616/32'
					},
					'BINARY': {
						'YES': '[' + name + ']',
						'NO': 'NOT([' + name + '])'
					},
					'ENUM': function() {
						var buttons = {};
						for (a in this.values) {
							var value = this.values[a];
							buttons[value] = '[' + this.title + '] IS "' + value + '"';
						}
						return buttons;
					}
				};

				var buttons;
				if (typeof actions[type] === "object" && actions[type]) {
					buttons = actions[type];
				}
				else {
					buttons = actions[type].call(attribute);
				}
				_.each(buttons, function(action, caption) {
					$('<button />').text(caption).button().click(function() {
						that.$('#expression').replaceSelectedText(action);
						return false;
					}).appendTo(that.$('#fieldbuttons'));
				});
			});
			this.$('#devicetype').change(function() {
				that.$('#fieldname').empty();
				var attributes = that.defaultAttributes;
				that.driver = that.deviceTypes.findWhere({ name: $(this).val() });
				if (typeof that.driver === "object" && that.driver) {
					attributes = _.union(attributes, that.driver.get("attributes"));
				}
				attributes = _.sortBy(attributes, "title");
				for (var a in attributes) {
					var attribute = attributes[a];
					if (!attribute.searchable) continue;
					$('<option />').attr('value', attribute.name)
							.text(attribute.title).appendTo(that.$('#fieldname'));
				}
				that.$('#fieldname').change();
			}).change();
			this.$('button').button().addClass('ui-button');

			if (typeof this.options.onRendered === "function") {
				this.options.onRendered();
			}

			return this;
		},

	});
});
