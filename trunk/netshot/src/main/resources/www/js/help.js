/** Copyright 2013-2014 NetFishers */
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
		var $page = $("#page");
		var $titles = $page.find(Object.keys(levels).join(', ')); 
		$titles.each(function() {
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
						var indent = "";
						path.push(levels[level].n);
						if ($(this).prop('id') == "") {
							$(this).prop('id', "t" + path.join("-"));
						}
						var title = path.join(".") + ". " + $(this).html();
						var indent = "";
						for (var p in path.slice(1)) { indent += "&nbsp;&nbsp;"; }
						var option = $("<option />").html(indent + title);
						option.val($(this).prop('id'));
						$('#menu select').append(option);
						$(this).html(title);
					}
					else {
						path.push(levels[level].n);
					}
				}
			}
		});
		$('#menu select').on("change", function() {
			$page.data("updateMenu", "NO");
			var y = $('#' + $(this).val()).position().top;
			$page.animate({
				scrollTop: $page.scrollTop() + y
			}, 'slow', 'swing', function() {
				$page.data("updateMenu", "YES");
			});
		});
		$page.on("scroll", function() {
			if ($page.data("updateMenu") === "NO") {
				return;
			}
			var y = $('#page').scrollTop();
			$titles.each(function() {
				if ($(this).position().top >= -20) {
					$('#menu select').val($(this).prop('id'));
					return false;
				}
			});
		});
		$("img.figure")
			.wrap('<div class="figure"></div>')
			.wrap('<span></span>');
		$("div.figure span").on("mouseenter", function() {
			$(this).addClass("hover");
		}).on("mouseleave", function() {
			$(this).removeClass("hover");
		}).on("click", function() {
			var thumbnail = $(this).find("img").clone()
				.css("height", "auto");
			$("#viewer").empty().removeAttr('style').css({
				'top': ($(this).offset().top + 20) + "px",
				'left': ($(this).offset().left + 40) + "px"
			}).append(thumbnail.wrap("<div></div>")).show();
			var w = thumbnail.width();
			var h = thumbnail.height();
			$("#viewer").animate({
				'width': w + "px",
				'height': (h + 20) + "px",
				'left': (($(document).width() - w) / 2) + "px",
				'top': (($(document).height() - h) / 2) + "px"
			});
			var title = $('<span class="title"></span>');
			title.html($(this).data("title") + " &mdash; ");
			var legend = $('<span class="legend"></span>');
			legend.html(thumbnail.prop("alt"));
			title.append(legend)
			$("#viewer").append(title);
			
			return false;
		}).each(function(i) {
			$(this).data("title", "Figure " + (i + 1));
		});
		$("body").on("click", function() {
			$("#viewer").hide();
			return false;
		});
		
	};

	return {
		initialize: initialize
	};
});
