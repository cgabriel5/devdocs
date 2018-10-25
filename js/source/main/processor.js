"use strict";

// Node modules.
let path = require("path");
let fs = require("fs");

module.exports = function(refs) {
	// Get needed refs.
	let id = refs.id;
	let dirs = refs.dirs;
	let root = refs.root;
	let chalk = refs.chalk;
	let ctags = refs.ctags;
	let debug = refs.debug;
	let print = refs.print;
	let config = refs.config;
	let filter = refs.filter;
	let findup = refs.findup;
	let marked = refs.marked;
	let mdzero = refs.mdzero;
	let cheerio = refs.cheerio;
	let slugify = refs.slugify;
	let entities = refs.entities;
	let modifier = refs.modifier;
	let promises = refs.promises;
	let renderer = refs.renderer;
	let timedate = refs.timedate;
	let versions = refs.versions;
	let dehashify = refs.dehashify;
	let highlight = refs.highlight;
	let cb_orig_text = refs.cb_orig_text;
	let regexp_index = refs.regexp_index;
	let line_highlighter = refs.line_highlighter;
	let add_commas_to_num = refs.add_commas_to_num;
	let removeHtmlComments = refs.removeHtmlComments;
	let string_index_insert = refs.string_index_insert;

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
		config.pversions.push(version);

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
				alias_dir = modifier(
					path.basename(dirname),
					dirname,
					"directory"
				);
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

				// Store file path in object.
				if (!cb_orig_text[fpath]) {
					// If the file path does not exist, add it. Object will
					// contain all original code block text.
					cb_orig_text[fpath] = {};
				}

				// Store the file information.
				__file.dirname = fpath;
				__file.name = file;
				__file.alias = alias_file;
				__file.html = `<div id="parent-menu-file-${counter_dir}.${counter_file}">
			<li class="l-2" id="menu-file-${counter_dir}.${counter_file}" data-dir="${counter_dir}" data-title="${alias_file}">
			<i class="fas fa-caret-right menu-arrow" data-file="${fpath}"></i>
			<div class="l-2-link">
				<a class="link" href="#" data-file="${fpath}">${alias_file}</a>
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
							return reject([
								`${__path} could not be opened.`,
								err
							]);
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
							let timeago_html = `<div id="footer-content-ddwrap"><div class="mtime"><div><span class="label"><i class="fas fa-edit"></i> Last update:</span> <span class="mtime-ts animate-fadein none" data-ts="${mtime}"></span> <span class="long">(${timedate(
								mtime,
								false,
								", "
							)})</span></div></div></div>`;

							// Remove any HTML comments as having comments close to markup
							// causes marked to parse it :/.
							contents = removeHtmlComments(contents).data;

							// Convert the custom tags.
							contents = ctags.convert(contents);

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

										mdzero.vars.blocks.push(match);
										return `[dd::-codeblock-placeholder-${++mdzero
											.vars.count}]\n`;
									} else {
										if (
											/<pre\b(.*?)>\s*<code/.test(match)
										) {
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

											mdzero.vars.blocks.push([
												`<pre><code class="lang-${lang}" data-highlight-lines="" data-block-name="">${highlighted}</code></pre>`
											]);
											return `[dd::-codeblock-placeholder-${++mdzero
												.vars.count}]\n`;
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

											mdzero.vars.blocks.push([
												`<pre><code class="lang-${lang}" data-highlight-lines="" data-block-name="">${highlighted}</code></pre>`
											]);
											return `[dd::-codeblock-placeholder-${++mdzero
												.vars.count}]\n`;
										}
									}
								}
							);

							// Convert the custom tags.
							contents = ctags.unwrap(contents);

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
								data = ctags.expand(data, fpath);

								var r = /\[dd\:\:\-codeblock-placeholder-\d+\]/g;
								var rfn = function(match) {
									return mdzero.vars.blocks[
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
										href = href.replace(
											/^[\.\/]+|\.md$/gi,
											""
										);

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
											.filter(".dd-exp").length;
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
											text.replace(
												/<\/?.*?\>|\&.*?\;/gm,
												""
											)
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
											.filter(".dd-exp").length;
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
									if (
										Object.keys(attrs).length === 1 &&
										href
									) {
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
											$el.after(
												`<div${spacer_class}></div>`
											);
										}
									}
								);

								// Normalize single code blocks (non-group). This
								// will wrap the block to mimic that of grouped
								// blocks to manage all blocks in the same manner.
								$("pre code[class^='lang']").each(
									function(/*i, el*/) {
										// Cache the element.
										let $el = $(this);
										// Get the parent.
										let $parent = $el.parent();

										// Codeblock cannot be part of a group.
										if (
											$el.parents().filter(".cb-group")
												.length
										) {
											// It's part of a group, so skip.
											return;
										}

										// If not part of a group, continue...

										// Replace the parent with the new HTML content.
										$parent.replaceWith(`
									<div class="cb-group" singleton="true">
										<div class="cb-top-ui animate-fadein" data-tabs=""></div>
										<div class="cb-blocks">
											${$.html($parent)}
										</div>
									</div>`);
									}
								);

								// Create group top ID/UI (tabs/action buttons),
								// placeholder, store original text, and add line
								// numbers/highlighted lines/numbers.
								$(".cb-group").each(function(/*i, el*/) {
									// Cache the element.
									let $el = $(this);

									// Generate the id.
									var uid = `${id(15)}`;

									// Set ID.
									$el.attr("id", `cb-group-${uid}`);

									// Get singleton indicator.
									var is_singleton = $el.attr()["singleton"];
									// Remove the attribute.
									$el.removeAttr("singleton");

									// === Create the tabs. ===
									//
									// Get UI wrapper.
									var $ui_wrapper = $el
										.children("[data-tabs]")
										.first();
									// Get the tabs string.
									var tabs_string = $ui_wrapper.attr()[
										"data-tabs"
									];
									// Remove the attr, as it is no longer needed.
									$ui_wrapper.removeAttr("data-tabs");
									var tabs = tabs_string.split(";");
									// Build the tabs HTML.
									var tabs_html = [];
									tabs.forEach(function(tab, i) {
										// Make the first tab be the active tab.
										var is_first =
											i === 0 ? " activetab" : "";

										// If a singleton, add a tab but make is
										// unusable. It is only needed to make the
										// action buttons stick to the right side.
										// Or else they side to the left.
										var disable = is_singleton
											? " pnone "
											: "";

										tabs_html.push(
											`<span class="tab${is_first}${disable}" data-tab-index="${i}" data-gid="${uid}">${tab.trim() ||
												" "}</span>`
										);
									});
									// Add tabs HTML to top UI.
									$ui_wrapper.prepend(
										`<div class="tabs" id="cb-tabs-${uid}">${tabs_html.join(
											""
										)}</div>`
									);

									// === Create the action button(s). ===
									//
									// Create actions HTML and to top UI.
									$ui_wrapper.append(`<div class="actions-right">
									<span class="btn action collapse none" data-gid="${uid}">
										<i class="fas fa-minus-square"></i><span>collapse</span>
									</span>
									<span class="btn action copy" data-gid="${uid}">
										<i class="fas fa-clipboard"></i><span>copy</span>
									</span>
								</div>`);

									// Give IDs to children elements.
									$el
										.find(".cb-top-ui")
										.first()
										.attr("id", `tui-${uid}`);
									$el
										.find(".cb-blocks")
										.first()
										.attr("id", `cbs-${uid}`);

									// === Loop over blocks. ===
									$el
										.find(".cb-blocks")
										.children()
										.each(function(i /*, el*/) {
											// Cache the element.
											let $el = $(this);

											// Give ID to pre element.
											$el.attr("id", `pr-${uid}`);
											$el.attr("data-block-index", i);

											// Get the code block.
											let $block = $el.children().first();

											// Give ID to code element.
											$block.attr("id", `cb-${uid}`);
											$block.attr("data-block-index", i);

											// Hide all but the first code block.
											if (i) {
												$el.addClass("none");
											}

											// Get text (code) and file stats.
											let text = $block.text().trim();
											let line_count = text.split("\n")
												.length;
											let lines = add_commas_to_num(
												line_count
											);
											let chars = add_commas_to_num(
												text.split("").length
											);

											// Get the class name string.
											var cstring =
												" " +
												($block.attr()["class"] || "") +
												" ";
											// Get the language.
											var lang = (cstring.match(
												/ (lang\-.*) /
											) || ["", ""])[1].slice(5);

											// If code is over x lines show placeholder.
											if (line_count >= 40) {
												var placeholder_html = `<div class="codeblock-placeholder animate-fadein none" data-block-index="${i}" data-gid="${uid}">
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
											<span class="label">Show block${
												lang
													? ` <span class="lang">${lang}</span>`
													: ""
											}</span>
											<div class="details">
												<i class="fas fa-code"></i> — ${lines} lines, ${chars} characters
											</div>
										</div>
									</div>
								</div>`;

												// Remove hidden class if it's
												// the first code bock to show
												// the placeholder by default.
												if (!i) {
													placeholder_html = placeholder_html.replace(
														" none",
														""
													);
													// Hide the code block.
													$el.addClass("none");
												}

												// Add the placeholder before the
												// pre element.
												$el.before(placeholder_html);
											}

											// Set the line numbers.

											// Trim the HTML.
											var html = $block.html().trim();
											// Reset the HTML.
											$block.html(html);
											// Get the text.
											text = $block.text();
											// Get the number of lines.
											lines = text.split("\n").length;

											// Get the lines to highlight.
											var hlines = line_highlighter(
												$block
											);

											// Make the "line" highlight HTML.
											var highlighted_numbers = [];
											var highlighted_lines = [];
											for (
												let i = 0, l = lines;
												i < l;
												i++
											) {
												// Check whether the line needs to be highlighted.
												var needs_highlight = hlines.includes(
													i + 1
												);

												// Add the highlighted item to the
												// needed array.

												highlighted_numbers.push(
													`<div class="line"><span${
														needs_highlight
															? " class='highlight-n'"
															: ""
													}>${i + 1}</span></div>`
												);
												highlighted_lines.push(
													`<div class="line${
														needs_highlight
															? " highlight-l"
															: ""
													}"> </div>`
												);
											}

											// Make the block code name HTML.
											var blockname =
												$block.attr()[
													"data-block-name"
												] ||
												"untitled" +
													(lang !== ""
														? "." + lang
														: "");
											var blockname_html = `<div class="codeblock-name">${blockname}</div>`;

											// Add the line numbers HTML.
											$el.prepend(
												// NOTE: Insert a duplicate element to allow the
												// second element to be able to be "fixed". This
												// allows the code element to be properly adjacent
												// to the fixed element. Since the last item will
												// be the longest in width since its the last line
												// number, remove all the other line numbers to reduce
												// the number of elements in the DOM.
												`<div class="line-nums hidden-clone">${highlighted_numbers
													.slice(-1)
													.join(
														""
													)}</div><div class="line-nums lines">${highlighted_lines.join(
													""
												)}</div><div class="line-nums numbers">${blockname_html}${highlighted_numbers.join(
													""
												)}</div>`
											);

											// Get the file path object.
											var obj = cb_orig_text[fpath];
											// If the group Id does not exist,
											// create the containing object.
											if (!obj.hasOwnProperty(uid)) {
												obj[uid] = {};
											}
											// Store block's original content.
											obj[uid][i] = entities.decode(text);
										});
								});

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
									$el.html(
										`[dd::-details-${++details_counter}]`
									);
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
};
