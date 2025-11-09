/** Copyright 2013-2025 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'models/device/DeviceTypeCollection',
	'models/domain/DomainCollection',
	'models/diagnostic/DiagnosticCollection',
	'models/compliance/PolicyCollection',
	'models/compliance/RuleCollection',
	'text!templates/devices/searchToolbox.html',
	'rangyinput'
], function($, _, Backbone, DeviceTypeCollection, DomainCollection, DiagnosticCollection,
		PolicyCollection, RuleCollection, searchToolboxTemplate) {

	return Backbone.View.extend({

		el: "#nsdevices-searchtoolbox",

		fieldTypes: {
			GENERIC: "Generic attributes",
			DRIVER: "Type-specific attributes",
			COMPLIANCE: "Compliance rule results",
			DIAGNOSTIC: "Diagnostic results",
		},
		
		genericAttributes: [ {
			level: "DEVICE",
			name: "creationDate",
			title: "Creation Date",
			type: "DATE",
		}, {
			level: "DEVICE",
			name: "comments",
			title: "Comments",
			type: "TEXT",
		}, {
			level: "DEVICE",
			name: "contact",
			title: "Contact",
			type: "TEXT",
		}, {
			level: "DEVICE",
			name: "location",
			title: "Location",
			type: "TEXT",
		}, {
			level: "DEVICE",
			name: "modules",
			title: "Module",
			type: "TEXT",
		}, {
			level: "DEVICE",
			name: "interfaces",
			title: "Interface",
			type: "TEXT",
		}, {
			level: "DEVICE",
			name: "networkClass",
			title: "Network Class",
			type: "ENUM",
			values: [
				"FIREWALL", "LOADBALANCER", "ROUTER", "SERVER", "SWITCH",
				"SWITCHROUTER", "ACCESSPOINT", "WIRELESSCONTROLLER",
				"CONSOLESERVER", "UNKNOWN", "VOICEGATEWAY",
			],
		}, {
			level: "DEVICE",
			name: "ipAddress",
			title: "IP",
			type: "IPADDRESS",
		}, {
			level: "DEVICE",
			name: "macAddress",
			title: "MAC",
			type: "MACADDRESS",
		}, {
			level: "DEVICE",
			name: "softwareVersion",
			title: "Software Version",
			type: "TEXT",
		}, {
			level: "DEVICE",
			name: "softwareLevel",
			title: "Software Level",
			type: "ENUM",
			values: [ "GOLD", "SILVER", "BRONZE", "UNKNOWN" ],
		}, {
			level: "DEVICE",
			name: "status",
			title: "Status",
			type: "ENUM",
			values: [ "INPRODUCTION", "DISABLED", "PREPRODUCTION" ],
		}, {
			level: "DEVICE",
			name: "vrf",
			title: "VRF",
			type: "TEXT",
		}, {
			level: "DEVICE",
			name: "name",
			title: "Name",
			type: "TEXT",
		}, {
			level: "DEVICE",
			name: "vitualName",
			title: "Virtual Name",
			type: "TEXT",
		}, {
			level: "DEVICE",
			name: "family",
			title: "Family",
			type: "TEXT",
		}, {
			level: "DEVICE",
			name: "changeDate",
			title: "Last change date",
			type: "DATE",
		}, {
			level: "DEVICE",
			name: "id",
			title: "ID",
			type: "ID",
		}, {
			level: "DEVICE",
			name: "domain",
			title: "Domain",
			type: "ENUM",
			values: function() {
				return this.domains.map(function(domain) {
					return {
						caption: domain.get('id') + " (" + domain.get('name') + ")",
						id: domain.get('id'),
					};
				});
			},
		}, {
			level: "DEVICE",
			name: "type",
			title: "Type",
			type: "_DEVICETYPE",
		} ].sort((a, b) => a.title.localeCompare(b.title)),

		template: _.template(searchToolboxTemplate),

		initialize: function(options) {
			var that = this;
			this.deviceTypes = new DeviceTypeCollection([]);
			this.domains = new DomainCollection([]);
			this.diagnostics = new DiagnosticCollection([]);
			this.policies = new PolicyCollection([]);
			this.rules = new RuleCollection([]);
			this.render();
		},

		setExpression: function(expression) {
			this.$('#expression').val(expression).keydown();
		},

		getExpression: function() {
			return this.$('#expression').val();
		},

		escapeValue: function(value) {
			return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
		},

		addActionButtons: function(actions) {
			var that = this;
			_.each(actions, function(action, caption) {
				$('<button />').text(caption).button().click(function() {
					that.$('#expression').replaceSelectedText(action);
					that.$('#builder-clear').show();
					return false;
				}).appendTo(that.$('#fieldbuttons'));
			});
		},

		setActionButtons: function(actions) {
			var that = this;
			this.$('#fieldbuttons button').button('destroy');
			this.$('#fieldbuttons').empty();
			this.addActionButtons(actions);
		},

		diagnosticToActions: function(diagnostic) {
			var that = this;
			if (!diagnostic) {
				return [];
			}
			var name = "Diagnostic > " + this.escapeValue(diagnostic.get('name'));
			var resultType = diagnostic.get('resultType');
			var actions = {
				'NUMERIC': {
					'is': '[' + name + '] is 16',
					'lessthan': '[' + name + '] lessthan 16',
					'greaterthan': '[' + name + '] greaterthan 16',
				},
				'TEXT': {
					'is': '[' + name + '] is "text"',
					'contains': '[' + name + '] contains "text"',
					'containsnocase': '[' + name + '] containsnocase "text"',
					'startswith': '[' + name + '] startswith "text"',
					'endswith': '[' + name + '] endswith "text"',
					'matches': '[' + name + '] matches "pattern"',
				},
				'BINARY': {
					'true': '[' + name + '] is true',
					'false': '[' + name + '] is false',
				},
			};
			return actions[resultType];
		},

		attributeToActions: function(attribute, driverDescription) {
			var that = this;
			if (!attribute) {
				return [];
			}
			var name = this.escapeValue(attribute.title);
			if (driverDescription) {
				name = driverDescription + " > " + name;
			}
			var type = attribute.type;

			var exampleValue = attribute.exampleValue || "text";

			var actions = {
				'TEXT': {
					'is': '[' + name + '] is "' + exampleValue + '"',
					'contains': '[' + name + '] contains "' + exampleValue + '"',
					'containsnocase': '[' + name + '] containsnocase "' + exampleValue + '"',
					'startswith': '[' + name + '] startswith "' + exampleValue + '"',
					'endswith': '[' + name + '] endswith "' + exampleValue + '"',
					'matches': '[' + name + '] matches "pattern"',
				},
				'LONGTEXT': {
					'is': '[' + name + '] is "' + exampleValue + '"',
					'contains': '[' + name + '] contains "' + exampleValue + '"',
					'containsnocase': '[' + name + '] containsnocase "' + exampleValue + '"',
					'startswith': '[' + name + '] startswith "' + exampleValue + '"',
					'endswith': '[' + name + '] endswith "' + exampleValue + '"',
					'matches': '[' + name + '] matches "pattern"',
				},
				'NUMERIC': {
					'is': '[' + name + '] is 16',
					'lessthan': '[' + name + '] lessthan 16',
					'greaterthan': '[' + name + '] greaterthan 16'
				},
				'ID': {
					'is': '[' + name + '] is 16',
				},
				'DATE': {
					'is': '[' + name + '] is "2012-01-16"',
					'before': '[' + name + '] before "2012-01-16"',
					'after': '[' + name + '] after "2012-01-16"',
					'before (relative)': '[' + name + '] before "Now -1d"',
				},
				'IPADDRESS': {
					'is': '[' + name + '] is 16.16.16.16',
					'in': '[' + name + '] in 16.16.0.0/16'
				},
				'MACADDRESS': {
					'is': '[' + name + '] is 1616.1616.1616',
					'in': '[' + name + '] in 1616.1616.1616/32'
				},
				'BINARY': {
					'true': '[' + name + '] is true',
					'false': '[' + name + '] is false'
				},
				'ENUM': function() {
					var buttons = {};
					var values = this.values;
					if (typeof values === "function") {
						values = values.call(that);
					}
					for (a in values) {
						var value = values[a];
						if (typeof value === "string") {
							buttons[value] = '[' + this.title + '] is "' + value + '"';
						}
						else {
							buttons[value.caption] = '[' + this.title + '] is ' + value.id;
						}
					}
					return buttons;
				},
				'_DEVICETYPE': function() {
					const name = this.name;
					const exampleValue = "Cisco IOS and IOS-XE";
					const buttons = {
						'is': '[' + name + '] is "' + exampleValue + '"',
						'contains': '[' + name + '] contains "' + exampleValue + '"',
						'containsnocase': '[' + name + '] containsnocase "' + exampleValue + '"',
						'startswith': '[' + name + '] startswith "' + exampleValue + '"',
						'endswith': '[' + name + '] endswith "' + exampleValue + '"',
						'matches': '[' + name + '] matches "pattern"',
					};
					that.deviceTypes.each(function(type) {
						buttons[type.get('description')] = '[' + name + '] is "' + type.get('description') + '"';
					});
					return buttons;
				},
			};

			if (typeof actions[type] === "function") {
				return actions[type].call(attribute);
			}

			return actions[type];
		},
		
		render: function() {
			var that = this;
			this.$el.html(this.template);

			for (var t in this.fieldTypes) {
				$('<option />')
					.attr('value', t)
					.text(this.fieldTypes[t])
					.appendTo(that.$('#fieldtype'));
			}

			for (var a in this.genericAttributes) {
				var attribute = this.genericAttributes[a];
				$('<option />')
					.attr('value', attribute.name)
					.text(attribute.title)
					.appendTo(that.$('#genericfieldname'));
			}

			this.$('#builder-clear')
				.unbind('click')
				.button({
					icons: {
						primary: "ui-icon-close"
					},
					text: false,
				})
				.addClass("nsbutton-icononly")
				.click(function() {
					that.$('#expression').focus().val("");
					$(this).hide();
					return false;
				})
				.hide();

			this.$('#expression').keydown(function() {
				that.$('#builder-clear').toggle($(this).val() !== "");
			});

			this.$('#builder-not').click(function() {
				that.$('#expression').focus().val('not (' + that.$('#expression').val() + ')');
				return false;
			});
			this.$('#builder-and').click(function() {
				var text = '(' + that.$('#expression').val() + ') and ()';
				that.$('#expression').focus().val(text);
				var l = text.length;
				that.$('#expression').setSelection(l - 1, l - 1);
				return false;
			});
			this.$('#builder-or').click(function() {
				var text = '(' + that.$('#expression').val() + ') or ()';
				that.$('#expression').focus().val(text);
				var l = text.length;
				that.$('#expression').setSelection(l - 1, l - 1);
				return false;
			});

			this.$('#fieldtype').change(function() {
				var type = $(this).val();
				var $genericFieldSelect = that.$('#genericfieldname').hide();
				var $typeSelect = that.$('#devicetype').hide();
				that.$('#driverfieldname').hide();
				var $policySelect = that.$('#policy').hide();
				that.$('#rule').hide();
				var $diagnosticSelect = that.$('#diagnostic').hide();
				that.setActionButtons();
				if (type === "GENERIC") {
					$.when(
						that.domains.fetch(),
						that.deviceTypes.fetch(),
					).then(function() {
						$genericFieldSelect.show().change();
					});
				}
				else if (type === "DRIVER") {
					$typeSelect.empty();
					that.deviceTypes.fetch().then(function() {
						that.deviceTypes.each(function(deviceType) {
							$('<option />')
								.attr('value', deviceType.get('name'))
								.text(deviceType.get('description'))
								.appendTo($typeSelect);
						});
						$typeSelect.show().change();
					});
				}
				else if (type === "COMPLIANCE") {
					$policySelect.empty();
					that.policies.fetch().then(function() {
						that.policies.each(function(policy) {
							$('<option />')
								.attr('value', policy.get('id'))
								.text(policy.get('name'))
								.appendTo($policySelect);
						});
						if (that.policies.length === 0) {
							$('<option />')
								.attr('value', -1)
								.text("(No policy defined)")
								.appendTo($policySelect);
						}
						$policySelect.show().change();
					});
				}
				else if (type === "DIAGNOSTIC") {
					$diagnosticSelect.empty();
					that.diagnostics.fetch().then(function() {
						that.diagnostics.each(function(policy) {
							$('<option />')
								.attr('value', policy.get('id'))
								.text(policy.get('name'))
								.appendTo($diagnosticSelect);
						});
						if (that.diagnostics.length === 0) {
							$('<option />')
								.attr('value', -1)
								.text("(No diagnostic defined)")
								.appendTo($diagnosticSelect);
						}
						$diagnosticSelect.show().change();
					});
				}
			});

			this.$('#genericfieldname').change(function() {
				var attributes = that.genericAttributes;
				var attribute = _.findWhere(attributes, { name: $(this).val() });
				var actions = that.attributeToActions(attribute);
				that.setActionButtons(actions);
			});

			this.$('#devicetype').change(function() {
				var $driverFieldSelect = that.$('#driverfieldname');
				$driverFieldSelect.empty();
				that.driver = that.deviceTypes.findWhere({ name: $(this).val() });
				var attributes = that.driver.get("attributes");
				for (var a in attributes) {
					var attribute = attributes[a];
					if (!attribute.searchable) continue;
					$('<option />')
						.attr('value', attribute.name)
						.text(attribute.title)
						.appendTo($driverFieldSelect);
				}
				$driverFieldSelect.show().change();
			});

			this.$('#driverfieldname').change(function() {
				var attributes = that.driver.get('attributes');
				var attribute = _.findWhere(attributes, { name: $(this).val() });
				var actions = that.attributeToActions(attribute, that.driver.get('description'));
				that.setActionButtons(actions);
			});

			this.$('#policy').change(function() {
				var policyId = $(this).val();
				that.policy = that.policies.get(policyId);
				var $ruleSelect = that.$('#rule');
				$ruleSelect.empty();
				if (that.policy) {
					that.rules.reset();
					that.rules.policy = that.policy;
					that.rules.fetch().then(function() {
						that.rules.each(function(rule) {
							$('<option />')
								.attr('value', rule.get('id'))
								.text(rule.get('name'))
								.appendTo($ruleSelect);
						});
						if (that.rules.length === 0) {
							$('<option />')
								.attr('value', -1)
								.text("(No rule defined in this policy)")
								.appendTo($ruleSelect);
						}
						$ruleSelect.show().change();
					});
				}
			});

			this.$('#rule').change(function() {
				that.rule = that.rules.get($(this).val());
				var actions = {};
				if (that.rule) {
					var name = "Rule > " +
						that.escapeValue(that.policy.get("name")) +
						" > " + that.escapeValue(that.rule.get("name"));
					_.each([
						"CONFORMING",
						"NONCONFORMING",
						"NOTAPPLICABLE",
						"EXEMPTED",
						"DISABLED",
						"INVALIDRULE",
					], function(o) {
						actions[o] = "[" + name + "] is \"" + o + "\"";
					});
				}
				that.setActionButtons(actions);
			});

			this.$('#diagnostic').change(function() {
				that.diagnostic = that.diagnostics.get($(this).val());
				var actions = that.diagnosticToActions(that.diagnostic);
				that.setActionButtons(actions);
			});

			this.$('#fieldtype').change();

			this.$('button').button().addClass('ui-button');

			if (typeof this.options.onRendered === "function") {
				this.options.onRendered.call(this);
			}

			return this;
		},

	});
});
