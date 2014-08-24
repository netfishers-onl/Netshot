require.config({
	paths: {
		jquery: 'libs/jquery/jquery-min',
		'jquery-ui': 'libs/jquery-ui/jquery-ui',
	},
	shim: {
		'jquery-ui': {
			deps: [
				'jquery'
			]
		}
	}
});

require([
	'help',
], function(Help) {
	Help.initialize();
});
