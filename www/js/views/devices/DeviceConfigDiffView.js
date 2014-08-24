define([
	'jquery',
	'underscore',
	'backbone',
	'models/device/DeviceConfigDiffModel',
	'text!templates/devices/deviceConfigDiffWindow.html'
], function($, _, Backbone, DeviceConfigDiffModel,
		deviceConfigDiffWindowTemplate) {

	var DeviceConfigDiffView = Backbone.View
			.extend({

				template: _.template(deviceConfigDiffWindowTemplate),

				initialize: function(options) {
					this.configDifferences = new DeviceConfigDiffModel({}, {
						'deviceName': options.deviceName,
						'originalConfigId': options.configId1,
						'revisedConfigId': options.configId2
					});
					this.render();
				},

				render: function() {
					var that = this;
					var w = window
							.open('', "config" + this.options.configId1 + "vs"
									+ this.options.configId2, 'width=800, height=600, menubar=0, location=0, status=0, scrollbars=1, resizable=1');
					var d = w.document.open("text/html", "replace");
					d.title = this.options.deviceName + ' [Diff]';
					this.configDifferences.fetch().done(function() {
						that.configDifferences.cleanContext();
						d.writeln(that.template(that.configDifferences.toJSON()));
						var $table = $(d).find('table');
						$table.dblclick(function() {
							$table.find('.linenum').toggle();
						});
					});
					return this;
				},

			});
	return DeviceConfigDiffView;
});
