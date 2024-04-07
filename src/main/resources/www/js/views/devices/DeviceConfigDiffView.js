/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'models/device/DeviceConfigDiffModel',
	'text!templates/devices/deviceConfigDiffWindow.html'
	], function($, _, Backbone, DeviceConfigDiffModel, deviceConfigDiffWindowTemplate) {

	return Backbone.View.extend({

		template: _.template(deviceConfigDiffWindowTemplate),

		initialize: function(options) {
			this.render();
		},

		render: function() {
			var that = this;
			this.showNumbers = true;
			this.configDifferences = new DeviceConfigDiffModel({}, {
				'deviceName': this.options.deviceName,
				'originalConfigId': this.options.configId1,
				'revisedConfigId': this.options.configId2
			});
			if (typeof(this.myWindow) == "undefined") {
				this.myWindow = window.open('', "config" + this.options.configId1 + "vs" + this.options.configId2,
				'width=800, height=600, menubar=0, location=0, status=0, scrollbars=1, resizable=1'); 
			}
			var d = this.myWindow.document.open("text/html", "replace");
			d.title = this.options.deviceName + ' [Diff]';
			this.configDifferences.fetch().done(function() {
				that.configDifferences.cleanContext();
				d.writeln(that.template(that.configDifferences.toJSON()));
				if (typeof that.options.deviceConfigs === "object" && that.options.deviceConfigs) {
					var deviceConfigs = that.options.deviceConfigs;
					var i1 = deviceConfigs.indexOf(deviceConfigs.get(that.options.configId1));
					var i2 = deviceConfigs.indexOf(deviceConfigs.get(that.options.configId2));
					var previousConfig = deviceConfigs.at(i1 + 1);
					var nextConfig = deviceConfigs.at(i2 - 1);
					$(d).find("#previous").button({
						icons: { primary: "ui-icon-seek-prev" }
					});
					if (typeof previousConfig === "object" && previousConfig) {
						$(d).find("#previous").click(function() {
							that.options.configId2 = that.options.configId1;
							that.options.configId1 = previousConfig.get("id");
							that.render();
							return false;
						});
					}
					else {
						$(d).find("#previous").button("disable");
					}
					$(d).find("#next").button({
						icons: { secondary: "ui-icon-seek-next" }
					});
					if (typeof nextConfig === "object" && nextConfig) {
						$(d).find("#next").click(function() {
							that.options.configId1 = that.options.configId2;
							that.options.configId2 = nextConfig.get("id");
							that.render();
							return false;
						});
					}
					else {
						$(d).find("#next").button("disable");
					}
				}
				else {
					$(d).find("button").remove();
				}
				$(d).find("table").unbind("dblclick").dblclick(function() {
					that.showNumbers = !that.showNumbers;
					$(d).find('.linenum').css("visibility", that.showNumbers ? "visible" : "hidden");
				});
				/* Stupid hack to allow user selecting text by column */
				$(d).find("table .right").unbind("mousedown").mousedown(function() {
					$(d).find("table .right").css("user-select", "text");
					$(d).find("table .left").css("user-select", "none");
				});
				$(d).find("table .left").unbind("mousedown").mousedown(function() {
					$(d).find("table .left").css("user-select", "text");
					$(d).find("table .right").css("user-select", "none");
				});
			});
			return this;
		},

	});
});
