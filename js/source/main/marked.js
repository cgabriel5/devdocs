"use strict";

// Universal modules.
let highlight = $app.module("@main/syntax_highlighter.js");

// Universal modules.
let marked = require("marked");
let emoji = require("node-emoji");
let eunicode = require("emoji-unicode");
let twemoji = require("twemoji");

// Exports.

module.exports = function(refs) {
	// Get needed refs.
	var outputpath = refs.outputpath;

	// Get the CLI parameters.
	let argv = require("minimist")(process.argv.slice(2));
	let highlighter = (argv.highlighter || argv.h || "p").toLowerCase();

	// Determine what syntax highlighter to apply. Defaults to prismjs if
	// nothing is provided from the CLI.
	if (highlighter && ["p", "h"].includes(highlighter.charAt(0))) {
		marked.setOptions({
			highlight: highlight
		});
	}

	// Extend marked renderer:
	// [https://github.com/markedjs/marked/blob/master/USAGE_EXTENSIBILITY.md]

	// Make a reference to the marked Renderer.
	let renderer = new marked.Renderer();

	/**
	 * Function overrides the default marked render function. It basically
	 *     returns the text for each render method. The only thing marked
	 *     is used for is to help render the proper emojis. All else is
	 *     left up to markdownit.
	 *
	 * @param  {string} text - The supplied marked text.
	 * @return {string} - The unmodified, marked supplied text.
	 */
	var override = function(text) {
		return text;
	};

	// [https://github.com/markedjs/marked/issues/1302]
	renderer.code = override;
	renderer.blockquote = override;
	renderer.html = override;
	renderer.heading = override;
	renderer.hr = override;
	renderer.list = override;
	renderer.listitem = override;
	renderer.checkbox = override;
	renderer.paragraph = override;
	renderer.table = override;
	renderer.tablerow = override;
	renderer.tablecell = override;
	renderer.codespan = override;
	renderer.br = override;
	renderer.del = override;
	renderer.image = override;

	// Emojify marked text.
	// [https://github.com/markedjs/marked/blob/master/lib/marked.js#L1043]
	renderer.text = function(text) {
		// Un-emojify.
		text = emoji.unemojify(text);

		// console.log(">>>>", text);

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

	return {
		marked,
		renderer
	};
};

// // Exports.

// // Custom marked module.
// exports.marked = marked;
// exports.renderer = renderer;
