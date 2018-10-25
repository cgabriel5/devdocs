"use strict";

// Node modules.
var path = require("path");

// Universal modules.
let prism = require("prismjs");
let highlight = require(path.resolve(
	__APPROOT,
	"./js/source/main/syntax_highlighter.js"
));

// Get markdown-it and customize module.
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

// Attach an object containing needed module variables to be used in index.js
mdzero.vars = {
	blocks: [],
	count: -1
};

// [https://github.com/markdown-it/markdown-it/blob/master/lib/renderer.js#L30]
mdzero.renderer.rules.code_inline = function(
	tokens,
	idx /*, options, env, slf*/
) {
	mdzero.vars.blocks.push([
		`<code>${mdzero.utils.escapeHtml(tokens[idx].content)}</code>`
	]);
	return `[dd::-codeblock-placeholder-${++mdzero.vars.count}]`;
};

// [https://github.com/markdown-it/markdown-it/blob/master/lib/renderer.js#L30]
mdzero.renderer.rules.code_block = function(
	tokens,
	idx /*, options, env, slf*/
) {
	mdzero.vars.blocks.push([
		`<pre><code class="lang-">${mdzero.utils.escapeHtml(
			tokens[idx].content
		)}</code></pre>`
	]);
	return `[dd::-codeblock-placeholder-${++mdzero.vars.count}]\n`;
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

	// Highlight the code.
	highlighted = highlight(token.content, lang);

	mdzero.vars.blocks.push([
		`<pre><code class="lang-${lang}" data-highlight-lines="${lines}" data-block-name="${name}">${highlighted}</code></pre>`
	]);
	return `[dd::-codeblock-placeholder-${++mdzero.vars.count}]\n`;
};

// Export functions.
exports.mdzero = mdzero;
exports.highlight = highlight;
