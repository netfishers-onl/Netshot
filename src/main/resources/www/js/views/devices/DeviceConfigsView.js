/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'models/device/DeviceConfigCollection',
	'text!templates/devices/deviceConfigs.html',
	'text!templates/devices/deviceConfig.html',
	'views/devices/DeviceConfigDiffView',
	'views/devices/DeviceConfigView'
], function($, _, Backbone, DeviceConfigCollection, deviceConfigsTemplate,
		deviceConfigTemplate, DeviceConfigDiffView, DeviceConfigView) {

	return Backbone.View.extend({

		el: "#nsdevices-devicedetails",

		template: _.template(deviceConfigsTemplate),
		configTemplate: _.template(deviceConfigTemplate),

		initialize: function(options) {
			this.device = options.device;
			this.deviceTypes = options.deviceTypes;
			this.deviceType = this.deviceTypes.findWhere({
				name: this.device.get("driver")
			});
			this.deviceConfigs = new DeviceConfigCollection({}, {
				'device': this.device
			});
			var that = this;
			this.deviceConfigs.fetch().done(function() {
				that.render();
			});
		},

		renderConfigLine: function(deviceConfig) {
			var data = deviceConfig.toJSON();
			var fullAttributes = [];
			if (typeof this.deviceType === "object" && this.deviceType && data.attributes instanceof Array) {
				var definitions = _.where(this.deviceType.get("attributes"), { level: "CONFIG" });
				var attributes = _.indexBy(data.attributes, "name");
				for (var d in definitions) {
					var name = definitions[d].name;
					var attribute = attributes[name];
					if (typeof attribute !== "object" || !attribute) { attribute = {}; }
					var fullAttribute = _.defaults(attribute, definitions[d]);
					fullAttribute.downloadLink = deviceConfig.getItemUrl(name);
					fullAttributes.push(fullAttribute);
				}
			}
			data.attributes = fullAttributes;
			this.htmlBuffer += this.configTemplate(data);
		},

		render: function() {
			var that = this;
			this.$el.html(this.template());
			this.htmlBuffer = "";
			this.deviceConfigs.each(this.renderConfigLine, this);
			var $table = this.$("#configs tbody").html(this.htmlBuffer);

			this.$('a[data-config-action="view"]').click(function() {
				var $this = $(this);
				var id = $(this).closest('tr.configdetails').prevAll('tr.configline').first().data('config-id');
				var deviceConfig = that.deviceConfigs.get(id);
				var configView = new DeviceConfigView({
					deviceConfig: deviceConfig,
					device: that.device,
					configItem: $this.data('config-item'),
					configTitle: $this.data('config-title')
				});
				return false;
			});

			this.$(".configlink").click(function() {
				var $row = $(this).closest('tr');
				$row.toggleClass('expanded');
				$row.find('.expandicon').toggleClass('iu-icon-triangle-1-e').toggleClass('ui-icon-triangle-1-s');
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
					configId2: id2,
					deviceConfigs: that.deviceConfigs
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
					$("#diffit").closest("div").toggle(typeof id1 !== "undefined" && typeof id2 !== "undefined" && id1 != id2);
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
			this.$el.children().detach().remove();
		}

	});
});
