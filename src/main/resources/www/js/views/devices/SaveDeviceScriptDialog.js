/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'views/devices/DeleteDeviceScriptDialog',
	'text!templates/devices/saveDeviceScript.html',
	'text!templates/devices/saveDeviceScriptListItem.html',
	'models/device/ScriptModel',
	'models/device/ScriptCollection',
], function($, _, Backbone, Dialog, DeleteDeviceScriptDialog, saveDeviceScriptTemplate,
		saveDeviceScriptListItemTemplate, ScriptModel, ScriptCollection) {

	return Dialog.extend({

		el: "#nsdialog-child",

		template: _.template(saveDeviceScriptTemplate),
		scriptListItemTemplate: _.template(saveDeviceScriptListItemTemplate),

		dialogOptions: {
			title: "Save device script",
			width: "400px"
		},

		initialize: function(options) {
			var that = this;
			this.scriptContent = options.script;
			this.driver = options.driver;
			this.onSaved = options.onSaved;
			this.scripts = new ScriptCollection([]);
			this.model = new ScriptModel();
			this.deviceTypes = options.deviceTypes;
			that.existing = false;
			that.render();
		},

		templateData: function() {
			var that = this;
			var deviceType = this.deviceTypes.findWhere({ name: this.driver });
			return {
				realDeviceType: (deviceType ? deviceType.get("description") : "Unknown"),
			};
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Save": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				that.model.save({
					'name': that.scriptName,
					'script': that.scriptContent,
					'deviceDriver': that.driver,
				}).done(function(data) {
					that.onSaved();
					that.close();
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
			},
		},

		setName: function(name) {
			this.$("#scriptname").val(name);
			this.scriptName = name;
		},

		addScriptItem: function(script) {
			this.htmlBuffer += this.scriptListItemTemplate(script.toJSON());
		},

		updateSaveStatus: function() {
			var that = this;
			var $saveButton = this.dialogButtons().eq(1);
			that.existing = false;
			that.$("#scripttree .script").each(function() {
				var scriptId = $(this).data("script-id");
				var script = that.scripts.get(scriptId);
				if (script.get("name") === that.scriptName) {
					$(this).addClass("active");
				}
				else {
					$(this).removeClass("active");
				}
			});
			if (!that.scriptName || that.existing) {
				$saveButton.button("disable");
			}
			else {
				$saveButton.button("enable");
			}
		},

		fetchScripts: function() {
			var that = this;
			this.scripts.fetch().done(function() {
				that.renderScriptList();
			});
		},

		renderScriptList: function() {
			var that = this;
			that.$('.placeholder').toggle(that.scripts.size() === 0);
			that.htmlBuffer = "";
			that.scripts.each(that.addScriptItem, that);
			that.$("#scripttree>ul").html(that.htmlBuffer);
			that.$("#scripttree .script .actions .delete").button({
				'icons': {
					'primary': "ui-icon-trash"
				},
				'text': false,
			}).click(function() {
				var scriptId = $(this).closest(".script").data("script-id");
				var scriptModel = that.scripts.get(scriptId);
				var deleteScriptDialog = new DeleteDeviceScriptDialog({
					model: scriptModel,
					onDeleted: function() {
						that.fetchScripts();
					}
				});
				return false;
			});

			that.$("#scripttree .script").mouseenter(function() {
				var $this = $(this);
				if (!$this.hasClass("active")) {
					$this.addClass("hover");
				}
			}).mouseleave(function() {
				$(this).removeClass("hover");
			}).click(function() {
				var scriptId = $(this).data("script-id");
				var selectedScript = that.scripts.get(scriptId);
				that.setName(selectedScript.get("name"));
				that.updateSaveStatus();
			});

			that.updateSaveStatus();
		},

		onCreate: function() {
			var that = this;
			var $saveButton = this.dialogButtons().eq(1);
			$saveButton.button('disable');
			this.fetchScripts();
			this.$("#scriptname").keyup(function() {
				that.scriptName = $.trim($(this).val());
				that.updateSaveStatus();
			});
			this.$("#scriptname").keydown(function(e) {
				if (e.which == 13) {
					e.preventDefault();
					$saveButton.click();
					return false;
				}
			});

		},

	});
});
