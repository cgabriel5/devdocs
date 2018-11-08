"use strict";

// App utils.
let autils = $app.module("@autils/utils.js");
let range = autils.range;
let make_unique = autils.make_unique;

/**
 * Expand the custom line highlight range. For example, {1,2-7,!5} will get
 *     turned into [1, 2, 3, 4, 6, 7]. {2,7} into [2, 7].
 *
 * @param  {htmlelement} $el - The element to grab line numbers from.
 * @return {array} - The array containing the lines to highlight.
 */
module.exports = function($el) {
	// Check for line highlight numbers/ranges.
	var hlines = $el.attr()["data-highlight-lines"];

	// Store line numbers here.
	var hlines_array = [];

	// If the attr exists then parse it.
	if (hlines) {
		// Turn into an array.
		var parts = hlines.split(",");

		// Store the excluded numbers.
		var excludes = [];

		// Loop over each component: ["1", "2-7", "!5"].
		parts.forEach(function(item) {
			item = item.trim();
			if (item.includes("-")) {
				var _parts = item.split("-");
				hlines_array = hlines_array.concat(
					range(_parts[0] * 1, _parts[1] * 1)
				);
			} else if (item.startsWith("!")) {
				excludes.push(item.replace(/\!/g, "") * 1);
			} else {
				hlines_array.push(item * 1);
			}
		});

		// Make the array unique and sort.
		hlines_array = make_unique(hlines_array).sort(function(a, b) {
			return a - b;
		});

		// Remove the excluded numbers.
		hlines_array = hlines_array.filter(function(num) {
			return !excludes.includes(num);
		});
	}

	// The lines to highlight.
	return hlines_array;
};
