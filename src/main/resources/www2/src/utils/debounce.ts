export function debounce(func, wait, immediate = false) {
	let timeout, args, context, timestamp, result;
	if (null == wait) wait = 100;

	function later() {
		var last = Date.now() - timestamp;

		if (last < wait && last >= 0) {
			timeout = setTimeout(later, wait - last);
		} else {
			timeout = null;
			if (!immediate) {
				result = func.apply(context, args);
				context = args = null;
			}
		}
	}

	var debounced = function () {
		context = this;
		args = arguments;
		timestamp = Date.now();
		var callNow = immediate && !timeout;
		if (!timeout) timeout = setTimeout(later, wait);
		if (callNow) {
			result = func.apply(context, args);
			context = args = null;
		}

		return result;
	};

	debounced.prototype.clear = function () {
		if (timeout) {
			clearTimeout(timeout);
			timeout = null;
		}
	};

	debounced.prototype.flush = function () {
		if (timeout) {
			result = func.apply(context, args);
			context = args = null;

			clearTimeout(timeout);
			timeout = null;
		}
	};

	return debounced;
}
