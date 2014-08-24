define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var HardwareRuleModel = Backbone.Model.extend({

		urlRoot: "rs/hardwarerules",

		defaults: {
			family: "",
			partNumber: "",
			group: -1,
			deviceClass: "org.netshot.device.Device",
			endOfLife: null,
			endOfSale: null
		},

		save: function(attrs, options) {
			attrs = attrs || this.toJSON();
			options = options || {};
			attrs = _.pick(attrs, [
				'id',
				'family',
				'familyRegExp',
				'group',
				'partNumber',
				'partNumberRegExp',
				'endOfLife',
				'deviceClass',
				'endOfSale'
			]);
			options.attrs = attrs;
			return Backbone.Model.prototype.save.call(this, attrs, options);
		}

	});

	return HardwareRuleModel;

});
