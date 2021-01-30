/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/compliance/compliance.html',
	'text!templates/compliance/complianceToolBar.html',
	'text!templates/compliance/policyListItem.html',
	'text!templates/compliance/softwarePolicyListItem.html',
	'text!templates/compliance/ruleListItem.html',
	'text!templates/compliance/softwareRuleRow.html',
	'text!templates/compliance/hardwarePolicyListItem.html',
	'text!templates/compliance/hardwareRuleRow.html',
	'models/compliance/PolicyCollection',
	'models/compliance/RuleCollection',
	'models/compliance/SoftwareRuleCollection',
	'models/compliance/HardwareRuleCollection',
	'models/device/DeviceTypeCollection',
	'models/diagnostic/DiagnosticCollection',
	'views/compliance/AddPolicyDialog',
	'views/compliance/DeletePolicyDialog',
	'views/compliance/EditPolicyDialog',
	'views/compliance/AddRuleDialog',
	'views/compliance/DeleteRuleDialog',
	'views/compliance/EditRuleDialog',
	'views/compliance/ScriptRuleView',
	'views/compliance/TextRuleView',
	'views/compliance/AddSoftwareRuleDialog',
	'views/compliance/EditSoftwareRuleDialog',
	'views/compliance/DeleteSoftwareRuleDialog',
	'views/compliance/SortSoftwareRuleDialog',
	'views/compliance/AddHardwareRuleDialog',
	'views/compliance/EditHardwareRuleDialog',
	'views/compliance/DeleteHardwareRuleDialog'
], function($, _, Backbone, complianceTemplate, complianceToolBarTemplate,
		policyListItemTemplate, softwarePolicyListItemTemplate,
		ruleListItemTemplate, softwareRuleRowTemplate,
		hardwarePolicyListItemTemplate, hardwareRuleRowTemplate, PolicyCollection, RuleCollection,
		SoftwareRuleCollection, HardwareRuleCollection, DeviceTypeCollection, DiagnosticCollection,
		AddPolicyDialog, DeletePolicyDialog, EditPolicyDialog, AddRuleDialog, DeleteRuleDialog,
		EditRuleDialog, ScriptRuleView, TextRuleView, AddSoftwareRuleDialog, EditSoftwareRuleDialog,
		DeleteSoftwareRuleDialog, SortSoftwareRuleDialog, AddHardwareRuleDialog,
		EditHardwareRuleDialog, DeleteHardwareRuleDialog) {

	makeLoadProgress(13);

	return Backbone.View.extend({

		el: $("#page"),

		template: _.template(complianceTemplate),
		toolBarTemplate: _.template(complianceToolBarTemplate),
		policyTemplate: _.template(policyListItemTemplate),
		softwarePolicyTemplate: _.template(softwarePolicyListItemTemplate),
		ruleTemplate: _.template(ruleListItemTemplate),
		softwareRuleTemplate: _.template(softwareRuleRowTemplate),
		hardwarePolicyTemplate: _.template(hardwarePolicyListItemTemplate),
		hardwareRuleTemplate: _.template(hardwareRuleRowTemplate),

		initialize: function() {
			this.policies = new PolicyCollection([]);
			this.rules = new RuleCollection([], {
				policy: null
			});
			this.softwareRules = new SoftwareRuleCollection([]);
			this.hardwareRules = new HardwareRuleCollection([]);
			this.deviceTypes = new DeviceTypeCollection([]);
			this.diagnostics = new DiagnosticCollection([]);
		},

		render: function() {
			var that = this;
			$('#nstoolbar-compliance').prop('checked', true);
			$('#nstoolbarpages').buttonset('refresh');

			this.$el.html(this.template);

			$('#nstoolbar-section').html(this.toolBarTemplate);
			if (!user.isReadWrite()) {
				$('#nstoolbar-section').empty();
			}
			$('#nstoolbar-section button').button();
			$('#nstoolbar-compliance-addpolicy').unbind('click')
			.click(function() {
				var addPolicyDialog = new AddPolicyDialog({
					onAdded: function(policy) {
						that.rules.policy = policy;
						that.refreshPolicies();
					}
				});
			});

			this.refreshPolicies();
			return this;
		},

		refreshPolicies: function() {
			var that = this;
			$.when(this.policies.fetch({ reset: true }), this.deviceTypes.fetch(),
					this.diagnostics.fetch()).done(function() {
				that.renderPolicyList();
			});
		},

		renderPolicyListItem: function(policy) {
			var view = this.policyTemplate(policy.toJSON());
			this.$("#nscompliance-listbox>ul").append(view);
		},

		renderSoftwarePolicyListItem: function() {
			var view = this.softwarePolicyTemplate();
			this.$("#nscompliance-listbox>ul").append(view);
		},

		renderHardwarePolicyListItem: function() {
			var view = this.hardwarePolicyTemplate();
			this.$("#nscompliance-listbox>ul").append(view);
		},

		renderPolicyList: function() {
			var that = this;
			this.$("#nscompliance-listbox>ul").empty();
			this.renderSoftwarePolicyListItem();
			this.renderHardwarePolicyListItem();
			this.policies.each(this.renderPolicyListItem, this);

			this
			.$("#nscompliance-listbox .nscompliance-list-policy.config-policy")
			.mouseenter(function() {
				var $this = $(this);
				if (!$this.hasClass("active")) {
					$this.addClass("hover");
				}
			}).mouseleave(function() {
				$(this).removeClass("hover");
			}).click(function() {
				if ($(this).hasClass("active")) {
					return;
				}
				var id = $(this).closest('li').data("policy-id");
				that.rule = null;
				that.rules.policy = that.policies.get(id);
				that.refreshRules();
				that.renderRule();
				$(this).closest('ul').find('li').removeClass("active");
				$(this).addClass("active");
				that.$("#nscompliance-software").hide();
				that.$("#nscompliance-hardware").hide();
				that.$("#nscompliance-rulelist, #nscompliance-rule").show();
			});
			this
			.$("#nscompliance-listbox .nscompliance-list-policy.software-policy")
			.mouseenter(function() {
				var $this = $(this);
				if (!$this.hasClass("active")) {
					$this.addClass("hover");
				}
			}).mouseleave(function() {
				$(this).removeClass("hover");
			}).click(function() {
				if ($(this).hasClass("active")) {
					return;
				}
				that.refreshSoftwareRules();
				$(this).closest('ul').find('li').removeClass("active");
				$(this).addClass("active");
				that.$("#nscompliance-hardware").hide();
				that.$("#nscompliance-software").show();
				that.$("#nscompliance-rulelist, #nscompliance-rule").hide();
			});
			this
			.$("#nscompliance-listbox .nscompliance-list-policy.hardware-policy")
			.mouseenter(function() {
				var $this = $(this);
				if (!$this.hasClass("active")) {
					$this.addClass("hover");
				}
			}).mouseleave(function() {
				$(this).removeClass("hover");
			}).click(function() {
				if ($(this).hasClass("active")) {
					return;
				}
				that.refreshHardwareRules();
				$(this).closest('ul').find('li').removeClass("active");
				$(this).addClass("active");
				that.$("#nscompliance-software").hide();
				that.$("#nscompliance-hardware").show();
				that.$("#nscompliance-rulelist, #nscompliance-rule").hide();
			});
			if (!user.isReadWrite()) {
				this.$("#nscompliance-listbox .edit").remove();
				this.$("#nscompliance-listbox .delete").remove();
				this.$("#nscompliance-listbox .addrule").remove();
			}
			this
			.$("#nscompliance-listbox .nscompliance-list-policy.config-policy button.edit")
			.button({
				icons: {
					primary: "ui-icon-wrench"
				},
				text: false
			}).click(function() {
				var id = $(this).closest('li').data("policy-id");
				var editPolicyDialog = new EditPolicyDialog({
					model: that.policies.get(id),
					onEdited: function() {
						that.refreshPolicies();
					}
				});
			});
			this
			.$("#nscompliance-listbox .nscompliance-list-policy.config-policy button.delete")
			.button({
				icons: {
					primary: "ui-icon-trash"
				},
				text: false
			}).click(function() {
				var id = $(this).closest('li').data("policy-id");
				var deletePolicyDialog = new DeletePolicyDialog({
					model: that.policies.get(id),
					onDeleted: function() {
						that.rule = null;
						that.rules.policy = null;
						that.refreshPolicies();
						that.refreshRules();
						that.renderRule();
					}
				});
			});
			this
			.$("#nscompliance-listbox .nscompliance-list-policy.config-policy button.addrule")
			.button({
				icons: {
					primary: "ui-icon-plus"
				},
				text: false
			}).click(function() {
				var id = $(this).closest('li').data("policy-id");
				var addRuleDialog = new AddRuleDialog({
					model: that.policies.get(id),
					onAdded: function(rule) {
						that.refreshRules();
						that.rule = rule;
					}
				});
			});
			this
			.$("#nscompliance-listbox .nscompliance-list-policy.software-policy button.addrule")
			.button({
				icons: {
					primary: "ui-icon-plus"
				},
				text: false
			}).click(function() {
				var priority = 16;
				if (that.softwareRules.length > 0) {
					priority = that.softwareRules
					.at(that.softwareRules.length - 1).get('priority') + 16;
				}
				var view = new AddSoftwareRuleDialog({
					defaultPriority: priority,
					onAdded: function(rule) {
						that.refreshSoftwareRules();
					}
				});
			});

			this
			.$("#nscompliance-listbox .nscompliance-list-policy.hardware-policy button.addrule")
			.button({
				icons: {
					primary: "ui-icon-plus"
				},
				text: false
			}).click(function() {
				var view = new AddHardwareRuleDialog({
					onAdded: function(rule) {
						that.refreshHardwareRules();
					}
				});
			});

			if (this.rules.policy != null) {
				var id = this.rules.policy.get('id');
				this.$('#nscompliance-listbox>ul li[data-policy-id="' + id + '"]')
				.click();
			}
			else {
				// this.$('#nscompliance-listbox>ul li').first().click();
			}

		},

		refreshSoftwareRules: function() {
			var that = this;
			this.$("#nscompliance-software #ruletable>tbody").empty();
			this.softwareRules.reset();
			this.softwareRules.fetch().done(function() {
				that.renderSoftwareRuleTable();
			});
		},

		renderSoftwareRuleTable: function() {
			var that = this;
			this.softwareRules.each(this.renderSoftwareRuleRow, this);
			if (!user.isReadWrite()) {
				this.$("#nscompliance-software .edit").remove();
				this.$("#nscompliance-software .delete").remove();
			}
			this.$("#nscompliance-software #ruletable button.edit").button({
				icons: {
					primary: "ui-icon-wrench"
				},
				text: false
			}).click(function() {
				var id = $(this).closest("tr").data("rule-id");
				var rule = that.softwareRules.get(id);
				var editDialog = new EditSoftwareRuleDialog({
					model: rule,
					onEdited: function() {
						that.refreshSoftwareRules();
					}
				});
			});
			this.$("#nscompliance-software #ruletable button.delete").button({
				icons: {
					primary: "ui-icon-trash"
				},
				text: false
			}).click(function() {
				var id = $(this).closest("tr").data("rule-id");
				var rule = that.softwareRules.get(id);
				var deleteDialog = new DeleteSoftwareRuleDialog({
					model: rule,
					onDeleted: function() {
						that.refreshSoftwareRules();
					}
				});
			});
			if (user.isReadWrite()) {
				this
				.$("#nscompliance-software #ruletable>tbody")
				.sortable({
					axis: 'y',
					cursor: "move",
					update: function(event, ui) {
						var rule = that.softwareRules.get($(ui.item)
								.data('rule-id'));
						var prev = $(ui.item).prev().data('rule-id');
						var next = $(ui.item).next().data('rule-id');
						var priority = 1;
						if (prev == null) {
							priority = that.softwareRules.get(next).get('priority') / 2;
						}
						else if (next == null) {
							priority = that.softwareRules.get(prev).get('priority') + 16;
						}
						else {
							priority = (that.softwareRules.get(next).get('priority') + that.softwareRules
									.get(prev).get('priority')) / 2;
						}
						var view = new SortSoftwareRuleDialog({
							model: rule,
							priority: priority,
							onCancel: function() {
								that.refreshSoftwareRules();
							},
							onChanged: function() {
								that.refreshSoftwareRules();
							}
						});
					}
				});
			}

			this.$("#nscompliance-software #ruletable .rulerow")
			.mouseenter(function() {
				$(this).addClass("hover");
			}).mouseleave(function() {
				$(this).removeClass("hover");
			});
		},

		renderSoftwareRuleRow: function(rule, index) {
			var data = rule.toJSON();
			data.order = index;
			var view = this.softwareRuleTemplate(data);
			this.$("#nscompliance-software #ruletable>tbody").append(view);
		},

		refreshHardwareRules: function() {
			var that = this;
			this.$("#nscompliance-hardware #ruletable>tbody").empty();
			this.hardwareRules.reset();
			this.hardwareRules.fetch().done(function() {
				that.renderHardwareRuleTable();
			});
		},

		renderHardwareRuleTable: function() {
			var that = this;
			this.hardwareRules.each(this.renderHardwareRuleRow, this);
			if (!user.isReadWrite()) {
				this.$("#nscompliance-hardware .edit").remove();
				this.$("#nscompliance-hardware .delete").remove();
			}
			this.$("#nscompliance-hardware #ruletable button.edit").button({
				icons: {
					primary: "ui-icon-wrench"
				},
				text: false
			}).click(function() {
				var id = $(this).closest("tr").data("rule-id");
				var rule = that.hardwareRules.get(id);
				var editDialog = new EditHardwareRuleDialog({
					model: rule,
					onEdited: function() {
						that.refreshHardwareRules();
					}
				});
			});
			this.$("#nscompliance-hardware #ruletable button.delete").button({
				icons: {
					primary: "ui-icon-trash"
				},
				text: false
			}).click(function() {
				var id = $(this).closest("tr").data("rule-id");
				var rule = that.hardwareRules.get(id);
				var deleteDialog = new DeleteHardwareRuleDialog({
					model: rule,
					onDeleted: function() {
						that.refreshHardwareRules();
					}
				});
			});
		},

		renderHardwareRuleRow: function(rule) {
			var view = this.hardwareRuleTemplate(rule.toJSON());
			this.$("#nscompliance-hardware #ruletable>tbody").append(view);
		},

		refreshRules: function() {
			var that = this;
			this.$("#nscompliance-rulelistbox>ul").empty();
			this.rules.reset();
			if (this.rules.policy != null) {
				this.rules.fetch().done(function() {
					that.renderRuleList();
				});
			}
		},

		renderRuleList: function() {
			var that = this;
			this.rules.each(this.renderRuleListItem, this);

			this.$("#nscompliance-rulelistbox>ul li").mouseenter(function() {
				var $this = $(this);
				if (!$this.hasClass("active")) {
					$this.addClass("hover");
				}
			}).mouseleave(function() {
				$(this).removeClass("hover");
			}).click(function() {
				if ($(this).hasClass("active")) {
					return;
				}
				var id = $(this).closest('li').data("rule-id");
				that.rule = that.rules.get(id);
				that.renderRule();
				$(this).closest('ul').find('li').removeClass("active");
				$(this).addClass("active");
			});
			if (!user.isReadWrite()) {
				this.$("#nscompliance-rulelistbox .edit").remove();
				this.$("#nscompliance-rulelistbox .delete").remove();
			}
			this.$("#nscompliance-rulelistbox>ul button.edit").button({
				icons: {
					primary: "ui-icon-wrench"
				},
				text: false
			}).click(function() {
				var id = $(this).closest('li').data("rule-id");
				var editRuleDialog = new EditRuleDialog({
					model: that.rules.get(id),
					onEdited: function() {
						that.refreshRules();
					}
				});
			});
			this.$("#nscompliance-rulelistbox>ul button.delete").button({
				icons: {
					primary: "ui-icon-trash"
				},
				text: false
			}).click(function() {
				var id = $(this).closest('li').data("rule-id");
				var deleteRuleDialog = new DeleteRuleDialog({
					model: that.rules.get(id),
					onDeleted: function() {
						that.rule = null;
						that.refreshRules();
						that.renderRule();
					}
				});
			});

			if (this.rule != null) {
				var id = this.rule.get('id');
				this
				.$('#nscompliance-rulelistbox>ul li[data-rule-id="' + id + '"]')
				.click();
			}
			else {
				// this.$('#nscompliance-rulelistbox>ul li').first().click();
			}
		},

		renderRuleListItem: function(rule) {
			var view = this.ruleTemplate(rule.toJSON());
			this.$("#nscompliance-rulelistbox>ul").append(view);
		},

		renderRule: function() {
			var that = this;
			if (this.ruleView != null) {
				this.ruleView.destroy();
				this.ruleView = null;
			}
			if (this.rule != null) {
				if (this.rule.get('type').match(/(JavaScript|Python)Rule/)) {
					this.ruleView = new ScriptRuleView({
						model: this.rule,
						onEdited: function() {
							that.refreshRules();
						}
					});
				}
				else if (this.rule.get('type').match(/TextRule/)) {
					this.ruleView = new TextRuleView({
						model: this.rule,
						deviceTypes: this.deviceTypes,
						diagnostics: this.diagnostics,
						onEdited: function() {
							that.refreshRules();
						}
					});
				}
			}
		},

		destroy: function() {
			if (this.ruleView) {
				this.ruleView.destroy();
			}
		}

	});
});
