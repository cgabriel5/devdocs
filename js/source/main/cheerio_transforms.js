"use strict";

module.exports = function(refs, name) {
	// Get the refs.
	let id = refs.id;
	let $ = refs.cheerio;
	let root = refs.root;
	let fpath = refs.fpath;
	let format = refs.format;
	let slugify = refs.slugify;
	let entities = refs.entities;
	let headings = refs.headings;
	let dehashify = refs.dehashify;
	let templates = refs.templates;
	let __headings = refs.__headings;
	let cb_orig_text = refs.cb_orig_text;
	let details_lookup = refs.details_lookup;
	let details_counter = refs.details_counter;
	let line_highlighter = refs.line_highlighter;
	let add_commas_to_num = refs.add_commas_to_num;

	var fns = {
		anchor_hrefs: function(/*i, elem*/) {
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
			if (name && name.includes(href.replace(/^#/g, ""))) {
				$el.attr("name", dehashify(name));
			}
			let id = attrs.id;
			if (id && id.includes(href.replace(/^#/g, ""))) {
				$el.attr("id", dehashify(id));
			}

			// If an href exists, and it is not an http(s) link or
			// scheme-less URLs, and it ends with .md then we have
			// a link that is another documentation file that needs
			// to be linked to.
			if (
				!(
					href_lower.startsWith("htt") || href_lower.startsWith("//")
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
				$el.attr("data-file-untouched", href_untouched);
				// Set class to denote its a documentation link.
				$el.addClass("link-doc");
			} else {
				// Open all http links in their own tabs by
				// adding the _blank value. Skip hashes.
				if (!href.startsWith("#")) {
					$el.attr("target", "_blank");
				}
			}
		},
		octicon_link_header: function(/*i, el*/) {
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
			let escaped_text = slugify(text.replace(/<\/?.*?\>|\&.*?\;/gm, ""));

			$el.attr("data-orig-text", entities.encode(text));
			// Use font-awesome over GitHub octicon-link.
			$el.append(
				format(templates.anchor_link, {
					d1: html,
					d2: escaped_text
				})
			);
		},
		header_html: function(/*i, el*/) {
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
			otext = otext.replace(/<\/?.*?\>|\&.*?\;/gm, function(match) {
				// Only allow emojis to pass.
				if (!match.startsWith('<img class="emoji"')) {
					// Remove tags.
					return match.replace(/<\/?.*?\>|\&.*?\;/gm, "");
				}

				return match;
			});

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
				$el.attr("id", `${id}-${heading_count}`);
				$el.attr("href", `${$el.attr().href}-${heading_count}`);

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
		},
		reset_hrefs: function(/*i, el*/) {
			// Cache the element.
			let $el = $(this);

			// Get the attributes.
			let attrs = $el.attr();

			// Get the element id.
			let href = attrs.href;

			// Only work on hrefs starting with "#".
			if (href.startsWith("#")) {
				href = href.replace(/\#/g, "");

				$el.attr("href", "#" + dehashify(href, true));
			}

			// Add the "link-heading" class only when the href
			// attribute is the only attribute.
			if (Object.keys(attrs).length === 1 && href) {
				$el.addClass("link-heading");
			}
		},
		header_spacer: function(/*i, el*/) {
			// Cache the element.
			let $el = $(this);

			// Get the next element.
			var $next = $el.next()[0];
			if ($next) {
				// Don't add the spacer class if the header group
				// is empty. (no siblings.)
				var spacer_class = !/h[1-6]/i.test($next.name)
					? " class='header-spacer'"
					: "";
				$el.after(`<div${spacer_class}></div>`);
			}
		},
		normalize_cbs: function(/*i, el*/) {
			// Cache the element.
			let $el = $(this);
			// Get the parent.
			let $parent = $el.parent();

			// Codeblock cannot be part of a group.
			if ($el.parents().filter(".cb-group").length) {
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
		},
		codeblocks: function(/*i, el*/) {
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
			var $ui_wrapper = $el.children("[data-tabs]").first();
			// Get the tabs string.
			var tabs_string = $ui_wrapper.attr()["data-tabs"];
			// Remove the attr, as it is no longer needed.
			$ui_wrapper.removeAttr("data-tabs");
			var tabs = tabs_string.split(";");
			// Build the tabs HTML.
			var tabs_html = [];
			tabs.forEach(function(tab, i) {
				// Make the first tab be the active tab.
				var is_first = i === 0 ? " activetab" : "";

				// If a singleton, add a tab but make is
				// unusable. It is only needed to make the
				// action buttons stick to the right side.
				// Or else they side to the left.
				var disable = is_singleton ? " pnone " : "";

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
					let line_count = text.split("\n").length;
					let lines = add_commas_to_num(line_count);
					let chars = add_commas_to_num(text.split("").length);

					// Get the class name string.
					var cstring = " " + ($block.attr()["class"] || "") + " ";
					// Get the language.
					var lang = (cstring.match(/ (lang\-.*) /) || [
						"",
						""
					])[1].slice(5);

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
						lang ? ` <span class="lang">${lang}</span>` : ""
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
					var hlines = line_highlighter($block);

					// Make the "line" highlight HTML.
					var highlighted_numbers = [];
					var highlighted_lines = [];
					for (let i = 0, l = lines; i < l; i++) {
						// Check whether the line needs to be highlighted.
						var needs_highlight = hlines.includes(i + 1);

						// Add the highlighted item to the
						// needed array.

						highlighted_numbers.push(
							`<div class="line"><span${
								needs_highlight ? " class='highlight-n'" : ""
							}>${i + 1}</span></div>`
						);
						highlighted_lines.push(
							`<div class="line${
								needs_highlight ? " highlight-l" : ""
							}"> </div>`
						);
					}

					// Make the block code name HTML.
					var blockname =
						$block.attr()["data-block-name"] ||
						"untitled" + (lang !== "" ? "." + lang : "");
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
		},
		details: function(/*i, el*/) {
			// Cache the element.
			let $el = $(this);

			// Store the HTML.
			details_lookup.push($el.html());

			// Reset the HTML.
			$el.html(`[dd::-details-${++details_counter}]`);
		}
	};

	// Return the needed function.
	return fns[name];
};
