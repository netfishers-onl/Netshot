/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	return Backbone.Model.extend({

		urlRoot: function() {
			var u =  "api/softwarerules/" + this.get('ruleId') + "/sort";
			var nextRuleId = this.get('nextRuleId');
			if (typeof nextRuleId === "number") {
				u += "?next=" + nextRuleId;
			}
			return u;
		},

		save: function(attrs, options) {
			options = options || {};
			return Backbone.Model.prototype.save.call(this, {}, options);
		}

	});

});
