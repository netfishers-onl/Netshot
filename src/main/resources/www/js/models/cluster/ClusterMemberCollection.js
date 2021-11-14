/** Copyright 2013-2021 NetFishers */
define([
	'underscore',
	'backbone',
	'models/cluster/ClusterMemberModel'
], function(_, Backbone, ClusterMemberModel) {

	return Backbone.Collection.extend({

		url: "api/cluster/members",

		model: ClusterMemberModel,

	});

});
