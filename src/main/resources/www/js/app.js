/** Copyright 2013-2024 Netshot */
define([
	'jquery',
	'underscore',
	'backbone',
	'router',
	'jquery-ui'
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
	
	$.escapeSelector = function(sel) {
		/* https://github.com/jquery/jquery/blob/d0ce00cdfa680f1f0c38460bc51ea14079ae8b07/src/selector/escapeSelector.js */
		return (sel + "").replace(/([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g, function(ch) {
			return "\\" + ch;
		});
	};

	$.escapeSingleQuotes = function(attr) {
		return (attr + "").replace(/'/g, "\\'");
	}

	return {
		initialize: initialize
	};
});
