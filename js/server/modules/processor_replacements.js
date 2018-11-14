"use strict";

module.exports = function(refs, name) {
	// Get the refs.
	let contents = refs.contents;
	let mdzero = refs.mdzero;
	let entities = refs.entities;
	let format = refs.format;
	let templates = refs.templates;
	let highlight = refs.highlight;

	var fns = {
		blockquotes: function() {
			return contents.replace(
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
					content = content.replace(/<br\s*[\/]?>/gi, "[dd::space]");
					// Encode HTML entities.
					// content = entities.encode(content);
					// Encode backticks.
					content = content.replace(/`/gm, "&#96;");
					// Add back br tags.
					content = content.replace(/\[dd\:\:space\]/g, "<br>");

					return `<blockquote${meta}>${content}</blockquote>`;
				}
			);
		},
		codeblocks: function() {
			return contents.replace(
				/<(pre|code)\b(.*?)>([\s\S]*?)<\/\1>/gim,
				function(match) {
					// Determine whether match is <pre><code>, <pre>, or
					// a <code> block.
					if (/^<code/.test(match)) {
						// A code block does not need its contents
						// highlighted so leave it alone.

						mdzero.vars.blocks.push(match);
						return `[dd::-codeblock-placeholder-${++mdzero.vars
							.count}]\n`;
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

							mdzero.vars.blocks.push([
								format(templates.block, {
									d1: lang,
									d2: highlight(content, lang)
								})
							]);
							return `[dd::-codeblock-placeholder-${++mdzero.vars
								.count}]\n`;
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

							// NOTE: markdown-it litters the code with
							// paragraph tags when the code contains line
							// breaks :/.
							if (/^<p>|<\/p>$/gm.test(content)) {
								content = content.replace(/^<p>|<\/p>$/gm, "");
							}

							match = match.replace(
								/(<pre\b.*?)(lang=("|').*?\3)(.*?>)/im,
								"$1$4"
							);

							mdzero.vars.blocks.push([
								format(templates.block, {
									d1: lang,
									d2: highlight(content, lang)
								})
							]);
							return `[dd::-codeblock-placeholder-${++mdzero.vars
								.count}]\n`;
						}
					}
				}
			);
		}
	};

	// Get and run the needed function.
	return fns[name]();
};
