/** Copyright 2013-2014 NetFishers */
define([
	'underscore',
	'backbone',
	'models/compliance/SoftwareRuleModel'
], function(_, Backbone, SoftwareRuleModel) {

	return Backbone.Collection.extend({

		url: "api/softwarerules",

		model: SoftwareRuleModel,

		comparator: function(rule1, rule2) {
			if (rule1.get('priority') < rule2.get('priority')) {
				return -1;
			}
			else if (rule1.get('priority') > rule2.get('priority')) {
				return 1;
			}
			else {
				if (rule1.get('id') < rule2.get('id')) {
					return -1;
				}
				else if (rule1.get('id') > rule2.get('id')) {
					return 1;
				}
				else {
					return 0;
				}
			}
		}

	});

});
