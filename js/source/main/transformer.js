"use strict";

// Node modules.
let fs = require("fs");

module.exports = function(refs) {
	// Get needed refs.
	let chalk = refs.chalk;
	let ctags = refs.ctags;
	let debug = refs.debug;
	let fpath = refs.fpath;
	let print = refs.print;
	let timer = refs.timer;
	let format = refs.format;
	let marked = refs.marked;
	let mdzero = refs.mdzero;
	let __dir = refs.__dir;
	let __file = refs.__file;
	let __path = refs.__path;
	let config = refs.config;
	let cheerio = refs.cheerio;
	let initial = refs.initial;
	let version = refs.version;
	let entities = refs.entities;
	let renderer = refs.renderer;
	let timedate = refs.timedate;
	let highlight = refs.highlight;
	let templates = refs.templates;
	let data_files = refs.data_files;
	let counter_dir = refs.counter_dir;
	let ctransforms = refs.ctransforms;
	let counter_file = refs.counter_file;
	let regexp_index = refs.regexp_index;
	let last_run_time = refs.last_run_time;
	let last_run_file = refs.last_run_file;
	let preplacements = refs.preplacements;
	let remove_html_comments = refs.remove_html_comments;
	let string_index_insert = refs.string_index_insert;

	return function(resolve, reject) {
		// Found headings in the file will be stored in this array.
		let headings = [
			format(templates.headers_count, {
				d1: `${counter_dir}.${counter_file}`,
				d2: counter_dir
			})
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

				// Create start time.
				let startt = timer();

				// Get the timeago modification time.
				var mtime = Math.round(stats.mtimeMs);
				// Build the timeago HTML.
				let timeago_html = format(templates.timeago, {
					d1: mtime,
					d2: timedate(mtime, false, ", ")
				});

				// NOTE: If the file has not been updated since the last
				// devdocs run, use the cached output instead of re-running
				// the transformer on the file again. Check for cached file
				// data.
				if (last_run_file && !initial) {
					// If the last run time is newer than the modified file
					// time get the cached value.
					let dataobject = data_files[version];
					if (mtime < last_run_time && dataobject) {
						// Get the cached file data.
						let dirs = dataobject.dirs;
						// Loop over each directory.
						for (let i = 0, l = dirs.length; i < l; i++) {
							// Cache current loop item.
							let dir = dirs[i];
							let fcontents = dir.contents;
							let files = dir.files;

							// Description...
							for (let j = 0, ll = files.length; j < ll; j++) {
								// Cache current loop item.
								let file = files[j];

								if (file.dirname === fpath) {
									// Store the file information.
									__file.html = file.html;
									__file.headings = file.headings;
									__dir.contents[file.dirname] =
										fcontents[file.dirname];

									if (debug) {
										print.gulp.info(
											"Processed*",
											chalk.magenta(fpath),
											chalk.gray(`(${version})`),
											chalk.green(timer(startt))
										);
									}

									return resolve([
										__path,
										file.contents,
										file.headings
									]);
								}
							}
						}
					}
				}

				// Remove HTML comments as having comments close
				// to markup causes marked to parse them :/.
				contents = remove_html_comments(contents).data;
				// Convert the custom tags.
				contents = ctags.convert(contents);
				// Render markdown.
				contents = mdzero.render(contents);
				// Block-quote fix (encode HTML entities/backticks).
				contents = preplacements({ contents }, "blockquotes");
				// Get any HTML Code blocks (i.e. <pre><code></code></pre>, <code></code>).
				contents = preplacements(
					{
						contents,
						mdzero,
						entities,
						format,
						templates,
						highlight
					},
					"codeblocks"
				);
				// Convert the custom tags.
				contents = ctags.unwrap(contents);

				// Run marked on file contents.
				marked(contents, { renderer }, function(err, data) {
					if (err) {
						return reject([
							`Marked rendering failed for ${__path}.`,
							err
						]);
					}

					// Expand the custom tags.
					data = ctags.expand(data, fpath);

					// Placeholder regexp and replacement function.
					var r = /\[dd\:\:\-codeblock-placeholder-\d+\]/g;
					var rfn = function(match) {
						return mdzero.vars.blocks[
							match.replace(/[^\d]/g, "") * 1
						];
					};
					// Loop contents until all codeblocks have been
					// filled back in.
					while (r.test(data)) {
						// Add back the code blocks.
						data = data.replace(r, rfn);
					}

					// Use cheerio to parse the HTML data.
					// [https://github.com/cheeriojs/cheerio/issues/957]
					var $ = cheerio.load(data, {
						// decodeEntities: false
					});

					// Get the header elements.
					let $headers = $("h1, h2, h3, h4, h5, h6");
					// Extract and store the details elements' HTML.
					let details_lookup = [];
					let details_counter = -1;
					let __headings = {};
					// Extend the current ref object.
					let crefs = Object.assign(refs, {
						details_counter,
						details_lookup,
						__headings,
						headings,
						fpath,
						cheerio: $
					});

					// Grab all anchor elements to
					$("a[href]").each(ctransforms(crefs, "anchor_hrefs"));

					// Add the ignore class to headers that are
					// contained inside a details element.
					$headers
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
					$headers
						.filter(function(/*i, el*/) {
							return !$(this)
								.parents()
								.filter(".dd-exp").length;
						})
						.each(ctransforms(crefs, "octicon_link_header"));

					// Get all headings in the HTML.
					$headers
						.find("a")
						.filter(function(/*i, el*/) {
							return !$(this)
								.parents()
								.filter(".dd-exp").length;
						})
						.each(ctransforms(crefs, "header_html"));
					// Add the closing tag to the headings HTML.
					headings.push("</ul>");

					// Reset all the anchor href.
					$("a[href]").each(ctransforms(crefs, "reset_hrefs"));

					// Combine all the headings HTML and add to them to the
					// file object.
					__file.headings.push(headings.join(""));

					// Reset the headings count.
					__file.html = __file.html.replace(
						/\$0/,
						headings.length - 2
					);

					// Add the header spacer.
					$headers.each(ctransforms(crefs, "header_spacer"));

					// Normalize single code blocks (non-group). This
					// will wrap the block to mimic that of grouped
					// blocks to manage all blocks in the same manner.
					$("pre code[class^='lang']").each(
						ctransforms(crefs, "normalize_cbs")
					);

					// Create group top ID/UI (tabs/action buttons),
					// placeholder, store original text, and add line
					// numbers/highlighted lines/numbers.
					$(".cb-group").each(ctransforms(crefs, "codeblocks"));

					// Remove and placehold the <details> inner HTML.
					$("details").each(ctransforms(crefs, "details"));

					// Finally reset the data to the newly parsed/modified HTML.
					data = $.html().replace(/<\/?(html|body|head)>/gi, "");

					// Wrap the headers with their "contents".
					var indices = [];
					var index = regexp_index(data, /<h[1-6].*?>/i);
					while (index !== -1) {
						indices.push(index);

						index = regexp_index(data, /<h[1-6].*?>/i, index + 1);
					}

					// Create the HTML inserts.
					var inserts = {};
					indices.forEach(function(index, i) {
						let odiv = '<div class="header-content-ddwrap">';
						let cdiv = "</div>";

						// <h1st --> [Start]
						// <h2nd --> [End+Start]
						// <h3rd --> [End+Start]
						// <h4th --> [End+Start] - Find ending tag.
						if (i === 0) {
							// [Start]
							inserts[index] = odiv;
						} else if (i === indices.length - 1) {
							// [End+Start]
							inserts[index] = `${cdiv}${odiv}`;
							inserts[data.length] = cdiv;
						} else {
							// [End+Start] - Find ending tag.
							inserts[index] = `${cdiv}${odiv}`;
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
					data = $.html().replace(/<\/?(html|body|head)>/gi, "");

					// Fill back in the details placeholders.
					var r = /\[dd\:\:\-details-\d+\]/g;
					var rfn = function(match) {
						return details_lookup[match.replace(/[^\d]/g, "") * 1];
					};
					// Loop contents until all details have been filled back in.
					while (r.test(data)) {
						// Add back the code blocks.
						data = data.replace(r, rfn);
					}

					// Finally reset the data to the newly parsed/modified HTML.
					data = `<div class="markdown-body animate-fadein">${data}${timeago_html}</div>`;

					// Add to the object.
					// var _placeholder = config.data.versions.files.user[fpath];
					var _placeholder = __dir.contents[fpath];
					if (_placeholder && _placeholder === -1) {
						// Set the actual contents to the data object.
						__dir.contents[fpath] = data;
						// Store file contents in internal files object.
						config.data.versions.files.user[fpath] = data;
					}

					if (debug) {
						print.gulp.info(
							"Processed",
							chalk.magenta(fpath),
							chalk.gray(`(${version})`),
							chalk.green(timer(startt))
						);
					}

					// Finally, resolve the Promise and return the file path,
					// data, and headings as the data.
					resolve([__path, data, headings]);
				});
			});
		});
	};
};
