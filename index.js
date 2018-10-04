#! /usr/bin/env node

/*jshint bitwise: false*/
/*jshint browser: false*/
/*jshint esversion: 6 */
/*jshint node: true*/
/*jshint -W014 */
/*jshint -W018 */
/*jshint maxerr: 10000 */
/*jshint elision: true*/

"use strict";

// Node modules.
let fs = require("fs");
let path = require("path");

// Universal modules.
let chalk = require("chalk");
let marked = require("marked");
let mdzero = require("markdown-it")({
	html: true, // Enable HTML tags in source
	xhtmlOut: false, // Use '/' to close single tags (<br />).
	// This is only for full CommonMark compatibility.
	breaks: false, // Convert '\n' in paragraphs into <br>
	langPrefix: "lang-", // CSS language prefix for fenced blocks. Can be
	// useful for external highlighters.
	linkify: true, // Autoconvert URL-like text to links

	// Enable some language-neutral replacement + quotes beautification
	typographer: false,

	// Double + single quotes replacement pairs, when typographer enabled,
	// and smartquotes on. Could be either a String or an Array.
	//
	// For example, you can use '«»„“' for Russian, '„“‚‘' for German,
	// and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
	quotes: "“”‘’",

	// Highlighter function. Should return escaped HTML,
	// or '' if the source string is not changed and should be escaped externally.
	// If result starts with <pre... internal wrapper is skipped.
	highlight: function(/*code, language*/) {
		return "[[ERROR: Failed to parse code block. Code block indentation needs to properly align.]]";
	}
}).use(require("markdown-it-task-lists"));
// [https://github.com/markdown-it/markdown-it/issues/330]
// [https://github.com/markdown-it/markdown-it/issues/283]
// [https://github.com/markdown-it/markdown-it/issues/361]
// [https://github.com/markdown-it/markdown-it/issues/263]
// [https://github.com/markdown-it/markdown-it/issues/289]
// [http://www.broculos.net/2015/12/build-your-own-markdown-flavour-with.html]
// .enable("code")
// .enable("fence")
// .enable("table")
// .enable("paragraph")
// .enable("link")
// .enable("linkify")
// .enable("image");

// Placehold any code blocks.
var lookup_codeblocks = [];
var lookup_codeblocks_count = -1;

// [https://github.com/markdown-it/markdown-it/blob/master/lib/renderer.js#L30]
mdzero.renderer.rules.code_inline = function(
	tokens,
	idx /*, options, env, slf*/
) {
	lookup_codeblocks.push([
		`<code>${mdzero.utils.escapeHtml(tokens[idx].content)}</code>`
	]);
	return `[dd::-codeblock-placeholder-${++lookup_codeblocks_count}]`;
};

// [https://github.com/markdown-it/markdown-it/blob/master/lib/renderer.js#L30]
mdzero.renderer.rules.code_block = function(
	tokens,
	idx /*, options, env, slf*/
) {
	// Generate a special ID for the pre element.
	var uid = `tmp-${id(25)}`;

	lookup_codeblocks.push([
		`<pre data-skip-markdownit="true"><code data-skip-markdownit="true" id="${uid}" class="lang-" data-skip="true" data-orig-text="">${mdzero.utils.escapeHtml(
			tokens[idx].content
		)}</code></pre>`
	]);
	return `[dd::-codeblock-placeholder-${++lookup_codeblocks_count}]\n`;
};

// [https://github.com/markdown-it/markdown-it/blob/master/lib/renderer.js#L39]
mdzero.renderer.rules.fence = function(tokens, idx /*, options, env, slf*/) {
	var token = tokens[idx],
		info = token.info ? mdzero.utils.unescapeAll(token.info).trim() : "",
		highlighted;

	// CUSTOM LOGIC ---------- NOT MarkdownIt ---------- |
	// Custom vars.
	var lines = "";
	var name = "";
	var lang = "";

	// Check for line highlight numbers/code block name.
	if (info) {
		// Regexp: language[1]?, line numbers[2]?, block name[3]?.
		var matches = info.match(/([\w]+)?({.*?})?({.*?})?/i);

		// Reset the info to only contain the language.
		lang = matches[1] || "";
		lines = (matches[2] || "").replace(/^\{|\}$/g, "");
		name = (matches[3] || "").replace(/^\{|\}$/g, "");
	}
	// CUSTOM LOGIC ---------- NOT MarkdownIt ---------- |

	// Generate a special ID for the pre element.
	var uid = `tmp-${id(25)}`;

	// Highlight the code.
	highlighted = highlight(token.content, lang);

	lookup_codeblocks.push([
		`<pre><code id="${uid}" class="lang-${lang}" data-skip="true" data-orig-text="" data-highlight-lines="${lines}" data-block-name="${name}">${highlighted}</code></pre>`
	]);
	return `[dd::-codeblock-placeholder-${++lookup_codeblocks_count}]\n`;
};

let prism = require("prismjs");
// Extend the default prismjs languages.
require("prism-languages");
let highlightjs = require("highlight.js");
let argv = require("minimist")(process.argv.slice(2));

let del = require("del");
let pump = require("pump");
let mkdirp = require("mkdirp");
let fe = require("file-exists");
let findup = require("find-up");
// let json = require("json-file");
let jsonc = require("comment-json");
let get = require("object-path-get");
let sequence = require("run-sequence");
let vfsfake = require("vinyl-fs-fake");
let cheerio = require("cheerio");
let Entities = require("html-entities").XmlEntities;
let entities = new Entities();
let emoji = require("node-emoji");
let eunicode = require("emoji-unicode");
let twemoji = require("twemoji");
let timeago = require("epoch-timeago").default;
let removeHtmlComments = require("remove-html-comments");

let now = require("performance-now");
let tstart = now();

// Lazy load gulp plugins.
let $ = require("gulp-load-plugins")({
	rename: {
		"gulp-if": "gulpif",
		"gulp-clean-css": "clean_css",
		// "gulp-json-sort": "json_sort",
		"gulp-prettier-plugin": "prettier"
		// "gulp-real-favicon": "real_favicon",
		// "gulp-strip-json-comments": "strip_jsonc"
	},
	postRequireTransforms: {
		json_sort: function(plugin) {
			return plugin.default;
		},
		uglify: function() {
			// By default es-uglify is used to uglify JS.
			// [https://stackoverflow.com/a/45554108]
			let uglifyjs = require("uglify-es");
			let composer = require("gulp-uglify/composer");
			return composer(uglifyjs, console);
		}
	}
});

// Project utils.
let utils = require(apath("./gulp/assets/utils/utils.js"));
let print = utils.print;
let notify = utils.notify;
let gulp = utils.gulp;
let format = utils.format;
// let uri = utils.uri;
// let browser = utils.browser;
// let bangify = utils.bangify;
let globall = utils.globall;
// let extension = utils.ext;
// let expand_paths = utils.expand_paths;
// let opts_sort = utils.opts_sort;
// let escape = utils.escape;

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
function apath(__path) {
	return path.resolve(__dirname, __path);
}

/**
 * Create the absolute path while taking into account the user's directory.
 *
 * @param  {string} __path - The path to resolve.
 * @return {string} - The resolved path.
 */
// function upath(__path) {
// 	return path.resolve(process.cwd(), __path);
// }

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

	// Default the delimiter to nothing.
	delimiter = delimiter || " ";
	if (delimiter.trim() !== "") {
		delimiter = ` ${delimiter.trim()} `;
	}

	// Create the date object using the modified timestamp.
	var date = new Date(timestamp);

	// Get the needed date information.
	var year = date.getFullYear();
	var month = date.getMonth();
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
 * Convert dd-expandable tags, i.e. (<dd-note>) to dd::-ctags placeholders.
 *
 * @param  {string} text - The text to placeholder.
 * @return {string} - The placeholded text.
 */
var ctags_attrs = [];
var ctags_attrs_count = -1;
function convert_ctags(text) {
	return text.replace(
		/<(\/?)dd-(note|codegroup|expand)\b(.*?)?>/gim,
		// "[$1:::$2$3]"
		function(match) {
			var matches = match.match(
				/<(\/?)dd-(note|codegroup|expand)\b(.*?)?>/
			);

			if (/^<\//.test(match)) {
				return `[${matches[1]}:::${matches[2]}]`;
			} else {
				ctags_attrs.push((matches[3] || "").trim());
				return `[${matches[1]}:::${
					matches[2]
				} dd::-ctags-${++ctags_attrs_count}]`;
			}
		}
	);
}

/**
 * Remove wrapped p tags from placeholders.
 *
 * @param  {string} text - The text.
 * @return {string} - The unwrapped text.
 */
function unwrap_ctags(text) {
	var r = /(<p>\s*)?(\[\/?:::(note|codegroup|expand)\b(.*?)\])(\s*<\/p>)?/gim;
	return text.replace(r, function(match) {
		var matches = match.match(
			/(<p>\s*)?(\[\/?:::(note|codegroup|expand)\b(.*?)\])(\s*<\/p>)?/
		);

		// Get the custom tag.
		var tag = matches[2];

		// Get the tag and attrs.
		matches = tag.match(/\[(\/)?\:\:\:(.*?)( dd\:\:\-ctags-(\d+))?\]/);
		var is_closing = matches[1] ? "/" : "";
		var tagtype = matches[2];
		var count = matches[4];

		var attrs = !is_closing ? " " + ctags_attrs[count * 1] : "";

		return `<${is_closing}dd-${tagtype}${attrs}>`;
	});
}

/**
 * Expand dd-expandable tags, i.e. (<dd-note>) to their custom HTML.
 *
 * @param  {string} text - The text to expand.
 * @return {string} - The expanded text.
 */
function expand_ctags(text) {
	text = text
		.replace(/<dd-expand(.*?)>/gim, function(match) {
			// Dynamically generate the regexp.
			var r = function(attr) {
				return new RegExp(`${attr}\=('|\")(.*?)\\1`, "im");
			};

			// Get the title.
			var title = match.match(r("title"));
			title = title ? title[2] : "";
			title = title ? title : "Expand";

			// Build and return the HTML.
			return `\n\n<div class="dd-expandable">
	<div class="dd-expandable-message noselect">
		<i class="fas fa-chevron-circle-right mr5 mb3 dd-expandable-message-icon"></i>
		<span>${title}</span>
	</div>
	<div class="dd-expandable-content none animate-fadein">`;
		})
		.replace(/<\/dd-expand>/gim, "</div></div>");

	var icon_lookup = {
		check: "check-circle",
		"check-double": "check-double",
		info: "info-circle",
		question: "question-circle",
		error: "times-circle",
		warning: "exclamation-circle",
		update: "plus-circle",
		code: "code",
		file: "file-code",
		link: "external-link-square-alt",
		fire: "fire",
		db: "database",
		clock: "clock",
		bug: "bug",
		list: "list-ul",
		"list-num": "list-ol",
		pen: "pen",
		lock: "lock",
		pin: "thumbtack",
		experimental: "flask",
		default: ""
	};

	text = text
		.replace(/<dd-note(.*?)>/gim, function(match) {
			// Dynamically generate the regexp.
			var r = function(attr) {
				return new RegExp(`${attr}\=('|\")(.*?)\\1`, "im");
			};

			// Get the icon.
			var icon = match.match(r("icon"));
			if (icon && icon[2]) {
				icon = `<i class="fas fa-${icon_lookup[icon[2]]}"></i> `;
			} else {
				icon = "";
			}

			// Get the color.
			var color = match.match(r("color"));
			color = color ? color[2] : "";
			color = color ? color : "";

			// Get the title.
			var title = match.match(r("title"));
			title = title ? title[2] : "";
			title = title ? title : "";
			if (title) {
				title = mdzero.renderInline(title);
				title = `<div class="title">${icon}<span>${title}</span></div>`;
			}

			// Build and return the HTML.
			return `\n\n<div class="dd-message dd-message--${color}">${title}<div>\n\n`;
		})
		.replace(/<\/dd-note>/gim, "\n\n</div></div>");

	text = text
		.replace(/<dd-codegroup(.*?)>/gim, function(match) {
			// Dynamically generate the regexp.
			var r = function(attr) {
				return new RegExp(`${attr}\=('|\")(.*?)\\1`, "im");
			};

			// Generate a special ID for the pre element.
			var uid = `exp-${id(12)}`;

			// Get the tabs.
			var tabs_string = match.match(r("tabs"));
			tabs_string = tabs_string ? tabs_string[2] : "";
			tabs_string = tabs_string ? tabs_string : "";

			// Build the tabs HTML.
			var tabs = tabs_string.split(";");
			var tabs_html = [];
			tabs.forEach(function(tab, i) {
				var is_first = i === 0 ? " activetab" : "";
				tabs_html.push(
					`<span class="tab${is_first}" data-tab-index="${i}" data-cgroup-id="${uid}">${tab.trim()}</span>`
				);
			});

			return `\n\n<div class="codeblock-actions-group animate-fadein" data-cgroup-id="${uid}">
			<div class="tabs flex noselect" id="cb-tabs-${uid}">${tabs_html.join("")}</div>
			<div class="flex flex-center mr5">
				<span class="flex flex-center btn noselect action action-copy"><i class="fas fa-clipboard mr5"></i><span>copy</span></span>
			</div>
		</div>
		<div class="code-block-grouped" id="cb-group-${uid}">\n\n`;
		})
		.replace(/<\/dd-codegroup>/gim, "\n\n</div>");

	return text;
}

/**
 * Expand the custom line highlight range. For example, {1,2-7,!5} will get
 *     turned into [1, 2, 3, 4, 6, 7] or {2,7} to [2, 7].
 *
 * @param  {htmlelement} $el - The element to grab line numbers from.
 * @return {array} - The array containing the lines to highlight.
 */
function lines_to_highlight($el) {
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
}

// Get the CLI parameters.
let highlighter = (argv.highlighter || argv.h || "p").toLowerCase();
var debug = argv.debug || argv.d;
var debug_flist = argv.debugfiles || argv.l || false;
var initial = argv.initial || argv.i || false;
var filter = argv.filter || argv.f;
// Prepare the version filter.
filter = filter
	? filter.split(",").map(function(item) {
			return item.trim();
		})
	: null;
let configpath = argv.config || argv.c;
let outputpath = argv.output || argv.o;
let outputpath_filename = argv.name || argv.n;

// App variables.
let promises = [];

// 1. Look for a config file in the cwd.
// 2. Look for a file in the cwd inside the sub folder configs/FILE or config/FILE.
// 3. If nothing is found throw an error.
// 4. Provide the path from the CLI (CLI path will trump looking for a config file).

// Store the current working directory.
let cwd = process.cwd();

// Look for a config file if one if not provided via the CLI.
if (!configpath) {
	// Look for a config in the current working directory.
	let root_config = path.join(cwd, "devdocs.config.js");
	if (fe.sync(root_config)) {
		// Reset the config path.
		configpath = root_config;
	} else {
		// Look for a config file in a config folder.
		let subconfig_config = path.join(cwd, "/config", "devdocs.config.js");
		if (fe.sync(subconfig_config)) {
			// Reset the config path.
			configpath = subconfig_config;
		} else {
			// Try a final time and look for a sub folder /configs
			let subconfig_config = path.join(
				cwd,
				"/configs",
				"devdocs.config.js"
			);
			if (fe.sync(subconfig_config)) {
				// Reset the config path.
				configpath = subconfig_config;
			} else {
				// If nothing is found return and give an error message.
				return print.gulp.error(
					"A config (devdocs.config.js) file was not found."
				);
			}
		}
	}
}

// Load the configuration file.
let config = require(configpath);
let root = get(config, "root", "docs/");
let versions = get(config, "versions", []);
let footer = get(config, "footer", []);
let titlen = get(config, "title", "devdocs");
let logo = config.logo;
// let title = config.title;
// If debug flag was not supplied via the CL, look for it in the config file.
debug = typeof debug === "boolean" ? debug : get(config, "debug", false);
let animations = config.animations;
let modifier = config.modifier;

// The 404 error HTML template.
var error_template = remove_space(
	`<div class="markdown-body animate-fadein">
	<div class="error">
		<div class="error-logo none"><img alt="logo-leaf" class="img" src="{{#dir_path}}/img/leaf-216.png"> devdocs</div>
		<div class="title">{{#title}}</div>
		<div class="message">{{#message}}</div>
		{{#content}}
	</div>
</div>`
);
// Add an object to store the converted Markdown to HTML content.
config.files = {
	internal: {
		// Add needed 404 errors.
		_404: format(error_template, {
			title: "Page Not Found",
			message: "The page trying to be viewed does not exist.",
			content: `<div class="content"><span class="btn btn-home noselect" id="btn-home"><i class="fas fa-home mr2"></i> Go home</span></div>`
		}),
		_404_version: format(error_template, {
			title: "Version Not Found",
			message: "{{#version}} doesn't exist.",
			content: `<div class="content none" id="error-content">{{#versions}}</div>`
		}),
		_404_missing_docs: format(error_template, {
			title: "Docs Not Found",
			message: "No docs exist.",
			content: null
		})
	},
	user: {}
};

// Add an object to store HTML structures.
config.html = {};

// Add the MacOS scrollbar styles:
config.html.styles_macos_sb = [
	`::-webkit-scrollbar {
	width: 16px;
	height: 16px;
	background: #f8f8f8;
}`,
	`::-webkit-scrollbar:window-inactive {
	background: #f8f8f850;
}`,
	`::-webkit-scrollbar-button {
	width: 0;
	height: 0;
}`,
	`::-webkit-scrollbar-thumb {
	background: #c1c1c1;
	border-radius: 1000px;
	border: 4px solid transparent;
	background-clip: content-box;
}`,
	`::-webkit-scrollbar-thumb:window-inactive {
	background: #c1c1c150;
	border-radius: 1000px;
	border: 4px solid transparent;
	background-clip: content-box;
}`,
	`::-webkit-scrollbar-thumb:hover {
	background: #7d7d7d;
	border: 4px solid transparent;
	background-clip: content-box;
}`,
	`::-webkit-scrollbar-thumb:window-inactive:hover {
	background: #c1c1c150;
	border: 4px solid transparent;
	background-clip: content-box;
}`,
	`::-webkit-scrollbar-track {
	background: 0 0;
	border-radius: 0;
}`,
	`::-webkit-scrollbar-track:vertical {
	background: 0 0;
	border-radius: 0;
	border-left: 1px solid #eaeaea;
}`,
	`::-webkit-scrollbar-track:horizontal {
	background: 0 0;
	border-radius: 0;
	border-top: 1px solid #eaeaea;
}`,
	`::-webkit-scrollbar-track:vertical:window-inactive {
	border-left: 1px solid #eaeaea50;
}`,
	`::-webkit-scrollbar-track:horizontal:window-inactive {
	border-top: 1px solid #eaeaea50;
}`,
	`::-webkit-scrollbar-corner {
	background: #ffffff;
	border-top: 1px solid #dddddd;
	border-left: 1px solid #dddddd;
}`
];

// Honor the CLI outputpath parameter but if nothing is provided reset the
// value to the config given value. If nothing is found in the config file
// then default to the default devdocs folder.
if (!outputpath) {
	outputpath = get(config, "output.path", "devdocs/");
}
if (!outputpath_filename) {
	outputpath_filename = get(config, "output.filename", "data.json");
}

// Make the output folder structure.
mkdirp.sync(outputpath);

function highlight(code, language) {
	// If the language not provided return original code.
	// Default to a language when none is provided.
	if (!language) {
		return entities.encode(code);
	}

	language = language.toLowerCase();

	// When the lang is "diff" markup the code via a custom way.
	if (language === "diff") {
		code = code.trim();
		code = entities.encode(code);

		// Get code lines.
		var lines = code.split("\n");
		var result = [];
		for (var i = 0, l = lines.length; i < l; i++) {
			var line = lines[i];
			var fchar = line.charAt(0);

			// Skip empty lines.
			if (line.trim() !== "") {
				// Special lines start with: -, +, @@, diff
				if (fchar === "-") {
					line = `<span class="code-diff diff-deletion">${line}</span>`;
				} else if (fchar === "+") {
					line = `<span class="code-diff diff-addition">${line}</span>`;
				} else if (fchar === "@" && line.startsWith("@@")) {
					line = line.replace(
						/^(\@\@(.*?)\@\@)(.*?)$/,
						`<span class="code-diff diff-coordinate">$1</span>$3`
					);
				} else if (fchar === "d" && line.startsWith("diff")) {
					line = `<span class="code-diff diff-diffline">${line}</span>`;
				}
			}

			// Add the line to the results array.
			result.push(line);
		}

		return result.join("\n");
	}

	// Reset languages.
	if (language) {
		// Reset "md" to "markup".
		if (language.toLowerCase() === "md") {
			language = "markup";
		}
	}

	// Determine what highlighter to use. Either prismjs or highlightjs.
	if (highlighter[0] === "h") {
		// Use highlightjs.
		return highlightjs.highlightAuto(code).value;
	} else {
		// Use prismjs.
		// Default to markup when language is undefined or get an error.

		try {
			// If the language does not exist return original code.
			if (!Object.keys(prism.languages).includes(language)) {
				return entities.encode(code);
			}

			return prism.highlight(code, prism.languages[language]);
		} catch (err) {
			return entities.encode(code);
		}
	}
}

// Determine whether to highlight code blocks.
if (highlighter && ["p", "h"].includes(highlighter.charAt(0))) {
	marked.setOptions({
		highlight: highlight
	});
}

// Extend the marked renderer:
// [https://github.com/markedjs/marked/blob/master/USAGE_EXTENSIBILITY.md]

// Make a reference to the marked Renderer.
let renderer = new marked.Renderer();

var renderer_def_override = function(text) {
	return text;
};

// [https://github.com/markedjs/marked/issues/1302]
renderer.code = renderer_def_override;
renderer.blockquote = renderer_def_override;
renderer.html = renderer_def_override;
renderer.heading = renderer_def_override;
renderer.hr = renderer_def_override;
renderer.list = renderer_def_override;
renderer.listitem = renderer_def_override;
renderer.checkbox = renderer_def_override;
renderer.paragraph = renderer_def_override;
renderer.table = renderer_def_override;
renderer.tablerow = renderer_def_override;
renderer.tablecell = renderer_def_override;
renderer.codespan = renderer_def_override;
renderer.br = renderer_def_override;
renderer.del = renderer_def_override;
renderer.image = renderer_def_override;

// Emojify marked text.
// [https://github.com/markedjs/marked/blob/master/lib/marked.js#L1043]
renderer.text = function(text) {
	// Un-emojify.
	text = emoji.unemojify(text);

	// Emojify.
	text = emoji.emojify(
		text,
		// When an emoji is not found default to a question mark.
		// [https://emojipedia.org/static/img/lazy.svg]
		function(name) {
			return `<img class="emoji" draggable="false" alt=":${name}:" src="${outputpath.replace(
				/^[\.\/]+|\/$/g,
				""
			)}/img/missing-emoji.png">`;
		},
		function(code /*, name*/) {
			// Get the unicode of the emoticon.
			var unicode = eunicode(code);

			// Use unicode to convert to code point.
			var cc = twemoji.convert.fromCodePoint(unicode);

			// Use code point to finally convert to twitter emoji.
			var html = twemoji.parse(cc);

			// Return the HTML.
			return html;
		}
	);

	return text;
};

// All processed directory data will be contained in this array.
var dirs = [];

// Build the footer if links are provided.
let footer_html = ['<div class="footer">'];
if (footer.length) {
	// Supported social platforms for footer links.
	let socials = {
		personal: "fas fa-globe-americas",
		facebook: "fab fa-facebook",
		messenger: "fab fa-facebook-messenger",
		twitter: "fab fa-twitter",
		youtube: "fab fa-youtube",
		vimeo: "fab fa-vimeo-v",
		google: "fab fa-google",
		google_plus: "fab fa-google-plus-g",
		google_drive: "fab fa-google-drive",
		reddit: "fab fa-reddit-alien",
		pinterest: "fab fa-pinterest-p",
		snapchat: "fab fa-snapchat-ghost",
		tumblr: "fab fa-tumblr",
		github: "fab fa-github",
		bitbucket: "fab fa-bitbucket",
		blogger: "fab fa-blogger-b",
		stumbleupon: "fab fa-stumbleupon",
		medium: "fab fa-medium-m",
		gitter: "fab fa-gitter",
		gitlab: "fab fa-gitlab",
		wordpress: "fab fa-wordpress",
		overflow: "fab fa-stack-overflow",
		slack: "fab fa-slack",
		gratipay: "fab fa-gratipay",
		location: "fas fa-map-marker-alt",
		email: "fas fa-envelope"
	};

	// Loop over the footer sections.
	footer.forEach(function(section) {
		// Get the title and links.
		let title = section.title;
		let links = section.links; // ["text", "url", "icon"]

		// Vars.
		var title_html = "";
		var content_html = "";
		var section_html = "";
		var link_content = [];

		// Start building the section HTML.

		// If a title is provided make the title HTML.
		if (title) {
			title_html = `<div class="title">${title}</div>`;
		}

		// If a links are provided make the content HTML.
		links.forEach(function(link) {
			// Get the needed information.
			let text = link[0];
			let url = link[1];
			let link_start = "";
			let link_end = "";
			let icon = link[2];

			// Reset the link start/end.
			if (url) {
				link_start = `<a href="${url}" target="_blank" class="link">`;
				link_end = "</a>";
			}

			// Check whether a social icon was provided or an actual image.
			icon = !/^\:[\w_]+/.test(icon) // :facebook-icon || ./path/to/icon
				? `<img src="${icon}" class="img mr5">`
				: socials[icon.replace(/^\:/g, "")]
					? `<i class="${socials[icon.replace(/^\:/g, "")]} mr5"></i>`
					: "";

			// Add the HTML to the collection.
			link_content.push(
				`${link_start}<div class="truncate">${icon}<span class="mr5">${text}</span></div>${link_end}`
			);
		});

		// If the content array is populated make the content HTML.
		if (link_content.length) {
			content_html = `<div class="content">${link_content.join(
				""
			)}</div>`;
		}

		// Finally, make the section HTML and add it to the footer_html array.
		footer_html.push(
			`<div class="section">${title_html}${content_html}</div>`
		);
	});
}

// Add the footer copyright information.

// Get the GitHub account information.
var github = Object.assign(
	{
		// Defaults.
		account_username: "",
		project_name: ""
	},
	config.github
);

// Get the GitHub information.
var uname = github.account_username;
var pname = github.project_name;

// Vars.
var link_start = "",
	link_end = "";

// Make the link HTML if the GitHub info exists.
if (uname && pname) {
	link_start = `<a href="https://github.com/${uname}/${pname}/" target="_blank" class="truncate">`;
	link_end = "</a>";
}

// Close footer HTML.
footer_html.push(`</div>`);

// Add copyright HTML.
footer_html.push(
	`<div class="copyright">${link_start}© ${new Date(
		Date.now()
	).getFullYear()} ${titlen}${link_end}</div>`
);

// Store the versions.
config.versions = [];

// Loop over Table-Of-Contents key to generate the HTML files from Markdown.
versions.forEach(function(vdata) {
	// Get the directories.
	var version = Object.keys(vdata)[0];
	var directories = vdata[version];

	// If the filter flag is provided only generate documentation if the
	// version is in the filters provided. Else skip it and print a
	// warning for debugging purposes.
	if (filter && !filter.includes(version)) {
		if (debug) {
			print.gulp.warn(
				"Skipped version",
				chalk.magenta(version),
				"(filter)"
			);
		}
		return;
	}

	// Store the version.
	config.versions.push(version);

	var gdir = [];
	gdir.version = version;
	dirs.push(gdir);

	directories.forEach(function(directory, index) {
		// Create an object to store all directory information.
		let __dir = {};
		// Add object to the config object.
		gdir.push(__dir);

		// Get the directory name
		let dirname = Object.keys(directory)[0];

		// Apply the modifier to the file name if provided.
		let alias_dir = dirname;
		if (modifier) {
			alias_dir = modifier(path.basename(dirname), dirname, "directory");
		}

		// Setup a counter to use as the id for the files.
		let counter_dir = index + 1;

		// Store the directory information.
		__dir.name = dirname;
		__dir.alias = alias_dir;
		__dir.odata = directory; // Original data.
		__dir.html = `<li class="l-1" id="menu-dir-${counter_dir}">${alias_dir}</li>`;
		// All processed files' information will be contained here.
		__dir.files = [];
		__dir.first_file = false;
		__dir.version = version;
		__dir.contents = {};

		// Loop over every file in the directory.
		directory[dirname].forEach(function(file, index) {
			// Setup a counter to use as the id for the files.
			let counter_file = index + 1;

			// Create an object to store all file information.
			let __file = {};
			// Add object to its respective parent directory object.
			__dir.files.push(__file);

			// Remove the .md from the file name if provided.
			file = file.replace(/\.md$/i, "");

			// Apply the modifier to the file name if provided.
			let alias_file = path.basename(file);
			if (modifier) {
				alias_file = modifier(alias_file, file, "file");
			}

			// Build the file path.
			let fpath = `${dirname}/${file}`;

			// Store the file information.
			__file.dirname = fpath;
			__file.name = file;
			__file.alias = alias_file;
			__file.html = `<div id="parent-menu-file-${counter_dir}.${counter_file}" class="l-2-parent">
			<li class="l-2" id="menu-file-${counter_dir}.${counter_file}" data-dir="${counter_dir}" data-title="${alias_file}">
			<i class="fas fa-caret-right menu-arrow" data-file="${fpath}"></i>
			<div class="flex l-2-main-cont">
				<a class="link l-2-link truncate" href="#" data-file="${fpath}">${alias_file}</a>
				<span class="link-headings-count">$0</span>
			</div>
		</li></div>`;

			// All processed file headings will be contained here.
			__file.headings = [];

			// Build the file path.
			let __path = path.join("./", root, `${dirname}/`, `${file}.md`);
			// Get the absolute path for the file.
			__path = findup.sync(__path);

			// If the file was not found give a warning and skip it.
			if (!__path) {
				if (debug) {
					print.gulp.warn(
						"Skipped",
						chalk.magenta(`${fpath}`),
						"(file not found)"
					);
				}
				// Remove the item from the __dir.files array.
				__dir.files.pop();
				return;
			}

			// Store the first file.
			if (!__dir.first_file) {
				__dir.first_file = `${fpath}`;
			}

			// Placehold the eventual file before parsed/modified/worked on contents. Once the
			// promise is resolved the -1 will be replaced with the actual worked on file contents.
			// This is done do maintain the file's array order. As promises end once they are
			// resolved, smaller files end quicker. This sometimes causes for the files to be added
			// in the wrong order.
			__dir.contents[`${fpath}`] = -1;

			// Create a Promise for each file.
			let promise = new Promise(function(resolve, reject) {
				// Found headings in the file will be stored in this array.
				let headings = [
					`<ul class="file-headers headings-cont" id="menu-headers-${counter_dir}.${counter_file}" data-dir="${counter_dir}">`
				];

				// Get the file contents.
				fs.readFile(__path, "utf8", function(err, contents) {
					if (err) {
						return reject([`${__path} could not be opened.`, err]);
					}

					// Get the file stats to get the modification timestamp.
					fs.stat(__path, function(err, stats) {
						if (err) {
							return reject([
								`${__path} stats could not be retrived.`,
								err
							]);
						}

						// Get the timeago modification time.
						var mtime = Math.round(stats.mtimeMs);

						// Build the timeago HTML.
						let timeago_html = `<div id="footer-content-ddwrap"><div class="mtime"><div><span class="bold"><i class="fas fa-edit"></i> Last update:</span> <span class="none ts mtime-ts animate-fadein" data-ts="${mtime}"></span> <span class="long">(${timedate(
							mtime
						)})</span></div></div></div>`;

						// Remove any HTML comments as having comments close to markup
						// causes marked to parse it :/.
						contents = removeHtmlComments(contents).data;

						// Convert the custom tags.
						contents = convert_ctags(contents);

						// Render markdown.
						contents = mdzero.render(contents);

						// Block-quote fix (encode HTML entities/backticks).
						contents = contents.replace(
							/<blockquote(.*?)>([\s\S]*?)<\/blockquote>/gim,
							function(match) {
								var matches = match.match(
									/<blockquote(.*?)>([\s\S]*?)<\/blockquote>/i
								);

								// Parts.
								var meta = matches[1] || "";
								var content = matches[2];

								// Now sanitize the content.
								// Replace all br tags to new lines.
								// [https://stackoverflow.com/a/5959455]
								content = content.replace(
									/<br\s*[\/]?>/gi,
									"[dd::space]"
								);
								// Encode HTML entities.
								// content = entities.encode(content);
								// Encode backticks.
								content = content.replace(/`/gm, "&#96;");
								// Add back br tags.
								content = content.replace(
									/\[dd\:\:space\]/g,
									"<br>"
								);

								return `<blockquote${meta}>${content}</blockquote>`;
							}
						);

						// Get any HTML Code blocks (i.e. <pre><code></code></pre>, <code></code>).
						contents = contents.replace(
							/<(pre|code)\b(.*?)>([\s\S]*?)<\/\1>/gim,
							function(match) {
								// Determine whether match is <pre><code>, <pre>, or
								// a <code> block.
								if (/^<code/.test(match)) {
									// A code block does not need its contents
									// highlighted so leave it alone.

									lookup_codeblocks.push(match);
									return `[dd::-codeblock-placeholder-${++lookup_codeblocks_count}]\n`;
								} else {
									if (/<pre\b(.*?)>\s*<code/.test(match)) {
										// A <pre><code>... block.

										// Look for a lang attr in either the
										// code or pre element.
										let lang = (match.match(
											/<code\b(.*?)lang=("|')(.*?)\2(.*?)>/im
										) ||
											match.match(
												/<pre\b(.*?)lang=("|')(.*?)\2(.*?)>/im
											) || [, , , ""])[3];

										// Get the content between the code tags.
										let content = (match.match(
											/<code\b(.*?)>([\s\S]*?)<\/code>/im
										) || [, , ""])[2];

										// [https://stackoverflow.com/a/6234804]
										// [https://github.com/cheeriojs/cheerio#loading]

										// Get the text/code.
										content = entities.decode(content);

										match = match
											.replace(
												/(<pre\b.*?)(lang=("|').*?\3)(.*?>)/im,
												"$1$4"
											)
											.replace(
												/(<code\b.*?)(lang=("|').*?\3)(.*?>)/im,
												`$1 lang="${lang}" $4`
											);

										let highlighted = highlight(
											content,
											lang
										);

										// Generate a special ID for the pre element.
										let uid = `tmp-${id(25)}`;

										lookup_codeblocks.push([
											`<pre><code id="${uid}" class="lang-${lang}" data-skip="true" data-orig-text="" data-highlight-lines="" data-block-name="">${highlighted}</code></pre>`
										]);
										return `[dd::-codeblock-placeholder-${++lookup_codeblocks_count}]\n`;
									} else {
										// A <pre> only block.

										// Look for a lang attr.
										let lang = (match.match(
											/<pre\b(.*?)lang=("|')(.*?)\2(.*?)>/im
										) || [, , , ""])[3];

										// Get the content between the pre tags.
										let content = (match.match(
											/<pre\b(.*?)>([\s\S]*?)<\/pre>/im
										) || [, , ""])[2];

										// [https://stackoverflow.com/a/6234804]
										// [https://github.com/cheeriojs/cheerio#loading]

										// Get the text/code.
										content = entities.decode(content);

										// Note: markdown-it litters the code with
										// paragraph tags when the code contains line
										// breaks :/.
										if (/^<p>|<\/p>$/gm.test(content)) {
											content = content.replace(
												/^<p>|<\/p>$/gm,
												""
											);
										}

										match = match.replace(
											/(<pre\b.*?)(lang=("|').*?\3)(.*?>)/im,
											"$1$4"
										);

										let highlighted = highlight(
											content,
											lang
										);

										// Generate a special ID for the pre element.
										let uid = `tmp-${id(25)}`;

										lookup_codeblocks.push([
											`<pre><code id="${uid}" class="lang-${lang}" data-skip="true" data-orig-text="" data-highlight-lines="" data-block-name="">${highlighted}</code></pre>`
										]);
										return `[dd::-codeblock-placeholder-${++lookup_codeblocks_count}]\n`;
									}
								}
							}
						);

						// Convert the custom tags.
						contents = unwrap_ctags(contents);

						marked(contents, { renderer: renderer }, function(
							err,
							data
						) {
							if (err) {
								return reject([
									`Marked rendering failed for ${__path}.`,
									err
								]);
							}

							// Expand the custom tags.
							data = expand_ctags(data, fpath);

							var r = /\[dd\:\:\-codeblock-placeholder-\d+\]/g;
							var rfn = function(match) {
								return lookup_codeblocks[
									match.replace(/[^\d]/g, "") * 1
								];
							};
							// Loop contents until all codeblocks have been filled back in.
							while (r.test(data)) {
								// Add back the code blocks.
								data = data.replace(r, rfn);
							}

							// Use cheerio to parse the HTML data.
							// [https://github.com/cheeriojs/cheerio/issues/957]
							var $ = cheerio.load(data, {
								// decodeEntities: false
							});

							// Grab all anchor elements to
							$("a[href]").each(function(/*i, elem*/) {
								// Cache the element.
								let $el = $(this);
								// Get the attributes.
								let attrs = $el.attr();
								let href = attrs.href;
								let href_untouched = href; // The original href.
								let href_lower = href.toLowerCase();

								// Clean the href.
								href = dehashify(href);

								// Reset the name and ID attributes.
								let name = attrs.name;
								if (
									name &&
									name.includes(href.replace(/^#/g, ""))
								) {
									$el.attr("name", dehashify(name));
								}
								let id = attrs.id;
								if (
									id &&
									id.includes(href.replace(/^#/g, ""))
								) {
									$el.attr("id", dehashify(id));
								}

								// If an href exists, and it is not an http(s) link or
								// scheme-less URLs, and it ends with .md then we have
								// a link that is another documentation file that needs
								// to be linked to.
								if (
									!(
										href_lower.startsWith("htt") ||
										href_lower.startsWith("//")
									) &&
									href_lower.endsWith(".md")
								) {
									// Set the new href.
									$el.attr("href", "#");

									// Reset the href by removing any starting dot,
									// forward-slashes, and the .md extension.
									href = href.replace(/^[\.\/]+|\.md$/gi, "");

									// Remove the root from the href.
									if (href.startsWith(root)) {
										href = href.replace(root, "");
									}

									// Add the dot slash to the href.
									href = `./${href}`;

									// Set the final href.
									$el.attr("data-file", href);
									// Set the untouched original href.
									$el.attr(
										"data-file-untouched",
										href_untouched
									);
									// Set class to denote its a documentation link.
									$el.addClass("link-doc");
								} else {
									// Open all http links in their own tabs by
									// adding the _blank value. Skip hashes.
									if (!href.startsWith("#")) {
										$el.attr("target", "_blank");
									}
								}
							});

							// Add the ignore class to headers that are contained
							// inside a details element.
							$("h1, h2, h3, h4, h5, h6")
								.filter(function(/*i, el*/) {
									return $(this)
										.parents()
										.filter("details").length;
								})
								.each(function(/*i, el*/) {
									// Cache the element.
									let $el = $(this);

									// Add the ignore class.
									$el.addClass("ignore-header");
								});

							// Add the GitHub octicon link/anchor.
							$("h1, h2, h3, h4, h5, h6")
								.filter(function(/*i, el*/) {
									return !$(this)
										.parents()
										.filter(".dd-expandable").length;
								})
								.each(function(/*i, el*/) {
									// Cache the element.
									let $el = $(this);

									// Get the text.
									let text = $el.text();
									// Get the HTML.
									let html = $el.html();

									// Reset the HTML content.
									$el.html("");

									// Skip if the text is empty.
									if (text.trim() === "") {
										return;
									}

									// Add needed classes.
									$el.addClass("flex");

									// Slugify the text.
									let escaped_text = slugify(
										text.replace(/<\/?.*?\>|\&.*?\;/gm, "")
									);

									$el.attr(
										"data-orig-text",
										entities.encode(text)
									);
									// Copy GitHub anchor SVG. The SVG was lifted from GitHub.
									$el.append(
										`<div>${html}</div><a href="#${escaped_text}" aria-hidden="true" class="anchor" name="${escaped_text}" id="${escaped_text}"><i class="fas fa-link"></i></a>`
									);
									// <svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewBox="0 0 16 16" width="16">
									// 	<path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z">
									// 	</path>
									// </svg>
								});

							// Get all headings in the HTML.
							var __headings = {};
							$("h1 a, h2 a, h3 a, h4 a, h5 a, h6 a")
								.filter(function(/*i, el*/) {
									return !$(this)
										.parents()
										.filter(".dd-expandable").length;
								})
								.each(function(/*i, el*/) {
									// Cache the element.
									let $el = $(this);

									// Get the element id.
									let id = $el.attr().id;

									// If an ID does not exist just skip it.
									if (!id) {
										return;
									}

									// Get the text (no HTML).
									var value = $el
										.parent()
										.text()
										.trim();
									// Get the original text with HTML.
									var otext = $el
										.parent()
										.attr("data-orig-text")
										.trim();

									// Remove any HTML tags from the text.
									otext = otext.replace(
										/<\/?.*?\>|\&.*?\;/gm,
										function(match) {
											// Only allow emojis to pass.
											if (
												!match.startsWith(
													'<img class="emoji"'
												)
											) {
												// Remove tags.
												return match.replace(
													/<\/?.*?\>|\&.*?\;/gm,
													""
												);
											}

											return match;
										}
									);

									// Take into account same name headers. Append the
									// suffix "-NUMBER" to the header href/id to make
									// it unique.
									var heading_count = "";
									if (!__headings[id]) {
										// Add it to the object.
										__headings[id] = 1;
									} else {
										heading_count = __headings[id];

										// Reset  the element id.
										$el.attr(
											"id",
											`${id}-${heading_count}`
										);
										$el.attr(
											"href",
											`${
												$el.attr().href
											}-${heading_count}`
										);

										// Increment the count.
										__headings[id] = heading_count + 1;

										// Add the hyphen.
										heading_count = `-${heading_count}`;
									}

									// Add the second level menu template string.
									headings.push(
										`<li class="l-3" data-title="${value}"><a class="link link-heading" href="#${dehashify(
											id
										)}${heading_count}" data-file="${fpath}">${otext}</a></li>`
									);
								});
							// Add the closing tag to the headings HTML.
							headings.push("</ul>");

							// Reset all the anchor href.
							$("a[href]").each(function(/*i, el*/) {
								// Cache the element.
								let $el = $(this);

								// Get the attributes.
								let attrs = $el.attr();

								// Get the element id.
								let href = attrs.href;

								// Only work on hrefs starting with "#".
								if (href.startsWith("#")) {
									href = href.replace(/\#/g, "");

									$el.attr(
										"href",
										"#" + dehashify(href, true)
									);
								}

								// Add the "link-heading" class only when the href
								// attribute is the only attribute.
								if (Object.keys(attrs).length === 1 && href) {
									$el.addClass("link-heading");
								}
							});

							// Combine all the headings HTML and add to them to the
							// file object.
							__file.headings.push(headings.join(""));

							// Reset the headings count.
							__file.html = __file.html.replace(
								/\$0/,
								headings.length - 2
							);

							// Add the header spacer.
							$("h1, h2, h3, h4, h5, h6").each(
								function(/*i, el*/) {
									// Cache the element.
									let $el = $(this);

									// Get the next element.
									var $next = $el.next()[0];
									if ($next) {
										// Don't add the spacer class if the header group
										// is empty. (no siblings.)
										var spacer_class = !/h[1-6]/i.test(
											$next.name
										)
											? " class='header-spacer'"
											: "";
										$el.after(`<div${spacer_class}></div>`);
									}
								}
							);

							// Hide all but the first code block.
							$(".code-block-grouped").each(function(/*i, el*/) {
								// Cache the element.
								let $el = $(this);

								// Get the code blocks.
								let $blocks = $el.find("pre");

								// Hide all the blocks except the first.
								if ($blocks.length) {
									// The remaining code blocks.
									$blocks = $blocks
										.filter(function(i /*, el*/) {
											return i !== 0;
										})
										.attr("class", "none");
								}
							});

							// Hide code blocks that are too big.
							$("pre code[class^='lang']").each(
								function(/*i, el*/) {
									// Cache the element.
									let $el = $(this);

									// Get text (code) and file stats.
									let text = $el.text().trim();
									let line_count = text.split("\n").length;
									let lines = add_commas_to_num(line_count);
									let chars = add_commas_to_num(
										text.split("").length
									);

									// Get the parent element.
									let $parent = $el.parent();

									// Note: Skip this entirely for codegroups.
									// Check whether it's part of a codegroup.
									var is_partof_codegroup = $el
										.parents()
										.filter(".code-block-grouped").length;

									// Generate a special ID for the pre element.
									var uid = `exp-${id(12)}`;

									// Get the language.
									var classes = $el.attr()["class"];
									var lang = " ";
									var langmatch = "";
									if (classes) {
										langmatch =
											(` ${classes} `.match(
												/ (lang-.+) /i
											) || "")[1] || "";
										if (langmatch) {
											langmatch = langmatch.replace(
												/lang-/i,
												""
											);
											lang = ` <span class="lang">${langmatch}</span>`;
										}
									}

									// If the code is more than 40 lines show an code block placeholder.
									if (line_count >= 40) {
										$parent.before(`<div class="codeblock-placeholder animate-fadein" data-expid="${uid}">
									<div class="template">
										<div class="row">
											<div class="block size-40"></div>
											<div class="block size-100"></div>
										</div>
										<div class="indent row">
											<div class="block size-40"></div>
											<div class="block size-130"></div>
										</div>
										<div class="indent row">
											<div class="block size-40"></div>
											<div class="block size-80"></div>
											<div class="block size-70"></div>
										</div>
										<div class="row">
											<div class="block size-40"></div>
											<div class="block size-50"></div>
										</div>
									</div>
									<div class="info">
										<div>
											<div>
												<span class="bold noselect">Show block ${lang}</span>
												<div class="details">
													<i class="fas fa-code"></i> — ${lines} lines, ${chars} characters
												</div>
											</div>
										</div>
									</div>
								</div>`);

										// Dont't add the buttons when the block is part of a group.
										if (!is_partof_codegroup) {
											// Add the action buttons
											$parent.before(`<div class="codeblock-actions def-font none animate-fadein">
												<span class="flex flex-center btn noselect action action-copy" data-expid="${uid}"><i class="fas fa-clipboard mr5"></i><span>copy</span></span>
												<span class="flex flex-center btn noselect action btn-cba-collapse" data-expid="${uid}"><i class="fas fa-minus-square mr5"></i><span>collapse</span></span>
							</div>`);
										}

										// Finally hide the element.
										$parent.addClass("none");
										$parent.addClass("animate-fadein");
									} else {
										// Dont't add the buttons when the block is part of a group.
										if (!is_partof_codegroup) {
											$parent.before(
												`<div class="codeblock-actions def-font animate-fadein"><span class="flex flex-center btn noselect action action-copy" data-expid="${uid}"><i class="fas fa-clipboard mr5"></i><span>copy</span></span></div>`
											);
										}
									}
									$parent.attr("id", uid);

									// Set the line numbers element.

									// Trim the HTML.
									let html = $el.html().trim();
									// Reset the HTML.
									$el.html(html);
									// Get the text.
									text = $el.text();
									// Get the number of lines.
									lines = text.split("\n").length;

									// Get the lines to highlight.
									var _lines = lines_to_highlight($el);

									var line_nums = [];
									for (let i = 0, l = lines; i < l; i++) {
										// Check whether the line needs to be highlighted.
										let needs_highlight = _lines.includes(
											i + 1
										)
											? " class='highlight-n'"
											: "";
										line_nums.push(
											`<div class="line"><span${needs_highlight}>${i +
												1}</span></div>`
										);
									}

									// Make the "line" highlight HTML.
									var line_nums2 = [];
									for (let i = 0, l = lines; i < l; i++) {
										// Check whether the line needs to be highlighted.
										let needs_highlight = _lines.includes(
											i + 1
										)
											? " highlight-l"
											: "";
										line_nums2.push(
											`<div class="line${needs_highlight}"> </div>`
										);
									}

									// Add the block code name.
									var blockname_html = "";
									var top_pad_fix = "";
									// Check for line highlight numbers/ranges.
									var blockname =
										$el.attr()["data-block-name"] || "";
									if (!blockname) {
										var __lang = langmatch.replace(
											"lang-",
											""
										);

										blockname =
											"untitled" +
											(__lang !== "" ? "." + __lang : "");
									}

									blockname_html = `<div class="noselect"><span class="codeblock-name">${blockname}</span></div>`;
									top_pad_fix = "padtop-26";
									$el.addClass(top_pad_fix);

									// Add the line numbers HTML.
									$parent.prepend(
										// Note: Insert a duplicate element to allow the
										// second element to be able to be "fixed". This
										// allows the code element to be properly adjacent
										// to the fixed element.
										`<div class="line-nums first noselect pnone hidden ${top_pad_fix}">${line_nums.join(
											""
										)}</div><div class="line-nums third noselect pnone ${top_pad_fix}">${line_nums2.join(
											""
										)}</div><div class="line-nums second noselect pnone fixed ${top_pad_fix}">${blockname_html}${line_nums.join(
											""
										)}</div>`
									);
								}
							);

							// Hide code blocks that are too big.
							$("pre code[class^='lang']").each(
								function(/*i, el*/) {
									// Cache the element.
									let $el = $(this);

									// Store the original text.
									$el.attr(
										"data-orig-text",
										entities.decode(
											$el.text().replace(/\s*$/, "")
										)
									);
								}
							);

							// Extract and store the details elements' HTML.
							var details_lookup = [];
							var details_counter = -1;

							// Remove and placehold the <details> inner HTML.
							$("details").each(function(/*i, el*/) {
								// Cache the element.
								let $el = $(this);

								// Store the HTML.
								details_lookup.push($el.html());

								// Reset the HTML.
								$el.html(`[dd::-details-${++details_counter}]`);
							});

							// Finally reset the data to the newly parsed/modified HTML.
							data = $.html().replace(
								/<\/?(html|body|head)>/gi,
								""
							);

							// Wrap the headers with their "contents".
							var indices = [];
							var index = regexp_index(data, /<h[1-6].*?>/i);
							while (index !== -1) {
								indices.push(index);

								index = regexp_index(
									data,
									/<h[1-6].*?>/i,
									index + 1
								);
							}

							// Create the HTML inserts.
							var inserts = {};
							indices.forEach(function(index, i) {
								// <h1st --> Start.
								// <h2nd --> End+Start.
								// <h3rd --> End+Start.
								// <h4th --> End+Start, Find ending tag.

								// Start.
								if (i === 0) {
									inserts[index] =
										'<div class="header-content-ddwrap">';
									// End+Start.
								} else if (i === indices.length - 1) {
									inserts[index] =
										'</div><div class="header-content-ddwrap">';
									inserts[data.length] = "</div>";
								} else {
									// End+Start, Find ending tag.
									inserts[index] =
										'</div><div class="header-content-ddwrap">';
								}
							});

							// Reset the data.
							data = string_index_insert(data, inserts);
							// If a single insert exists the entire thing things to
							// be wrapped.
							if (Object.keys(inserts).length === 1) {
								data = `${data}</div>`;
							}

							// Re-parse to wrap the wrap header/contents.
							var $ = cheerio.load(data);
							$(".header-content-ddwrap").each(function(i) {
								// Cache the element.
								let $el = $(this);

								// Get the children.
								let $children = $el.children();
								let chtml = [];

								// Get all the children HTML.
								$children.each(function(/*i, el*/) {
									// Get outerHTML:
									// [https://github.com/cheeriojs/cheerio/issues/54#issuecomment-5234419]

									// Store the child HTML.
									chtml.push($.html($(this)));
								});

								// Remove the first child HTML.
								let firstc = chtml.shift();
								// Get the other children HTML.
								let otherc = chtml.join("");

								// Remove all children.
								$el.empty();

								// Reset the HTML.
								$el.html(
									`${firstc}<div class="ddwrap-content-inner">${otherc}</div>`
								);
							});
							// Finally reset the data to the newly parsed/modified HTML.
							data = $.html().replace(
								/<\/?(html|body|head)>/gi,
								""
							);

							// Fill back in the details placeholders.
							var r = /\[dd\:\:\-details-\d+\]/g;
							var rfn = function(match) {
								return details_lookup[
									match.replace(/[^\d]/g, "") * 1
								];
							};
							// Loop contents until all details have been filled back in.
							while (r.test(data)) {
								// Add back the code blocks.
								data = data.replace(r, rfn);
							}

							// Finally reset the data to the newly parsed/modified HTML.
							data = `<div class="markdown-body animate-fadein">${data}${timeago_html}</div>`;

							// Add to the object.
							var _placeholder = __dir.contents[`${fpath}`];
							if (_placeholder && _placeholder === -1) {
								// Set the actual contents to the data object.
								__dir.contents[`${fpath}`] = data;
							}

							if (debug) {
								print.gulp.info(
									"Processed",
									chalk.magenta(`${fpath}`)
								);
							}

							// Finally, resolve the Promise and return the file path,
							// data, and headings as the data.
							resolve([__path, data, headings]);
						});
					});
				});
			});

			// Push the Promise to the promises array.
			promises.push(promise);
		});
	});
});

// Create first run file. Sub-sequent runs skip tasks for faster performance.
// If files are needed to be re-created/copied/transfered, the initial flag
// can be explicitly provided via the CLI.
gulp.task("first-file:app", function(done) {
	var __outputpath = path.join(outputpath, "._rants.text");

	// Check whether the file exists.
	var file_exists = fe.sync(__outputpath);

	// If the file does not exist, create it.
	if (!file_exists) {
		// Reset initial flag to create/copy/transfer needed files for first run.
		initial = true;
	}

	// Get the time stamp.
	var ts = Date.now();

	if (debug) {
		print.gulp.info(
			"devdocs last run",
			chalk.magenta(
				timeago(
					file_exists
						? fs.readFileSync(__outputpath, "utf8") * 1
						: ts * 1000
				)
			) + ".",
			file_exists ? "" : "(first run)"
		);
	}

	// Create the file and store the time-stamp.
	fs.writeFile(__outputpath, ts.toString(), function(err) {
		if (err) {
			print.gulp.error(`${__outputpath} could not be made.`);

			return done();
		}

		if (debug) {
			print.gulp.info(
				file_exists ? "Updated" : "Saved",
				chalk.magenta(__outputpath),
				"(first-time file)"
			);
		}

		return done();
	});
});

// Remove files upon every build.
gulp.task("clean:app", function(done) {
	// Skip task logic if initial flag is not set.
	if (!initial) {
		if (debug) {
			print.gulp.warn("Skipped cleanup task.");
		}

		return done();
	}

	// Get the devdocs path.
	var dd_path = path.join("./", outputpath);

	// All the path path globs.
	var pglobs = [
		// [https://github.com/gulpjs/gulp/issues/165#issuecomment-32611271]
		// [https://medium.com/@jack.yin/exclude-directory-pattern-in-gulp-with-glob-in-gulp-src-9cc981f32116]
		`${dd_path}**/**.*`,
		`!${dd_path}zdata/`,
		`!${dd_path}zdata/**`,
		`!${dd_path}zdata/**.*`,
		// `${dd_path}zdata/data-VERSION.json`,
		path.join("./index.html")
	];

	// Remove all versions of data files where the version is not
	// in the versions array.
	var vfiles = fs
		.readdirSync(`${dd_path}/zdata/`)
		.filter(function(item) {
			// Remove all text but the version.
			var ver = item.replace(/^data-|.json$/g, "");

			// Check whether the version is in the versions array.
			return !config.versions.includes(ver);
		})
		.map(function(item) {
			return `${dd_path}zdata/${item}`;
		});

	return del(pglobs.concat(vfiles), {
		/* dryRun: false */
	}).then(function(paths) {
		// Contain fake gulp files here.
		var ffiles = [];

		// Modify the paths.
		paths = paths.map(function(item) {
			// Push the fake file vinyl object.
			ffiles.push({
				path: path.relative(cwd, item),
				contents: new Buffer("")
			});

			// Reset path to relative path.
			return path.relative(cwd, item);
		});

		// The following is only needed to log the files.
		pump(
			[
				vfsfake.src(ffiles),
				$.gulpif(
					debug_flist,
					$.debug.edit({ loader: false, title: "removed files..." })
				)
			],
			function() {
				if (debug) {
					print.gulp.info("Removed old devdocs files.");
				}
			}
		);
	});
});

/**
 * This function abstracts the linter printer logic. It prints the
 *     issues in a consistent manner between different HTML, CSS,
 *     and JS linters.
 *
 * @param  {array} issues - Array containing issues as object.
 * @param  {string} filepath - The path of the linted file.
 * @return {undefined} - Nothing.
 */
function lint_printer(issues, filepath) {
	var table = require("text-table");
	var strip_ansi = require("strip-ansi");

	// Get the file name.
	var filename = path.relative(cwd, filepath);

	// Print the file name header.
	print.ln();
	print(chalk.underline(filename));

	// No issues found.
	if (!issues.length) {
		print.ln();
		print(`  ${chalk.yellow("⚠")}  0 issues`);
		print.ln();

		return;
	}

	// Else issues exist so print them.

	// Loop over issues to add custom reporter format/styling.
	issues = issues.map(function(issue) {
		// Replace the array item with the new styled/highlighted parts.
		return [
			"", // Empty space for spacing purposes.
			// Highlight parts.
			chalk.gray(`line ${issue[0]}`),
			chalk.gray(`char ${issue[1]}`),
			chalk.blue(`(${issue[2]})`),
			chalk.yellow(`${issue[3]}.`)
		];
	});

	// Print issues.
	print(
		table(issues, {
			// Remove ansi color to get the string length.
			stringLength: function(string) {
				return strip_ansi(string).length;
			}
		})
	);

	print.ln();

	// Make the issue plural if needed.
	var issue = "issue" + (issues.length > 1 ? "s" : "");

	// Print the issue count.
	print(`  ${chalk.yellow("⚠")}  ${issues.length} ${issue}`);
	print.ln();
}

/**
 * Process any SASS files into their CSS equivalents.
 */
gulp.task("css:sass", function(done) {
	// Skip task logic if initial flag is not set.
	if (!initial) {
		if (debug) {
			print.gulp.warn("Skipped SCSS processing.");
		}

		return done();
	}

	// Note: Make sure to exclude partials (_filename.scss) from processing.
	// [https://stackoverflow.com/a/38095853]

	// The default SCSS style sheets.
	let scss_source_files = ["css/source/scss/**/[^_]*.*scss"];

	// Make the paths absolute to the devdocs module. Not the user's dir.
	scss_source_files = scss_source_files.map(function(__path) {
		return apath(__path);
	});

	let sass = require("node-sass");

	// Contain any SCSS processing errors here.
	var scss_errors = { filenames: [] };

	pump(
		[
			gulp.src(scss_source_files),
			$.gulpif(
				debug_flist,
				$.debug({
					loader: false,
					title: "files for SASS processing..."
				})
			),
			$.each(function(content, file, callback) {
				// Get the file path.
				var __path = file.path;

				// Run the Node-SASS processor on the file.
				// [https://github.com/sass/node-sass#render-callback--v300]
				sass.render({ file: __path }, function(err, result) {
					if (err) {
						// Store the error for later output.
						if (scss_errors[__path]) {
							// Append to the errors.
							scss_errors[__path].push([
								err.line,
								err.column,
								err.status,
								err.message
							]);
						} else {
							// Add for the first time.
							scss_errors[__path] = [
								[err.line, err.column, err.status, err.message]
							];

							// Maintain file processing order.
							scss_errors.filenames.push(__path);
						}
					} else {
						// Reset the file contents with the CSS output.
						file.contents = Buffer.from(result.css.toString());
					}

					callback(null, file.contents);
				});
			}),
			$.rename(function(path) {
				// Rename the file extension from .scss to .css.
				path.extname = ".css";
			}),
			// // [https://github.com/dlmanning/gulp-sass]
			// // [https://gist.github.com/zwinnie/9ca2409d86f3b778ea0fe02326b7731b]
			// $.sass.sync().on("error", function(err) {
			// 	// $.sass.logError
			// 	// Note: For consistency, use the universal lint printer.

			// 	// Pretty print the issues.
			// 	lint_printer(
			// 		[[err.line, err.column, err.name, err.messageOriginal]],
			// 		err.relativePath
			// 	);

			// 	// [https://github.com/dlmanning/gulp-sass/blob/master/index.js]
			// 	// End gulp.
			// 	this.emit("end");
			// }),
			gulp.dest(apath("./css/source/css")),
			$.gulpif(
				debug_flist,
				$.debug.edit({
					loader: false,
					title: "SASS files processed..."
				})
			)
		],
		function() {
			// Output any processing errors.
			if (scss_errors.filenames.length) {
				// Loop over the errors.
				for (let i = 0, l = scss_errors.filenames.length; i < l; i++) {
					// Cache current loop item.
					var filename = scss_errors.filenames[i];

					// Print the errors.
					lint_printer(scss_errors[filename], filename);
				}
			}

			done();
		}
	);
});

// Create the CSS bundle.
gulp.task("css:app", ["css:sass"], function(done) {
	// Skip task logic if initial flag is not set.
	if (!initial) {
		if (debug) {
			print.gulp.warn("Skipped CSS bundling.");
		}

		return done();
	}

	let unprefix = require("postcss-unprefix");
	let autoprefixer = require("autoprefixer");
	let perfectionist = require("perfectionist");
	let shorthand = require("postcss-merge-longhand");
	let csssorter = require("postcss-sorting");

	// The CSS file source path.
	var css_path_source = "css/source/css/";

	// The default CSS style sheets.
	let css_source_files = [
		"css/vendor/sanitize.css/sanitize.css",
		`${css_path_source}github-markdown.css`
		// "css/vendor/font-awesome/font-awesome.css"
	];

	// Add needed syntax highlight CSS file depending on what was provided
	// via the CLI.

	// Get the first char of the passed in highlighter name.
	let highlighter_fchar = highlighter.charAt(0);

	// If a highlighter name was passed determine whether it is prismjs or
	// highlighterjs.
	if (highlighter_fchar !== "n") {
		// Default to prismjs.
		css_source_files.push(
			`${css_path_source}${
				highlighter_fchar === "h" ? "highlightjs" : "prism-github"
			}.css`
		);
	}

	// Add the app styles.
	css_source_files.push(
		// `${css_path_source}helpers.css`,
		`${css_path_source}styles.css`
	);
	// // Add CSS animations if wanted.
	// if (animations) {
	// 	css_source_files.push(`${css_path_source}animations.css`);
	// }

	// Make the paths absolute to the devdocs module. Not the user's dir.
	css_source_files = css_source_files.map(function(__path) {
		return apath(__path);
	});

	// Get the postcss plugins' configurations.
	let AUTOPREFIXER = require("./configs/autoprefixer.json");
	let PERFECTIONIST = require("./configs/perfectionist.json");

	return pump(
		[
			gulp.src(css_source_files),
			$.gulpif(
				debug_flist,
				$.debug({ loader: false, title: "files for bundle.min.css..." })
			),
			$.concat("bundle.min.css"),
			// Replace the default output path with the provided one.
			$.replace(
				/\.\.\/assets\//g,
				// `${path.join(outputpath).replace(process.cwd() + "/", "")}`
				"../"
			),
			$.postcss([
				unprefix(),
				shorthand(),
				autoprefixer(AUTOPREFIXER),
				perfectionist(PERFECTIONIST)
			]),
			// CSS style must be prefixed for it to work at the moment.
			$.replace(/overflow\-scrolling/g, "-webkit-overflow-scrolling"),
			$.replace(/font\-smoothing/g, "-webkit-font-smoothing"),
			$.clean_css(),
			gulp.dest(path.join(outputpath, "/css")),
			$.gulpif(
				debug_flist,
				$.debug.edit({
					loader: false,
					title: "bundled bundle.min.css..."
				})
			)
		],
		function() {
			if (debug) {
				print.gulp.info("Bundled CSS file.");
			}
		}
	);
});

// Create the JS bundle.
gulp.task("js:app", function(done) {
	// Skip task logic if initial flag is not set.
	if (!initial) {
		if (debug) {
			print.gulp.warn("Skipped JS bundling.");
		}

		return done();
	}

	// Get uglify configuration.
	let UGLIFYCONFIG = jsonc.parse(
		fs.readFileSync(apath("./configs/uglify.cm.json")).toString(),
		null,
		true
	);

	return pump(
		[
			gulp.src([
				apath("./js/vendor/httpjs/http.js"),
				apath("./js/vendor/fastclick/fastclick.js"),
				apath("./js/vendor/uaparserjs/uaparser.js"),
				apath("./js/vendor/clipboardjs/clipboard.js"),
				// apath("./js/vendor/smoothscrolljs/smoothscroll.js"),
				// apath("./js/vendor/smoothscrolljs/zenscroll.js"),
				apath("./js/source/app.js")
			]),
			// Replace the default output path with the provided one.
			$.replace(
				/var\s*REQUEST_PATH\s+=\s*("|')(.*)\1;/i,
				`var REQUEST_PATH = $1${path
					.join(outputpath, "zdata", outputpath_filename)
					.replace(process.cwd() + "/", "")}$1;`
			),
			$.gulpif(
				debug_flist,
				$.debug({ loader: false, title: "files for app.min.js..." })
			),
			$.concat("app.min.js"),
			$.uglify(UGLIFYCONFIG),
			gulp.dest(path.join(outputpath, "/js")),
			$.gulpif(
				debug_flist,
				$.debug.edit({ loader: false, title: "bundled app.min.js..." })
			)
		],
		function() {
			if (debug) {
				print.gulp.info("Bundled JS file.");
			}
		}
	);
});

// Create the index.html file.
gulp.task("html:app", function(done) {
	// Modify the output path.
	let __path = outputpath.replace(/^[\.\/]+|\/$/g, "");

	// Replace the paths in the error template.
	config.files.internal._404 = format(config.files.internal._404, {
		dir_path: __path
	});
	config.files.internal._404_version = format(
		config.files.internal._404_version,
		{ dir_path: __path }
	);
	config.files.internal._404_missing_docs = format(
		config.files.internal._404_missing_docs,
		{ dir_path: __path }
	);

	// Skip task logic if initial flag is not set.
	if (!initial) {
		if (debug) {
			print.gulp.warn("Skipped HTML bundling.");
		}

		return done();
	}

	// Get htmlmin configuration.
	let HTMLMIN = require(apath("./configs/htmlmin.json"));

	return pump(
		[
			gulp.src(apath("./index-src.html")),
			// Set the path to the favicons...
			$.replace(/\$\{dir_path\}/g, __path),
			$.gulpif(
				debug_flist,
				$.debug({ loader: false, title: "files for index.html..." })
			),
			$.htmlmin(HTMLMIN),
			$.rename("index.html"),
			gulp.dest(cwd),
			$.gulpif(
				debug_flist,
				$.debug.edit({ loader: false, title: "bundles index.html..." })
			)
		],
		function() {
			if (debug) {
				print.gulp.info("Created index.html file.");
			}
		}
	);
});

// Copy the needed images.
gulp.task("img:app", function(done) {
	// Skip task logic if initial flag is not set.
	if (!initial) {
		if (debug) {
			print.gulp.warn("Skipped img transfer.");
		}

		return done();
	}

	return pump(
		[
			gulp.src(apath(globall("./img/"))),
			$.gulpif(
				debug_flist,
				$.debug({ loader: false, title: "copying image files..." })
			),
			gulp.dest(path.join(outputpath, "/img")),
			$.gulpif(
				debug_flist,
				$.debug.edit({ loader: false, title: "copied image files..." })
			)
		],
		function() {
			if (debug) {
				print.gulp.info("Copied needed image files.");
			}
		}
	);
});

// Copy the app favicons.
gulp.task("favicon:app", function(done) {
	// Skip task logic if initial flag is not set.
	if (!initial) {
		if (debug) {
			print.gulp.warn("Skipped favicon transfer.");
		}

		return done();
	}

	return pump(
		[
			gulp.src(apath(globall("./favicon/"))),
			$.gulpif(
				debug_flist,
				$.debug({ loader: false, title: "copying favicon files..." })
			),
			gulp.dest(path.join(outputpath, "/favicon")),
			$.gulpif(
				debug_flist,
				$.debug.edit({
					loader: false,
					title: "copied favicon files..."
				})
			)
		],
		function() {
			if (debug) {
				print.gulp.info("Copied needed favicon files.");
			}
		}
	);
});

// // Copy the needed font files.
// gulp.task("fonts:app", function(done) {
// 	pump(
// 		[
// 			gulp.src(apath(globall("./css/assets/fonts/"))),
// 			$.gulpif(debug_flist, $.debug({ loader: false })),
// 			gulp.dest(path.join(outputpath, "/fonts")),
// 			$.gulpif(debug_flist, $.debug.edit({ loader: false }));
// 		],
// 		function() {
// 			if (debug) {
// 				print.gulp.info("Copied needed font files.");
// 			}

// 			done();
// 		}
// 	);
// });

// Save the configuration data in its own file to access it in the front-end.
gulp.task("json-data:app", function(done) {
	// Add other needed config data to config object.
	config.html.footer = footer_html.join("");

	// If the latest version is not one of the processed version, throw
	// an error message.
	if (debug && !config.versions.includes(config.latest)) {
		print.gulp.warn(
			"The latest version:",
			chalk.magenta(config.latest),
			"was not one of the processed versions:"
		);

		// Show processed versions.
		print.ln();
		print(chalk.underline("Processed versions"));

		// Log versions.
		config.versions.forEach(function(item) {
			print(`  ${item}`);
		});

		print.ln();
	}

	var __path = path.join(outputpath, "/zdata");

	pump(
		[
			// Create the file via gulp-file and use is at the Gulp.src.
			$.file(outputpath_filename, JSON.stringify(config, null, 4), {
				src: true
			}),
			$.gulpif(
				debug_flist,
				$.debug.edit({
					loader: false,
					title: "saved data file..."
				})
			),
			gulp.dest(__path)
		],
		function() {
			if (debug) {
				print.gulp.info(
					"Saved",
					chalk.magenta(`${path.join(__path, outputpath_filename)}`),
					"(main data file)"
				);
			}

			var fpromises = [];

			// Loop over the dirs array and save each object into its own file.
			dirs.forEach(function(dir) {
				var menu = [];

				// Loop over the directories to make the menu HTML.
				dir.forEach(function(directory, index) {
					let html = [];

					// Loop over all files  to get the HTML and headings.
					directory.files.forEach(function(file) {
						// html.push(file.html, file.headings);
						html.push(file.html);
					});

					// Create the submenu for the current directory.
					menu.push(
						remove_space(`<ul id="submenu-${index +
							1}" class="submenu">
						${directory.html}
						<li>
							<div class="menu-section" data-dir="${index}">
								<ul id="submenu-inner-${index + 1}" class="submenu-ul">
									${html.join("")}
								</ul>
							</div>
						</li>
						</ul>`)
					);
				});

				dir.menu = menu;

				fpromises.push(
					new Promise(function(resolve, reject) {
						var outputpath = path.join(
							__path,
							outputpath_filename.replace(
								/(\.json)$/,
								`-${dir.version}$1`
							)
						);

						var jstring = JSON.stringify(
							{ dirs: dir, menu: menu, outputpath: outputpath },
							null,
							4
						);
						fs.writeFile(outputpath, jstring, function(err) {
							if (err) {
								return reject([
									`${outputpath} could not be opened.`,
									err
								]);
							}

							if (debug) {
								print.gulp.info(
									"Saved",
									chalk.magenta(`${outputpath}`),
									"(version data file)"
								);
							}

							resolve([dir]);
						});
					})
				);
			});

			// Run all the promises.
			return Promise.all(fpromises)
				.then(
					function(/*values*/) {
						if (debug) {
							print.gulp.info(
								"All data/version promises completed."
							);
						}

						done();
					},
					function(err) {
						print.gulp.error(
							"Failed to save data/versions JSON files."
						);
						print(err);
					}
				)
				.catch(function(err) {
					if (typeof err[0] === "string") {
						print.gulp.error(err[0]);
						print(err[1]);
					} else {
						print(err);
					}
				});
		}
	);
});

// Run all the promises.
Promise.all(promises)
	.then(
		function(/*values*/) {
			if (debug) {
				print.gulp.info("All promises completed.");
			}

			// Run the tasks.
			sequence.apply(null, [
				"first-file:app",
				"clean:app",
				"css:app",
				"js:app",
				"html:app",
				"img:app",
				"favicon:app",
				// "fonts:app",
				"json-data:app",
				function() {
					if (debug) {
						print.gulp.success(
							"Documentation generated.",
							chalk.green(
								((now() - tstart) / 1000).toFixed(2) + "s"
							)
						);
					}

					notify(
						"Documentation generated.",
						"devdocs",
						apath("./img/leaf-216.png")
					);
				}
			]);
		},
		function(err) {
			print.gulp.error("Failed to generate documentation.");
			print(err);
		}
	)
	.catch(function(err) {
		if (typeof err[0] === "string") {
			print.gulp.error(err[0]);
			print(err[1]);
		} else {
			print(err);
		}
	});
