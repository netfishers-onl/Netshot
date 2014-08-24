define([
	'jquery',
	'underscore',
	'backbone',
	'models/device/DeviceConfigCollection',
	'text!templates/devices/deviceConfigs.html',
	'text!templates/devices/deviceConfig.html',
	'text!templates/devices/deviceConfigWindow.html',
	'views/devices/DeviceConfigDiffView',
], function($, _, Backbone, DeviceConfigCollection, deviceConfigsTemplate,
		deviceConfigTemplate, deviceConfigWindowTemplate, DeviceConfigDiffView) {

	var DeviceConfigsView = Backbone.View
			.extend({

				el: "#nsdevices-devicedetails",

				template: _.template(deviceConfigsTemplate),
				configTemplate: _.template(deviceConfigTemplate),

				initialize: function(options) {
					this.device = options.device;
					this.deviceConfigs = new DeviceConfigCollection({}, {
						'device': this.device
					});
					var that = this;
					this.deviceConfigs.fetch().done(function() {
						that.render();
					});
				},

				renderConfigLine: function(deviceConfig) {
					this.htmlBuffer += this.configTemplate(deviceConfig.toJSON());
				},

				render: function() {
					var that = this;
					this.$el.html(this.template());
					this.htmlBuffer = "";
					this.deviceConfigs.each(this.renderConfigLine, this);
					var $table = this.$("#configs tbody").html(this.htmlBuffer);

					this.$('a[data-config-action="download"]').each(function() {
						var id = $(this).closest('tr.configdetails')
								.prevAll('tr.configline').first().data('config-id');
						var deviceConfig = that.deviceConfigs.get(id);
						$(this).prop("href", deviceConfig.getItemUrl($(this)
								.data('config-item')));
					});
					this
							.$('a[data-config-action="view"]')
							.click(function() {
								var $this = $(this);
								var id = $(this).closest('tr.configdetails')
										.prevAll('tr.configline').first().data('config-id');
								var deviceConfig = that.deviceConfigs.get(id);
								var w = window
										.open('', "config" + deviceConfig.get('id'), 'width=800, height=600, menubar=0, location=0, status=0, scrollbars=1, resizable=1');
								var d = w.document.open("text/html", "replace");
								d.writeln(deviceConfigWindowTemplate);
								d.title = that.device.get('name')
										+ ' ['
										+ $this.data('config-item')
										+ ', '
										+ $.formatDateTime('dd/mm/y hh:ii', new Date(deviceConfig
												.get('changeDate'))) + ']';
								$.get(deviceConfig.getItemUrl($this.data('config-item')))
										.done(function(data) {
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
												htmlBuffer += line.replace(/ /g, '\u00a0');
												htmlBuffer += '</td></tr>';
											});
											$table.html(htmlBuffer);
											$table.dblclick(function() {
												$table.find('.linenum').toggle();
											});
										});
								return false;
							});

					this.$(".configlink").click(function() {
						var $row = $(this).closest('tr');
						$row.toggleClass('expanded');
						$row.find('.expandicon').toggleClass('iu-icon-triangle-1-e')
								.toggleClass('ui-icon-triangle-1-s');
						if ($row.hasClass('expanded')) {
							$row.nextUntil('.configline').show();
						}
						else {
							$row.nextUntil('.configline').hide();
						}
						return false;
					}).first().trigger('click');
					this.$(".configpreviousdiff").button({
						icons: {
							primary: "ui-icon-arrow-2-ne-sw"
						},
						text: false
					}).click(function() {
						var $tr = $(this).closest('tr.configline');
						var id2 = $tr.data('config-id');
						var id1 = $tr.nextAll('tr.configline').first().data('config-id');
						var diffView = new DeviceConfigDiffView({
							deviceName: that.device.get('name'),
							configId1: id1,
							configId2: id2
						});
					}).last().hide();
					this.$(".configlink").draggable({
						scroll: false,
						helper: "clone"
					});
					this.$("#nsconfig-differ .config").droppable({
						accept: ".configlink",
						hoverClass: "hover",
						activeClass: "active",
						drop: function(event, ui) {
							$(this).text(ui.draggable.text());
							$(this).data('config', ui.draggable.data('config-id'));
							$(this).addClass("set");
							var id1 = $("#configdiff1").data('config');
							var id2 = $("#configdiff2").data('config');
							$("#diffit").closest("div").toggle(typeof id1 !== "undefined"
									&& typeof id2 !== "undefined" && id1 != id2);
						}
					});
					this.$("#nsconfig-differ #diffit").button({
						icons: {
							primary: "ui-icon-transfer-e-w"
						}
					}).click(function() {
						var id1 = $("#configdiff1").data('config');
						var id2 = $("#configdiff2").data('config');
						var diffView = new DeviceConfigDiffView({
							deviceName: that.device.get('name'),
							configId1: id1,
							configId2: id2
						});
					});

					return this;
				},

				destroy: function() {

					this.$el.empty();
				}

			});
	return DeviceConfigsView;
});
