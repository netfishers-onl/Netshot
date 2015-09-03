/** Copyright 2013-2014 NetFishers */
define([
	'jquery',
	'underscore',
	'backbone',
	'router',
	'jquery-ui',
	'formatDateTime'
], function($, _, Backbone, Router) {

	$(document).ajaxStart(function() {
		$(".nsloader").show();
	});
	$(document).ajaxStop(function() {
		$(".nsloader").hide();
	});

	var initialize = function() {
		Router.initialize();
	};

	return {
		initialize: initialize
	};
});
