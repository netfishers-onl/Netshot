/** Copyright 2013-2024 Netshot */
define([
	'underscore',
	'backbone',
	], function(_, Backbone) {

	return Backbone.Model.extend({

		initialize: function(models, options) {
			this.device = options.device;
			this.originalConfigId = options.originalConfigId;
			this.revisedConfigId = options.revisedConfigId;
		},

		urlRoot: function() {
			return "api/configs/" + this.originalConfigId + "/vs/"
			+ this.revisedConfigId;
		},

		cleanContext: function() {
			for (var item in this.attributes.deltas) {
				var line = -1;
				for (var i = 0; i < this.attributes.deltas[item].length; i++) {
					if (line > -1) {
						this.attributes.deltas[item][i].preContext = this.attributes.deltas[item][i].preContext
						.slice(line
								- this.attributes.deltas[item][i].originalPosition);
					}
					line = this.attributes.deltas[item][i].originalPosition
					+ this.attributes.deltas[item][i].originalLines.length;
				}
				var line = -1;
				for (var i = this.attributes.deltas[item].length - 1; i >= 0; i--) {
					if (line > -1) {
						this.attributes.deltas[item][i].postContext = this.attributes.deltas[item][i].postContext
						.slice(0, line
								- this.attributes.deltas[item][i].originalPosition
								- this.attributes.deltas[item][i].originalLines.length
								- 1);
					}
					line = this.attributes.deltas[item][i].originalPosition;
				}
			}
		}

	});

});
