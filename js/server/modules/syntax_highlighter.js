"use strict";

// Universal modules.
let prism = require("prismjs");
// Extend the default prismjs languages.
require("prism-languages");
let highlightjs = require("highlight.js");
let Entities = require("html-entities").XmlEntities;
let entities = new Entities();

// Get the CLI parameters.
let argv = require("minimist")(process.argv.slice(2));
let highlighter = (argv.highlighter || argv.h || "p").toLowerCase();

/**
 * The main syntax highlighter function. Defaults to prismjs. Can be
 *     switched to highlightjs via the CLI.
 *
 * @param  {string} code - The code to add syntax highlighting to.
 * @param  {string} language - The syntax highlighting language.
 * @return {string} - The code with syntax highlighting.
 */
module.exports = function(code, language) {
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
};
