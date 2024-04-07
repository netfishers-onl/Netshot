/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/devices/deviceConfigWindow.html',
	], function($, _, Backbone, deviceConfigWindowTemplate) {

	return Backbone.View.extend({

		initialize: function(options) {
			this.deviceConfig = options.deviceConfig;
			this.device = options.device;
			this.configTitle = options.configTitle;
			this.configItem = options.configItem;
			this.render();
		},

		render: function() {
			var that = this;
			if (typeof this.myWindow == "undefined") {
				this.myWindow = window.open('', "config" + this.deviceConfig.get('id'),
				'width=800, height=600, menubar=0, location=0, status=0, scrollbars=1, resizable=1');
			}
			var d = this.myWindow.document.open("text/html", "replace");
			d.writeln(deviceConfigWindowTemplate);
			d.title = this.device.get('name') + ' [' + this.configTitle + ', ' +
				window.formatDateTime(this.deviceConfig.get('changeDate')) + ']';
			$.get(this.deviceConfig.getItemUrl(this.configItem)).done(function(data) {
				var $table = $(d).find('table');
				var lines = data.replace('\r', '').split('\n');
				var htmlBuffer = "";
				_.each(lines, function(line, i) {
					var lineNum = i + 1;
					htmlBuffer += '<tr';
					if (i % 2 == 0) {
						htmlBuffer += ' class="even"';
					}
					htmlBuffer += '><td class="linenum">';
					htmlBuffer += lineNum;
					htmlBuffer += '</td><td>';
					htmlBuffer += _.escape(line.replace(/ /g, '\u00a0'));
					htmlBuffer += '</td></tr>';
				});
				$table.html(htmlBuffer);
				$table.dblclick(function() {
					$table.find('.linenum').toggle();
				});
			});
			return this;
		},

	});
});
