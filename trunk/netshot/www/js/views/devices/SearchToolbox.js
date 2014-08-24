define([
	'jquery',
	'underscore',
	'backbone',
	'models/device/DeviceTypeCollection',
	'models/device/DeviceConfigFieldCollection',
	'text!templates/devices/searchToolbox.html'
], function($, _, Backbone, DeviceTypeCollection, DeviceConfigFieldCollection,
		searchToolboxTemplate) {

	var SearchToolbox = Backbone.View.extend({

		el: "#nsdevices-searchtoolbox",

		template: _.template(searchToolboxTemplate),

		deviceTypes: new DeviceTypeCollection([]),
		deviceConfigFields: {},

		initialize: function(options) {
			var that = this;
			this.deviceTypes.fetch().done(function() {
				that.render();
			});
		},

		render: function() {
			var that = this;
			this.$el.html(this.template);
			$('<option />').attr('value', "org.netshot.device.Device").text("[Any]")
					.appendTo(this.$('#devicetype'));
			_.each(this.deviceTypes.models, function(deviceType) {
				$('<option />').attr('value', deviceType.get('name')).text(deviceType
						.get('description')).appendTo(that.$('#devicetype'));
			});
			this.$('#devicetype').change(function() {
				that.deviceConfigFields = new DeviceConfigFieldCollection([], {
					deviceClass: $(this).val()
				});
				that.deviceConfigFields.fetch().done(function() {
					that.$('#fieldname').empty();
					_.each(that.deviceConfigFields.models, function(configField) {
						$('<option />').attr('value', configField.get('id'))
								.text(configField.get('name')).appendTo(that.$('#fieldname'));
					});
					that.$('#fieldname').change();
				});
			}).change();
			this.$('#builder-clear').click(function() {
				that.$('#expression').val("");
				return false;
			});
			this.$('#builder-not').click(function() {
				that.$('#expression').val(that.$('#expression').val() + ' NOT ()');
				return false;
			});
			this.$('#builder-and').click(function() {
				that.$('#expression').val(that.$('#expression').val() + '() AND ()');
				return false;
			});
			this.$('#builder-or').click(function() {
				that.$('#expression').val(that.$('#expression').val() + '() OR ()');
				return false;
			});
			this.$('#fieldname').change(function() {
				that.$('#fieldbuttons button').button('destroy');
				that.$('#fieldbuttons').empty();
				var configField = that.deviceConfigFields.get($(this).val());
				var name = configField.get('name');
				var types = configField.get('types');

				var actions = {
					'TEXT': {
						'IS': '[' + name + '] IS "text"',
						'CONTAINS': ' [' + name + '] CONTAINS "text"',
						'STARTSWITH': ' [' + name + '] STARTSWITH "text"',
						'ENDSWITH': ' [' + name + '] ENDSWITH "text"',
					},
					'NUMERIC': {
						'IS': '[' + name + '] IS 16',
						'LESSTHAN': '[' + name + '] LESSTHAN 16',
						'GREATERTHAN': '[' + name + '] GREATERTHAN 16'
					},
					'ENUM': {
						'IS': '[' + name + '] IS "VALUE"'
					},
					'DATE': {
						'IS': '[' + name + '] IS "2012-01-16"',
						'BEFORE': '[' + name + '] BEFORE "2012-01-16"',
						'AFTER': '[' + name + '] AFTER "2012-01-16"',
					},
					'BOOLEAN': {
						'TRUE': '[' + name + ']',
						'FALSE': 'NOT ([' + name + '])',
					},
					'IPADDRESS': {
						'IS': '[' + name + '] IS 16.16.16.16',
						'IN': '[' + name + '] IN 16.16.0.0/16'
					},
					'MACADDRESS': {
						'IS': '[' + name + '] IS 1616.1616.1616',
						'IN': '[' + name + '] IN 1616.1616.1616/32'
					}
				};

				for ( var type in types) {
					_.each(actions[types[type]], function(action, caption) {
						$('<button />').text(caption).button().click(function() {
							that.$('#expression').val(that.$('#expression').val() + action);
							return false;
						}).appendTo(that.$('#fieldbuttons'));
					});
				}
			});
			this.$('button').button().addClass('ui-button');

			if (typeof (this.options.onRendered) === "function") {
				this.options.onRendered();
			}

			return this;
		},

	});
	return SearchToolbox;
});
