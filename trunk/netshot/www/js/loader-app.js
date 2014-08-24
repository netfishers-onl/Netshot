require.config({
	paths: {
		jquery: 'libs/jquery/jquery-min',
		'jquery-ui': 'libs/jquery-ui/jquery-ui',
		'formatDateTime': 'libs/jquery/jquery.formatDateTime.min',
		underscore: 'libs/underscore/underscore-min',
		backbone: 'libs/backbone/backbone-min',
		ace: 'libs/ace',
		Chart: 'libs/Chart.js/Chart.min',
		templates: '../templates'
	},
	shim: {
		'jquery-ui': {
			deps: [
				'jquery'
			]
		},
		'formatDateTime': {
			deps: [
				'jquery'
			]
		},
		underscore: {
			exports: '_'
		},
		backbone: {
			deps: [
				'underscore',
				'jquery'
			],
			exports: 'Backbone'
		},
		Chart: {
			exports: 'Chart'
		}
	}
});

function makeLoadProgress(i) {
	var progress = parseInt($("#progress").data('progress')) + i;
	if (progress > 100) progress = 100;
	$("#progress").data('progress', progress);
	$("#progress #bar").css('width', progress + '%');
}

require([
	'app',
], function(App) {
	App.initialize();
});
