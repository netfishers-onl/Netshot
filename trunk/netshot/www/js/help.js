define([
	'jquery',
	'jquery-ui'
], function($) {

	var initialize = function() {
		var levels = {
			h2: {},
			h3: {},
		};
		for (var level in levels) {
			levels[level].n = 0;
		}
		$('#page').find(Object.keys(levels).join(', ')).each(function() {
			var found = false;
			var path = [];
			for (var level in levels) {
				if (found) {
					levels[level].n = 0;
				}
				else {
					if ($(this).is(level)) {
						found = true;
						levels[level].n++;
						path.push(levels[level].n);
						if ($(this).prop('id') == "") {
							$(this).prop('id', "t" + path.join("-"));
						}
						var item = $('<' + level + '>').html(levels[level].n + ". "
								+ $(this).html());
						var link = $('<a>').prop('href', '#' + $(this).prop('id'))
								.append(item);
						$('#menu #inner').append(link);
						$(this).html(path.join(".") + ". " + $(this).html());
					}
					else {
						path.push(levels[level].n);
					}
				}
			}
		});
		$('#menu a').mouseenter(function() {
			$(this).addClass('hover');
		}).mouseleave(function() {
			$(this).removeClass('hover');
		});
		$('#menu').mouseenter(function() {
			$('#menu, #page').addClass('withfloatingmenu');
		}).mouseleave(function() {
			$('#menu, #page').removeClass('withfloatingmenu');
		});
		$('#menu #show').button({
			icons: {
				primary: "ui-icon-arrowthickstop-1-w"
			},
			text: false
		}).click(function() {
			$('#menu #show').hide();
			$('#menu #hide').show();
			$('#menu, #page').addClass('withmenu');
			return false;
		});
		$('#menu #hide').button({
			icons: {
				primary: "ui-icon-arrowthickstop-1-e"
			},
			text: false
		}).click(function() {
			$('#menu #hide').hide();
			$('#menu #show').show();
			$('#menu, #page').removeClass('withmenu');
			return false;
		});

	};

	return {
		initialize: initialize
	};
});
