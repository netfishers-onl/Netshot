/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'views/Dialog',
	'views/devices/DeleteDeviceScriptDialog',
	'text!templates/devices/loadDeviceScript.html',
	'text!templates/devices/loadDeviceScriptListItem.html',
	'models/device/ScriptModel',
	'models/device/ScriptCollection',
], function($, _, Backbone, Dialog, DeleteDeviceScriptDialog, loadDeviceScriptTemplate,
		loadDeviceScriptListItemTemplate, ScriptModel, ScriptCollection) {

	return Dialog.extend({

		el: "#nsdialog-child",

		template: _.template(loadDeviceScriptTemplate),
		scriptListItemTemplate: _.template(loadDeviceScriptListItemTemplate),

		dialogOptions: {
			title: "Load device script",
			width: "400px"
		},

		initialize: function(options) {
			var that = this;
			this.onLoad = options.onLoad;
			this.scripts = new ScriptCollection([]);
			this.selectedScriptId = null;
			that.render();
		},

		buttons: {
			"Cancel": function() {
				this.close();
			},
			"Load": function(event) {
				var that = this;
				var $button = $(event.target).closest("button");
				$button.button('disable');
				var script = that.scripts.get(that.selectedScriptId);
				script.fetch().done(function() {
					that.onLoad(script);
				}).fail(function(data) {
					var error = $.parseJSON(data.responseText || '{ "errorMsg": "Unknown" }');
					that.$("#errormsg").text("Error: " + error.errorMsg);
					that.$("#error").show();
					$button.button('enable');
				});
				that.close();
			},
		},

		setName: function(name) {
			this.$("#scriptname").val(name);
			this.scriptName = name;
		},

		addScriptItem: function(script) {
			this.htmlBuffer += this.scriptListItemTemplate(script.toJSON());
		},

		updateLoadStatus: function() {
			var that = this;
			var $loadButton = this.dialogButtons().eq(1);
			that.$("#scripttree .script").each(function() {
				var scriptId = $(this).data("script-id");
				if (scriptId === that.selectedScriptId) {
					$(this).addClass("active");
				}
				else {
					$(this).removeClass("active");
				}
			});
			if (that.selectedScriptId === null) {
				$loadButton.button("disable");
			}
			else {
				$loadButton.button("enable");
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
						that.selectedScriptId = null;
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
				that.selectedScriptId = $(this).data("script-id");
				that.updateLoadStatus();
			}).dblclick(function() {
				that.selectedScriptId = $(this).data("script-id");
				that.updateLoadStatus();
				that.dialogButtons().eq(1).click();
			});

			that.updateLoadStatus();
		},

		onCreate: function() {
			var that = this;
			var $loadButton = this.dialogButtons().eq(1);
			$loadButton.button('disable');
			this.fetchScripts();
		},

	});
});
