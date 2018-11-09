"use strict";

var path = require("path");

/**
 * Insert text at indices.
 *
 * @param  {string} string - The string.
 * @param  {object} inserts - Object containing inserts
 *     in the form of {index:string}.
 * @return {string} - The string with inserts.
 *
 * @resource [https://stackoverflow.com/a/25329247]
 * @resource [https://stackoverflow.com/a/21420210]
 * @resource [https://stackoverflow.com/a/3410557]
 * @resource [https://stackoverflow.com/a/274094]
 */
var string_index_insert = function(string, inserts) {
	return string.replace(/./g, function(character, index) {
		return inserts[index] ? inserts[index] + character : character;
	});
};

/**
 * Slugify description.
 *
 * @param  {string} text - The text to slugify.
 * @return {string} - The slugified string.
 *
 * @resource [https://gist.github.com/mathewbyrne/1280286]
 */
var slugify = function(text) {
	return text
		.toString()
		.toLowerCase()
		.replace(/\s+/g, "-") // Replace spaces with "-".
		.replace(/[^\w\-]+/g, "") // Remove all non-word chars.
		.replace(/\-\-+/g, "-") // Replace multiple "-" with single "-".
		.replace(/^-+/, "") // Trim "-" from start of text.
		.replace(/-+$/, ""); // Trim "-" from end of text.
};

/**
 * Collapses multiple hashes down to one, removes starting/ending hashes,
 *     and optionally replaces underscores with hashes.
 *
 * @param  {string} text - The text to modify.
 * @param  {boolean} replace_underscores - If provided, converts underscores
 *     to hashes.
 * @return {string} - The "dehashed" string.
 */
var dehashify = function(text, replace_underscores) {
	text = text.toString();

	// Replace underscores to hashes.
	if (replace_underscores) {
		text = text.replace(/_/g, "-");
	}

	// Collapse multiple hashes down to one, remove starting/ending hashes,
	// and return the string.
	return text.replace(/[-]+/g, "-").replace(/^-|-$/g, "");
};

/**
 * Create an array based off a number range. For example,
 * given the range 1-3 an array [1, 2, 3] will be returned.
 *
 * @param  {number} start - The range start.
 * @param  {number} stop - The range stop.
 * @param  {number} step - The range step.
 * @return {array} - The range array.
 *
 * @resource [https://stackoverflow.com/a/44957114]
 */
var range = function(start, stop, step) {
	start = start || 1;
	stop = (stop || -1) + 1;
	step = step || 1;

	return Array(Math.floor(Math.abs((stop - start) / step)))
		.fill(start)
		.map((x, y) => x + y * step);
};

/**
 * Make the provided array unique.
 *
 * @param  {array} array - The array to clean.
 * @param  {boolean} flag_sort - Flag indicating whether the array needs to be sorted.
 * @return {array} - The worked on array.
 *
 * @resource [http://stackoverflow.com/questions/1960473/unique-values-in-an-array/39272981#39272981]
 * @ersource [http://stackoverflow.com/questions/1063007/how-to-sort-an-array-of-integers-correctly/21595293#21595293]
 */
var make_unique = function(array, flag_sort) {
	// Make array unique.
	array = array.filter(function(x, i, a_) {
		return a_.indexOf(x) === i;
	});

	// Sort the array if flag set.
	// **Note: does not sort numbers.
	if (flag_sort) {
		if (flag_sort === "alpha") {
			array = array.sort(function(a, b) {
				return a.localeCompare(b);
			});
		} else if (flag_sort === "number") {
			array.sort(function(a, b) {
				return a - b;
			});
		}
	}

	// Return the array.
	return array;
};

/**
 * Remove line breaks and tab characters from a string.
 *
 * @param  {string} string - The string to use.
 * @return {string} - The cleaned string.
 */
var remove_space = function(string) {
	return string.replace(/(\r\n|\n|\r|\t)/g, "");
};

/**
 * Add commas to a number every thousand.
 *
 * @param {number} num - The number to adds commas to.
 * @return {string} - The string with added commas.
 *
 * @resource [https://stackoverflow.com/a/2901298]
 */
var add_commas_to_num = function(num) {
	var parts = num.toString().split(".");
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return parts.join(".");
};

/**
 * Create the absolute path while taking into account the app/module directory.
 *
 * @param  {string} __path - The path to resolve.
 * @return {string} - The resolved path.
 */
var apath = function(__path) {
	return path.resolve(__APPROOT, __path);
};

/**
 * Create the absolute path while taking into account the user's directory.
 *
 * @param  {string} __path - The path to resolve.
 * @return {string} - The resolved path.
 */
// var upath = function(__path) {
// 	return path.resolve(process.cwd(), __path);
// };

/**
 * Generates a simple ID containing letters and numbers.
 *
 * @param  {number} length - The length the ID should be.
 * @return {string} - The newly generated ID.
 *
 * @resource [http://stackoverflow.com/a/38622545]
 */
var id = function(length) {
	// Default to 10.
	length = length || 10;

	// Calculate the numbers of loops needed.
	var iterations = Math.floor(length / 10);
	if (length % 10) {
		// Increment the loop by 1.
		iterations++;
	}

	// Store the generated strings here.
	var strings = [];

	// Generate the strings.
	for (let i = 0, l = iterations; i < l; i++) {
		strings.push(
			Math.random()
				.toString(36)
				.substr(2, 10)
		);
	}

	// Combine the strings.
	var string = strings.join("");

	// Finally, cut the string to desired length.
	return string.substring(0, length);
};

/**
 * Return index of RegExp match in a string.
 *
 * @param  {string} string - The string.
 * @param  {regexp} regexp - The RegExp to use.
 * @param  {number} startindex - The optional index to start string from.
 * @return {number} - The index of RegExp match.
 *
 * @resource [https://stackoverflow.com/a/21420210]
 */
var regexp_index = function(string, regexp, startindex) {
	// Default start index to zero.
	startindex = startindex || 0;

	// If a start index is provided, clip the string to start
	// the string at the start index.
	string = startindex ? string.substring(startindex) : string;

	// Get the match information.
	var match = string.match(regexp);

	// If a match exists then get the index of match.
	return match ? string.indexOf(match[0]) + startindex : -1;
};

/**
 * Create a human readable time format from a timestamp.
 *
 * @param  {number} timestamp - The timestamp in milliseconds (not UNIX).
 * @param  {boolean} format12 - Format in 12 hour format.
 * @param  {string} delimiter - Delimiter character.
 * @param  {function} cb - Optional custom format function.
 * @return {string} - The timestamp pretty format.
 *
 * @resource [https://stackoverflow.com/a/6078873]
 * @resource [https://stackoverflow.com/a/45464959]
 * @resource [https://stackoverflow.com/a/5971324]
 * @resource [https://www.w3schools.com/js/js_date_methods.asp]
 */
var timedate = function(timestamp, format12, delimiter, cb) {
	// Timestamp must be a number.
	if (!timestamp || typeof timestamp !== "number") {
		return undefined;
	}

	// Default delimiter to a space.
	delimiter = delimiter || " ";

	// Create the date object using the modified timestamp.
	var date = new Date(timestamp);

	// Get the needed date information.
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var day = date.getDate();

	// Get date time information.
	var hour = date.getHours();
	var min = date.getMinutes();
	var sec = date.getSeconds();

	/**
	 * Prefix number with a zero.
	 *
	 * @param  {number} num - The number to prefix.
	 * @return {string} - The prefixed number as a string.
	 */
	var prefix_zero = function(num) {
		return num < 10 ? `0${num + ""}` : num + "";
	};

	// Reset the hour.
	hour = hour > 12 && format12 ? hour - 12 : hour;
	hour = hour === 0 ? 12 : hour;

	// Zero prefix time vars.
	hour = prefix_zero(hour);
	min = prefix_zero(min);
	sec = prefix_zero(sec);

	// If a custom format function is supplied use it.
	if (cb && typeof cb === "function") {
		return cb.call({
			year: year,
			month: month,
			day: day,
			hour: hour,
			min: min,
			sec: sec
		});
	}

	// Format the time in the following format when no custom
	// format function is supplied:
	return `${year}-${month}-${day}${delimiter}${hour}:${min}:${sec}`;
};

/**
 * A performance timer. Tries to use performance-now, if installed, or hrtime
 *     if not.
 *
 * @param  {number|array} start - Hrtime or performance-now value.
 * @param  {string} suffix - Optional suffix. Defaults to "s" for seconds.
 * @return {string} - The time difference.
 *
 * @resource [https://stackoverflow.com/a/34970550]
 * @resource [https://nodejs.org/api/process.html#process_process_hrtime_time]
 */
var timer = function(start, suffix) {
	// Vars.
	var fn;
	var is_perfnow_module;
	var diff;

	// Use performance-now module if installed. Else default to hrtime.
	try {
		fn = require("performance-now");
		// Set flag.
		is_perfnow_module = true;
	} catch (e) {
		fn = process.hrtime;
	}

	// If no start time, return a time value.
	if (!start) {
		return fn();
	}

	// Calculate the difference.
	if (is_perfnow_module) {
		// Make the end time.
		let end = fn();
		// Calculate the difference in times.
		diff = (end - start) / 1000;
	} else {
		// Make the end time.
		let end = fn(start);
		// Calculate the difference in times.
		diff = Math.round(end[0] * 1000 + end[1] / 1000000) / 1000;
	}

	// If false is provided as the suffix, leave it empty. Else if a string
	// is provided use that. If nothing is given default to "s" for seconds.
	let suff =
		suffix === false ? "" : typeof suffix === "string" ? suffix : "s";

	// Fix the difference to 2 decimals and return.
	return `${diff.toFixed(2)}${suff}`;
};

// Export functions.
exports.string_index_insert = string_index_insert;
exports.slugify = slugify;
exports.dehashify = dehashify;
exports.range = range;
exports.make_unique = make_unique;
exports.remove_space = remove_space;
exports.add_commas_to_num = add_commas_to_num;
exports.apath = apath;
exports.id = id;
exports.regexp_index = regexp_index;
exports.timedate = timedate;
exports.timer = timer;
