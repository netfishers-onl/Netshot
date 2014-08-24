define([
	'underscore',
	'backbone',
	'models/device/DeviceConfigFieldModel'
], function(_, Backbone, DeviceConfigFieldModel) {

	var DeviceConfigFieldCollection = Backbone.Collection.extend({

		initialize: function(models, options) {
			this.deviceClass = options.deviceClass;
		},

		url: function() {
			return "rs/deviceconfigfields/" + this.deviceClass;
		},

		parse: function(response) {
			var fields = [];
			i = 0;
			for (var name in response) {
				fields[i] = {
					'id': i,
					'name': name,
					'types': response[name]
				};
				i++;
			}
			return fields;
		},

		comparator: function(config) {
			return config.get('name');
		},

		model: DeviceConfigFieldModel,

	});

	return DeviceConfigFieldCollection;

});
