define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var SoftwareRuleModel = Backbone.Model.extend({

		urlRoot: "rs/softwarerules",

		defaults: {
			family: "",
			version: "",
			group: -1,
			deviceClass: "org.netshot.device.Device",
			level: "GOLD"
		},

		save: function(attrs, options) {
			attrs = attrs || this.toJSON();
			options = options || {};
			attrs = _.pick(attrs, [
				'id',
				'family',
				'familyRegExp',
				'group',
				'version',
				'versionRegExp',
				'priority',
				'deviceClass',
				'level'
			]);
			options.attrs = attrs;
			return Backbone.Model.prototype.save.call(this, attrs, options);
		}

	});

	return SoftwareRuleModel;

});
