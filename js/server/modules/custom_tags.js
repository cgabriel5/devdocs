"use strict";

// Universal modules.
let mdzero = $app.module("@module/markdown-it.js").mdzero;

var ctags = {
	// Attach an object containing needed module variables to
	// be used in index.js
	vars: {
		attrs: [],
		count: -1
	}
};

/**
 * Convert dd-exp tags, i.e. (<dd-note>) to dd::-ctags placeholders.
 *
 * @param  {string} text - The text to placeholder.
 * @return {string} - The placeholded text.
 */
ctags.convert = function(text) {
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
				ctags.vars.attrs.push((matches[3] || "").trim());
				return `[${matches[1]}:::${matches[2]} dd::-ctags-${++ctags.vars
					.count}]`;
			}
		}
	);
};

/**
 * Remove wrapped p tags from placeholders.
 *
 * @param  {string} text - The text.
 * @return {string} - The unwrapped text.
 */
ctags.unwrap = function(text) {
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

		var attrs = !is_closing ? " " + ctags.vars.attrs[count * 1] : "";

		return `<${is_closing}dd-${tagtype}${attrs}>`;
	});
};

/**
 * Expand dd-exp tags, i.e. (<dd-note>) to their custom HTML.
 *
 * @param  {string} text - The text to expand.
 * @return {string} - The expanded text.
 */
ctags.expand = function(text) {
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
			return `\n\n<div class="dd-exp">
	<div class="dd-exp-message">
		<i class="fas fa-chevron-circle-right dd-exp-message-icon"></i>
		<span>${title}</span>
	</div>
	<div class="dd-exp-content animate-fadein none">`;
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

			// Get the tabs.
			var tabs_string = match.match(r("tabs"));
			tabs_string = tabs_string ? tabs_string[2] : "";
			tabs_string = tabs_string ? tabs_string : "";

			return `\n\n<div class="cb-group"><div class="cb-top-ui animate-fadein" data-tabs="${tabs_string.trim()}"></div>
		<div class="cb-blocks">\n\n`;
		})
		.replace(/<\/dd-codegroup>/gim, "\n\n</div></div>");

	return text;
};

// Exports.
module.exports = ctags;
