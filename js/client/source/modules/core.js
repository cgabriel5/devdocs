/*jshint bitwise: false*/
/*jshint browser: true*/
/*jshint esversion: 6 */
/*jshint node: false*/
/*jshint -W014 */
/*jshint -W018 */
/*jshint maxerr: 10000 */

"use strict";

app.module(
	"core",
	function(modules, name) {
		// Imports.
		let globals = modules.globals;
		var SETGLOBAL = globals.SETGLOBAL;
		var GETGLOBAL = globals.GETGLOBAL;
		// Contain all the sidebar submenu heights.
		var heights = GETGLOBAL("heights");
		// Contain all content headers.
		var headers = GETGLOBAL("headers");

		let utils = modules.utils;
		let $sroot = utils.$sroot;
		let request_aframe = utils.request_aframe;
		let animate = utils.animate;
		let is_target_el = utils.is_target_el;
		let max_y_scroll_position = utils.max_y_scroll_position;
		let is_mobile_viewport = utils.is_mobile_viewport;
		let is_mobile = utils.is_mobile;
		let stylesheet = utils.stylesheet;
		let coors = utils.coors;
		let is_event_support = utils.is_event_support;
		let is_in_view = utils.is_in_view;
		let classes = utils.classes;

		let $$ = modules.$$;
		let $loadertop = $$.$loadertop;
		let $topbar = $$.$topbar;
		let $sidebar = $$.$sidebar;
		let $markdown = $$.$markdown;
		let $soverlay = $$.$soverlay;
		let $moverlay = $$.$moverlay;
		let $crumbs = $$.$crumbs;
		let $crumbs_file = $$.$crumbs_file;
		let $crumbs_sep = $$.$crumbs_sep;
		let $tb_loader = $$.$tb_loader;
		let $search = $$.$search;
		let $sb_menu = $$.$sb_menu;
		let $sb_footer = $$.$sb_footer;

		// ---------------------------------------------------------------------

		/**
		 * Generatet the CSS loader HTML.
		 *
		 * @param  {number} size - Loader dimensions.
		 * @param  {boolean} light - Use light over or dark loader.
		 * @return {string} - The CSS loader HTML string.
		 */
		function cssloader(size, light) {
			return `<div class="mloader${
				light ? "-white" : ""
			} animate-spin" style="margin-right:4px;min-width:${size}px;min-height:${size}px;"></div>`;
		}

		/**
		 * Show the topbar loader.
		 *
		 * @return {undefined} - Nothing.
		 */
		function show_tb_loader() {
			// Show the topbar loader.
			classes($loadertop, "!none");

			// Show the main overlay.
			classes($moverlay, "!none");

			// Show the topbar loader.
			$tb_loader.innerHTML = cssloader(15);
			classes($tb_loader, "!none");
		}

		/**
		 * Hide the topbar loader.
		 *
		 * @return {undefined} - Nothing.
		 */
		function hide_tb_loader(type) {
			// Show the topbar loader.
			classes($loadertop, "none");

			// Show the main overlay.
			classes($moverlay, "none");

			// Hide the topbar loader.
			classes($tb_loader, "!add");
			$tb_loader.innerHTML = "";
		}

		/**
		 * Show the sidebar menu item loader.
		 *
		 * @param  {htmlelement} $el - The sidebar element to inject
		 *     the loader into.
		 * @return {undefined} - Nothing.
		 */
		function show_loader($el) {
			// Skip logic if no sidebar menu element is provided.
			if (!$el) {
				return;
			}

			// Hide the previous sb filename loader.
			if (GETGLOBAL("sb_active_el_loader")) {
				hide_loader(GETGLOBAL("sb_active_el_loader"), true);
			}

			// Show the topbar loader.
			show_tb_loader();

			// Get the arrow icon element.
			var $arrow = $el.getElementsByClassName("menu-arrow")[0];

			// Hide the arrow element.
			classes($arrow, "none");
			// Show the sidebar loader next to filename.
			$arrow.insertAdjacentHTML("afterend", cssloader(10, true));

			// Set the flag.
			SETGLOBAL("sb_active_el_loader", $el);
		}

		/**
		 * Hide the sidebar menu item loader.
		 *
		 * @param  {htmlelement} $el - The sidebar element to remove
		 *     the loader from.
		 * @param  {boolean} skip - Flag indicating whether to remove
		 *     the previous loader.
		 * @return {undefined} - Nothing.
		 */
		function hide_loader($el, skip) {
			// Skip logic if no sidebar menu element is provided.
			if (!$el) {
				return;
			}

			// Get the loader element.
			var $mloader = $el.getElementsByClassName("mloader-white")[0];

			// In the case there is an active mloader, remove it.
			// This might happen when clicking many sidebar menu
			// elements in rapid succession. Leading to un-removed
			// loaders.
			if (!skip) {
				hide_tb_loader(22);

				// Reset the flag.
				SETGLOBAL("sb_active_el_loader", null);
			}

			// Remove the loader.
			$el.removeChild($mloader);
			// Show the arrow element.
			classes($el.getElementsByClassName("menu-arrow")[0], "!none");
		}

		/**
		 * Scroll to header.
		 *
		 * @return {undefined} - Nothing.
		 */
		var scroll = function($el, callback, check_stickyheader) {
			// Remove any expanders.
			remove_expanders();
			// Set flag to prevent any mousemove.
			GETGLOBAL("prevent_mousemove_expanders", true);

			// Calculate the to y scroll offset position.
			var to = scroll.offset($el);
			var from = window.pageYOffset;

			// Flags.
			var update_check_stickyheader;

			// // Store the scroll position to allow for the cancellation
			// // of the animation when any manual scrolling is done.
			// var lastpos = null;

			// Cancel any current header scrolling animation.
			if (scroll.animation) {
				scroll.animation.cancel(function() {
					// Remove event listeners.
					scroll.remove_handlers();
				});
				scroll.animation = null;
			}

			// Add event handlers to be able to cancel the scrolling.
			document.addEventListener("touchmove", scroll.animation_handler, {
				passive: false
			});
			document.addEventListener("wheel", scroll.animation_handler, false);
			document.addEventListener(
				"keydown",
				scroll.animation_handler,
				false
			);

			// Scroll to the header.
			scroll.animation = animate({
				from: from,
				to: to,
				duration: scroll_duration(to),
				onSkip: function() {
					var $de = document.documentElement;
					if (
						// When the page is not scrollable
						// (no overflow), skip to immediately invoke
						// the callback.
						$de.scrollHeight === $de.clientHeight ||
						// Skip if the from/to is the same position.
						Math.floor(to) === Math.floor(from) ||
						Math.abs(to - from) <= 1
					) {
						return true;
					}
				},
				onProgress: function(val, meta) {
					// // Round the value to make canceling the scroll
					// // possible.
					// val = Math.floor(val);

					// // Cancel scroll when manually scrolling.
					// // [https://github.com/madebysource/animated-scrollto#animated-scrollto]
					// if (lastpos) {
					// 	if (Math.abs(lastpos - $sroot.scrollTop) <= 1) {
					// 		lastpos = val;
					// 		// Continue to set scroll position...
					// 	} else {
					// 		// Cancel scrolling.
					// 		scroll.animation.cancel();
					// 		// Return false to not run the callback.
					// 		return false;
					// 	}
					// } else {
					// 	lastpos = val;
					// 	// Continue to set scroll position...
					// }

					// Set the scrolltop value.
					// $sroot.scrollTop = val;

					// Edge case: when scrolling to bottom
					// cancel scrolling once the value exceeds
					// that of the scrollable height. Or else
					// the animation will take longer to end.
					// Causing a sense of lag.
					// if (
					// 	// When scrolling down and percent scrolled
					// 	// is >= 100 stop animation.
					// 	Math.round(percent_scrolled()) >= 100 &&
					// 	Math.sign(meta.from - meta.to) === -1
					// ) {
					// 	// Scroll to the bottom of the page.
					// 	scroll_to_bottom();

					// 	return true;
					// }

					// Reset the to var if the check for sticky header is set.
					if (check_stickyheader && !update_check_stickyheader) {
						// Note**: Switch to non hard-coded values later.

						// If there is a current sticky header...
						if (
							/h\d/i.test(
								document.elementFromPoint(0, 44).tagName
							) &&
							/h\d/i.test(
								document.elementFromPoint(0, 85).tagName
							)
						) {
							// Set the flag.
							update_check_stickyheader = true;

							// Reset the to value.
							meta.to = meta.to - 40;
						}
					}

					// Set the scrolltop value.
					$sroot.scrollTop = val;
				},
				onComplete: function() {
					// Reset the expander flag.
					GETGLOBAL("prevent_mousemove_expanders", null);

					// Remove event listeners.
					scroll.remove_handlers();

					// Reset the variable.
					scroll.animation = null;

					// Run the callback.
					callback();
				}
			});
		};
		// Track any ongoing scrolling animation.
		scroll.animation = null;
		// Calculate scroll offset for mobile and desktop views.
		scroll.offset = function($el) {
			// Calculate the to y scroll position.
			var offset = is_mobile_viewport()
				? // For "mobile" size.
					coors($el.nextElementSibling).pageY -
					($topbar.clientHeight + $el.clientHeight)
				: // Desktop size.
					coors($el).pageY;

			// Get the maximum Y page scroll position.
			var max_y_scroll_pos = max_y_scroll_position();

			// If the offset is more than the max page y scroll
			// position, reset it
			if (offset > max_y_scroll_pos) {
				offset = max_y_scroll_pos;
			}

			// Make offset dependent on whether in a mobile/desktop view.
			offset = offset - (is_mobile_viewport() ? 10 : 5);

			return offset;
		};
		scroll.animation_handler = function(e) {
			// Cancel event if no animation is ongoing.
			if (!scroll.animation) {
				return;
			}

			// Keys can also be used: up/down/space-bar/esc keys will
			// cancel the animation.
			if (e.type === "keydown" && ![38, 40, 32, 27].includes(e.which)) {
				return;
			}

			// If a scrolling animation is ongoing cancel the scrolling.

			// Cancel any current header scrolling animation.
			scroll.animation.cancel(function() {
				scroll.remove_handlers();
			});
			scroll.animation = null;

			e.preventDefault();
			e.stopPropagation();
		};
		scroll.remove_handlers = function() {
			// [https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener]

			document.removeEventListener(
				"touchmove",
				scroll.animation_handler,
				false
			);
			document.removeEventListener(
				"wheel",
				scroll.animation_handler,
				false
			);
			document.removeEventListener(
				"keydown",
				scroll.animation_handler,
				false
			);
		};

		/**
		 * Get the height of a submenu using a virtual element.
		 *
		 * @return {undefined} - Nothing.
		 */
		var get_headers = function() {
			// Empty the headers object.
			for (var key in headers) {
				if (headers.hasOwnProperty(key)) {
					delete headers[key];
				}
			}

			// Get the markdown element's first child.
			var $md_content = $markdown.getElementsByClassName(
				"markdown-body"
			)[0];

			// If the child does not exist, return.
			if (!$md_content) {
				return;
			}

			// Take that into account the markdown body top margin.
			var offset =
				getComputedStyle($md_content, null).marginTop.replace(
					"px",
					""
				) * 1;

			// Get the headers.
			var $headers = document.querySelectorAll("h1,h2,h3,h4,h5,h6");
			// Store the headers top offset positions.
			var list = [];

			// Loop over the headers to get the top offset positions.
			for (var i = 0, l = $headers.length; i < l; i++) {
				// Get the header.
				var $header = $headers[i];

				// Skip if empty (no children).
				if (!$header.childElementCount) {
					continue;
				}

				// Get the top offset position.
				var pos = Math.floor($header.offsetTop - offset - 6);

				// Concept: [http://jsbin.com/filopozege/edit?html,css,output]

				// Store the header offset.
				list.push(pos);
				headers[pos] = $header;
			}

			// Store the list.
			headers.list = list;
		};

		/**
		 * Using provided hash, determine the correct header element.
		 *
		 * @param  {string} href - The href's hash.
		 * @return {htmlelement} - The header element.
		 */
		var get_header = function(href) {
			var hhref = href.slice(1);

			// [https://stackoverflow.com/a/35681683]
			// First look for a header element with the href as the id.
			var $header = document.querySelector(
				`h1[id='${hhref}'],h2[id='${hhref}'],h3[id='${hhref}'],h4[id='${hhref}'],h5[id='${hhref}'],h6[id='${hhref}']`
			);

			// If a header was not found, look for an anchor element
			// with the href as the name attr.
			if (!$header) {
				$header = document.querySelector(`a[name='${hhref}']`);

				// If nothing is found skip all together.
				if (!$header) {
					return;
				}

				// If the header is a child of a <details> element,
				// expand the <details> element before anything.
				var $details = is_target_el($header, null, function($p) {
					// Get the <details> element.
					if ($p.tagName === "DETAILS") {
						return $p;
					}
				});
				// If a <details> element exists, try and open it.
				if ($details && !$details.open) {
					// Get the <summary> child element.
					var $summary = $details.getElementsByTagName("summary")[0];
					// If there exists a child <summary> element, open
					// the <details> element.
					if ($summary) {
						$summary.click();
					}
				}

				var $parent = $header.parentNode;
				// If the parent is a header return that.
				if (/h\d/i.test($parent.tagName.toLowerCase())) {
					return $parent;
				}

				var $wrapper = is_target_el($header, "header-content-ddwrap");
				if ($wrapper) {
					var $next = $wrapper.nextElementSibling;
					if ($next) {
						var $fchild = $next.firstChild;
						if (/h\d/i.test($fchild.tagName.toLowerCase())) {
							return $fchild;
						}
					}
				}

				// If the anchor exists, we need to reset
				// the var to get the actual header element.
				$header = $header.parentNode.nextElementSibling;
			}

			// Return the header.
			return $header;
		};

		/**
		 * Reset the width's of the code blocks to maintain a complete
		 *     "100%" width line-highlight.
		 *
		 * @return {undefined} - Nothing.
		 */
		var reset_cblock_width_highlight = function() {
			// Get the code blocks.
			var $blocks = document.querySelectorAll("pre code[class^='lang']");

			// Loop over blocks...
			for (var i = 0, l = $blocks.length; i < l; i++) {
				let $block = $blocks[i];
				let $parent = $blocks[i].parentNode;
				let $third = $parent.querySelectorAll(".line-nums.lines")[0];

				// Reset the width to get the correct width;
				$third.style.width = "auto";

				// If the parent is scrollable, horizontally, reset
				// the width styling.
				if ($parent.scrollWidth > $parent.clientWidth) {
					$third.style.width = `${$parent.scrollWidth}px`;
					$block.style.width = `auto`;
				} else {
					// Else, remove any styling.
					$third.removeAttribute("style");
					$block.removeAttribute("style");
				}
			}
		};

		/**
		 * Set the sticky positions for the sidebar menu items.
		 *
		 * @resource [https://davidwalsh.name/add-rules-stylesheets]
		 */
		var inject_sidebar_tops_css = function() {
			// Remove the needed stylesheets.
			stylesheet.remove(function($sheet, contents) {
				// Check if the contents contains the title.
				return contents.includes(`/*title:dd/sidebar-sticky-tops-`);
			});

			// Get the search container height.
			var height = Math.floor(coors($search).height); // - 1;
			if (height >= 79) {
				height = 78;
			}

			// CSS definitions.
			var definitions = [
				`.l-2 {top: ${height}px;}`,
				`@media (max-width: 1024px) {.l-2 {top: ${height}px;}}`
			];

			// Create the stylesheet.
			stylesheet(definitions.join(""), "dd/sidebar-sticky-tops-desktop");

			// Reset the definitions if on a mobile device.
			if (is_mobile()) {
				// Viewport >= 1024px.
				if (window.matchMedia("(min-width: 1024px)").matches) {
					if (
						!stylesheet.get(function($sheet, contents) {
							// Check if the contents contains the title.
							return contents.includes(
								"/*title:dd/sidebar-sticky-tops-mobile-n1024*/"
							);
						})
					) {
						// Create the stylesheet.
						stylesheet(
							`.l-2 {top: ${height}px;}`,
							"dd/sidebar-sticky-tops-mobile-n1024"
						);
					}
				} else {
					if (
						!stylesheet.get(function($sheet, contents) {
							// Check if the contents contains the title.
							return contents.includes(
								"/*title:dd/sidebar-sticky-tops-mobile-n1024*/"
							);
						})
					) {
						// Create the stylesheet.
						stylesheet(
							`@media (max-width: 1024px) {.l-2 {top: ${height}px;}}`,
							"dd/sidebar-sticky-tops-mobile-1024"
						);
					}
				}
			}
		};

		/**
		 * Get the height of a submenu using a virtual element.
		 *
		 * @param {HTMLElement} $new_current - The newly clicked
		 *     menu directory element.
		 * @param {string} filename - The file name.
		 * @return {string} - The submenu height with 'px' unit.
		 */
		function get_height($new_current, filename) {
			// Don't recalculate if previously calculated.
			if (heights.hasOwnProperty(filename)) {
				return heights[filename];
			}

			// Create a virtual clone of the element.
			var $clone = $new_current.nextElementSibling.cloneNode(true);
			// Set the height to its normal height.
			$clone.style.height = "auto";

			// Get the height using a virtual dom.
			var html = `<div id="virtual-height-element">${
				$clone.outerHTML
			}</div>`;

			// Inject the clone to the DOM.
			document.body.insertAdjacentHTML("afterbegin", html);

			// Get the virtual element.
			var $vel = document.getElementById("virtual-height-element");

			// Calculate the element height.
			var height = getComputedStyle($vel, null).height;

			// Remove the virtual element.
			$vel.parentNode.removeChild($vel);

			// Finally, store the height for future runs.
			heights[filename] = height;

			return height;
		}

		/**
		 * Replace the HTML file content.
		 *
		 * @param  {string} content - The HTML file content.
		 * @return {undefined} - Nothing.
		 */
		function replace_html(content) {
			// [https://ianopolous.github.io/javascript/innerHTML]
			// var $clone = $markdown.cloneNode(false);
			// $clone.innerHTML = content;
			// $markdown.parentNode.replaceChild($clone, $markdown);
			$markdown.innerHTML = content;

			// Re-grab the markdown element.
			// $markdown = document.getElementById("markdown");

			setTimeout(function() {
				get_headers();
			}, 1500);
		}

		/**
		 * Inject the file name in the topbar. Only for mobile view.
		 *
		 * @param {string} filename - The file name.
		 * @param {object} data - The server data object.
		 * @return {undefined} - Nothing.
		 */
		function inject_filename(filename, data) {
			// If there is not current file name return.
			if (!filename) {
				return;
			}

			// Loop over the data dirs to get the file alias.
			var dirs = GETGLOBAL("DIRS")[0].files;
			for (var i = 0, l = dirs.length; i < l; i++) {
				if (dirs[i].dirname === filename) {
					filename = dirs[i].alias;
					break;
				}
			}

			// Hide crumbs element.
			classes($crumbs, "none", "!animate-fadein");
			// If a file name exists, set it.
			if (filename) {
				classes($crumbs_sep, "!none");
				classes($crumbs_file, "!none");
				$crumbs_file.textContent = filename;
			} else {
				// Else, hide the element.
				classes($crumbs_file, "none");
			}
			// Show crumb element.
			setTimeout(function() {
				classes($crumbs, "animate-fadein", "!none");
			}, 0);
		}

		/**
		 * Inject the data HTML to the page.
		 *
		 * @param {string} filename - The file name.
		 * @param {HTMLElement} $new_current - The newly clicked
		 *     menu directory element.
		 * @return {undefined} - Nothing.
		 */
		function inject(filename, $new_current) {
			// Don't inject the same file content when the menu
			// item is clicked again.
			if (filename === GETGLOBAL("current_file")) {
				// Get the hash.
				let hash = location.hash;

				// Scroll to hash.
				if (hash) {
					// Get the header element.
					let $parent = get_header(hash);

					if ($parent) {
						// Remove the class to make sure the highlight
						// works.
						classes($parent, "!animate-header-highlight");
						// Scroll to the position. Don't use an animation
						// as alt + (<-- or -->) needs to be done and
						// felt very quick.
						setTimeout(function() {
							// Instantly scroll to position.
							$sroot.scrollTop = scroll.offset($parent);

							classes($parent, "animate-header-highlight");
						}, 0);
					}
				}

				hide_tb_loader(11);
				// show_loader($new_current);

				// Cancel any current sidebar menu scroll.
				if (GETGLOBAL("sidebar_menu_scroll")) {
					GETGLOBAL("sidebar_menu_scroll").cancel();
				}

				// If a sidebar menu item does not exist, or if a
				// sidebar menu item exists but a UL element does
				// not exist return to skip animation.
				if (!$new_current || !$new_current.nextElementSibling) {
					return;
				}

				// Scroll to the menu item.
				GETGLOBAL(
					"sidebar_menu_scroll",
					animate({
						from: $sidebar.scrollTop,
						to: $new_current.offsetTop + 10,
						duration: 700,
						onSkip: function() {
							// Get visibility information.
							var inview = is_in_view(
								$sidebar,
								$new_current,
								function(vals) {
									// Reset needed values.
									vals.ctop =
										vals.ctop + $search.clientHeight;
									// Return the modified object.
									return vals;
								}
							);

							// The sidebar menu element must be
							// completely visible and within
							// levels 1-3 to skip the animation.
							if (inview.complete && inview.level <= 3) {
								return true;
							}
						},
						onProgress: function(val) {
							$sidebar.scrollTop = val;
						},
						onComplete: function() {
							// Reset the var.
							SETGLOBAL("sidebar_menu_scroll", null);
						}
					})
				);

				return;
			}

			// Disable mouse events.
			classes($markdown, "pnone");

			show_loader($new_current);

			// Add the loading content class.
			classes($markdown, "loading-content");

			// Default to the first file when one does not exist.
			if (!GETGLOBAL("current_file")) {
				SETGLOBAL("current_file", GETGLOBAL("FIRST_FILE"));
			}

			// Get the file content.
			var file = GETGLOBAL("USER_FILES")[filename];

			// Show 404 file when selected file does not exist.
			if (!file) {
				var error_404 = "_404";
				file = GETGLOBAL("INTERNAL_FILES")[error_404];
				filename = error_404;
			}

			// Un-highlight/Highlight:

			// Un-highlight the current highlighted menu element.
			var $current = document.querySelector(
				`[data-file="${GETGLOBAL("current_file")}"]`
			);
			if ($current) {
				let $parent = $current.parentNode;
				// Remove the highlight.
				classes($parent, "!active-page");

				var id = $parent.id.replace(/[a-z\-]/g, "");
				var $ul = document.getElementById(`menu-headers-${id}`);

				// If no UL list exist then skip the animation.
				if ($ul) {
					// // Reset the stying to hide the scrollbar.
					// classes($ul, "!file-headers-active");

					// Animate menu height closing.
					animate({
						// delay: 30,
						from:
							getComputedStyle($ul).height.replace("px", "") * 1,
						to: 0,
						duration: 350,
						onSkip: function() {
							if (!$ul) {
								return true;
							}
						},
						onProgress: function(val) {
							$ul.style.height = `${val}px`;
						},
						onComplete: function() {
							// Get the directory id the submenu menu
							// element belongs to.
							var dui = id.split(".")[0] * 1 - 1;
							// Get the submenu menu using the
							// directory id.
							var $ulp = document
								.querySelector(
									`.menu-section[data-dir='${dui}']`
								)
								.getElementsByClassName("submenu-ul")[0];

							// Remove the UL (link headers) if they
							// exist and the UL is part of the its
							// parent directory.
							if ($ul && $ulp.contains($ul)) {
								// $ulp.removeChild($ul);
								document
									.getElementById(`parent-menu-file-${id}`)
									.removeChild($ul);
							}
						}
					});
				}

				// Un-highlight menu arrow and reset to right position.
				classes(
					$parent.getElementsByClassName("menu-arrow")[0],
					"!menu-arrow-active",
					"!fa-caret-down",
					"fa-caret-right"
				);
			}

			// Set the new highlight for the new current element.
			if (!$new_current && filename !== "_404") {
				$new_current = document.querySelector(
					`[data-file="${filename}"]`
				).parentNode;
			}
			if (filename !== "_404") {
				// Get the menu arrow element and its CSS classes.
				let $menu_arrow = $new_current.getElementsByClassName(
					"menu-arrow"
				)[0];

				// Change text color to blue.
				classes($new_current, "active-page");
				// Change the menu arrow to be active (blue/down).
				classes(
					$menu_arrow,
					"menu-arrow-active",
					"!fa-caret-right",
					"fa-caret-down"
				);

				// Animate menu height opening.
				if (GETGLOBAL("menu_anim_timer")) {
					clearTimeout(GETGLOBAL("menu_anim_timer"));
				}
				SETGLOBAL(
					"menu_anim_timer",
					setTimeout(function() {
						var id = $new_current.id.replace(/[a-z\-]/g, "");
						var $ul = document.getElementById(`menu-headers-${id}`);

						if (!$ul) {
							// Embed the current sub-menu list.
							var dirs = GETGLOBAL("DIRS")[
								id.split(".")[0] * 1 - 1
							].files;
							for (var i = 0, l = dirs.length; i < l; i++) {
								var dir = dirs[i];
								if (dir.dirname === filename) {
									// Get the sub menu HTML and embed.
									$new_current.insertAdjacentHTML(
										"afterend",
										dir.headings
									);

									$ul = document.getElementById(
										`menu-headers-${id}`
									);
									break;
								}
							}
						}

						if (!$ul) {
							return;
						}

						// Calculate the UL elements height.
						var height =
							get_height($new_current, filename).replace(
								"px",
								""
							) * 1;

						// // Determine whether the UL element's height will
						// // need to be capped at 350px.
						// var _max_height = height > 350;
						// if (_max_height) {
						// 	height = 350;
						// }

						animate({
							from: 0,
							to: height,
							duration: 400,
							onProgress: function(val) {
								$ul.style.height = `${val}px`;
							},
							onComplete: function() {
								// if (_max_height) {
								// 	// Reset the stying to hide the scrollbar.
								// 	classes($ul, "file-headers-active");
								// }

								// Cancel any current sidebar menu scroll.
								if (GETGLOBAL("sidebar_menu_scroll")) {
									GETGLOBAL("sidebar_menu_scroll").cancel();
								}

								// If a sidebar menu item does not exist,
								// or if a sidebar menu item exists but
								// a UL element does not exist return to
								// skip animation.
								if (
									!$new_current ||
									!$new_current.nextElementSibling
								) {
									return;
								}

								// Scroll to the menu item.
								SETGLOBAL(
									"sidebar_menu_scroll",
									animate({
										from: $sidebar.scrollTop,
										to: $new_current.offsetTop + 10,
										duration: 700,
										onSkip: function() {
											// Get visibility information.
											var inview = is_in_view(
												$sidebar,
												$new_current,
												function(vals) {
													// Reset needed values.
													vals.ctop =
														vals.ctop +
														$search.clientHeight;
													// Return the modified object.
													return vals;
												}
											);

											// The sidebar menu element must be
											// completely visible and within
											// levels 1-3 to skip the animation.
											if (
												inview.complete &&
												inview.level <= 3
											) {
												return true;
											}
										},
										onProgress: function(val) {
											$sidebar.scrollTop = val;
										},
										onComplete: function() {
											// Reset the var.
											SETGLOBAL(
												"sidebar_menu_scroll",
												null
											);

											$ul.style.opacity = 1;

											// Inject the html.
											replace_html(file);

											// Show the current filename.
											inject_filename(
												GETGLOBAL("current_file"),
												GETGLOBAL("DATA")
											);

											// Get the hash.
											let hash = location.hash;

											// Scroll to hash.
											if (hash) {
												// Get the header element.
												var $parent = get_header(hash);

												if ($parent) {
													// Remove the class to make sure the highlight
													// works.
													classes(
														$parent,
														"!animate-header-highlight"
													);

													// Let browser know to optimize scrolling.
													perf_hint(
														$sroot,
														"scroll-position"
													);

													// Use a timeout to let the injected HTML load
													// and parse properly. Otherwise, getBoundingClientRect
													// will return incorrect values.
													setTimeout(function() {
														// Scroll to the header.
														scroll(
															$parent,
															function() {
																// console.log("C");

																classes(
																	$parent,
																	"animate-header-highlight"
																);

																// Remove optimization.
																perf_unhint(
																	$sroot
																);
															}
														);
													}, 300);
												}
											}
										}
									})
								);
							}
						});
					}, 225)
				);
			} else {
				// 404 File.

				// Inject the html.
				replace_html(file);

				// Show the current filename.
				inject_filename(GETGLOBAL("current_file"), GETGLOBAL("DATA"));

				// Get the hash.
				let hash = location.hash;

				// Scroll to hash.
				if (hash) {
					// Get the header element.
					var $parent = get_header(hash);

					if ($parent) {
						// Remove the class to make sure the highlight
						// works.
						classes($parent, "!animate-header-highlight");

						// Let browser know to optimize scrolling.
						perf_hint($sroot, "scroll-position");

						// Use a timeout to let the injected HTML load
						// and parse properly. Otherwise, getBoundingClientRect
						// will return incorrect values.
						setTimeout(function() {
							// Scroll to the header.
							scroll($parent, function() {
								// console.log("D");

								classes($parent, "animate-header-highlight");

								// Remove optimization.
								perf_unhint($sroot);
							});
						}, 300);
					}
				}
			}

			// Reset the active element.
			SETGLOBAL("current_file", filename);
		}

		/**
		 * Make and insert the bottom navigation UI elements.
		 *
		 * @return {undefined} - Nothing.
		 */
		function bottom_nav() {
			// Get the current active sidebar menu item.
			var $active = document.getElementsByClassName("active-page")[0];

			// If no active page element skip function logic.
			if (!$active) {
				return;
			}

			var id = $active.getAttribute("data-dir") * 1;
			var $parent = $active.parentNode;

			// Check for the prev sidebar sibling.
			var $prev_el;
			var prev_html = "";

			// Get the prev sidebar element.
			var $prev_par = $parent.previousElementSibling;

			// If the parent element exists get the first child.
			if ($prev_par) {
				$prev_el = $parent.previousElementSibling.firstChild;
			} else {
				// If the prev element does not exist check for a prev dir element.
				$prev_par = document.getElementById(
					"submenu-inner-" + (id - 1)
				);
				if ($prev_par) {
					$prev_el = $prev_par.lastChild.firstChild;
				}
			}

			// If a prev element exists, build the HTML.
			if ($prev_el) {
				prev_html = `<div class="arrow aleft btn" data-refid="${
					$prev_el.id
				}"><i class="fas fa-arrow-alt-circle-left"></i> <span>${$prev_el.getAttribute(
					"data-title"
				)}</span></div>`;
			}

			// Check for the next sidebar sibling.
			var $next_el;
			var next_html = "";

			// Get the next sidebar element.
			var $next_par = $parent.nextElementSibling;

			// If the parent element exists get the first child.
			if ($next_par) {
				$next_el = $parent.nextElementSibling.firstChild;
			} else {
				// If the next element does not exist check for a next dir element.
				$next_par = document.getElementById(
					"submenu-inner-" + (id + 1)
				);
				if ($next_par) {
					$next_el = $next_par.lastChild.firstChild;
				}
			}

			// If a next element exists, build the HTML.
			if ($next_el) {
				next_html = `<div class="arrow aright btn" data-refid="${
					$next_el.id
				}"><span>${$next_el.getAttribute(
					"data-title"
				)}</span><i class="fas fa-arrow-alt-circle-right"></i></div>`;
			}

			// Make the HTML and return it.
			var html =
				prev_html || next_html
					? `<div class="arrownav">${prev_html}${next_html}</div>`
					: "";

			// Everything will get inserted inside the footer
			// content ddwrap element.
			var $footer_ddwrap = document.getElementById(
				"footer-content-ddwrap"
			);

			// Get the footer HTML.
			let footer_html = GETGLOBAL("COMPONENTS").footer || "";

			// Insert the HTML.
			$footer_ddwrap.insertAdjacentHTML("beforeend", html + footer_html);
		}

		/**
		 * Toggle sidebar element mouse events. To be used when toggling
		 *     the versions container.
		 *
		 * @param  {boolean} state - The toggle state.
		 * @return {undefined} - Nothing.
		 */
		function toggle_sb_elements(state) {
			// Toggle needed sidebar elements.
			$search.classList[state ? "add" : "remove"]("pnone");
			$sb_footer.classList[state ? "add" : "remove"]("pnone");
			$markdown.classList[state ? "add" : "remove"]("pnone");
			$sb_menu.classList[state ? "add" : "remove"]("pnone");
		}

		/**
		 * Determine whether an element has been totally scrolled.
		 *
		 * @return {Boolean} - Boolean indicating whether element has been totally scrolled.
		 *
		 * @resource [https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#Problems_and_solutions]
		 */
		function is_element_max_scrolled($el) {
			return $el.scrollHeight - $el.scrollTop <= $el.clientHeight;
		}

		/**
		 * Function disables mobile rubber band scrolling. When the scrollbar
		 *     is at the very top (scrollTop = 0) or the element has been
		 *     totally scrolled, prevent default browser behavior; i.e. rubber
		 *     band scrolling.
		 *
		 * @return {Undefined} - Nothing.
		 */
		function disable_rubber_band(event, $el, cY) {
			// Get the difference form the touchstart Y and the touchmove Y.
			var clientY = event.targetTouches[0].clientY - cY;

			// Element is at the top of its scroll.
			if ($el.scrollTop <= 0 && clientY > 0) {
				event.preventDefault();
			} else if (is_element_max_scrolled($el) && clientY < 0) {
				// Element is at the top of its scroll.
				event.preventDefault();
			}

			// Use a debounce function to reset the scroll position???
			// Reset the scroll to 1??? // $el.scrollTop = 1;
			// Reset the scroll to max-bottom - 1??? // $el.scrollTop = $el.scrollHeight - 1;
		}

		/**
		 * Show the sidebar.
		 *
		 * @return {undefined} - Nothing.
		 */
		function show_sidebar() {
			request_aframe(function() {
				// Show the sidebar.
				classes($sidebar, "sidebar-show");

				// Show the overlay.
				var classes_overlay = $soverlay.classList;
				classes_overlay.add("tdelay1");
				classes_overlay.remove("none");
				setTimeout(function() {
					classes_overlay.remove("opa0");
					classes_overlay.add("opa1");
				}, 0);
			});
		}

		/**
		 * Hide the sidebar.
		 *
		 * @return {undefined} - Nothing.
		 */
		function hide_sidebar() {
			request_aframe(function() {
				// Hide the sidebar.

				// Show the overlay.
				var classes_overlay = $soverlay.classList;
				classes_overlay.remove("opa1");
				classes_overlay.add("opa0");

				// Show the sidebar.
				var classes_sidebar = $sidebar.classList;
				classes_sidebar.remove("sidebar-show");
			});
		}

		/**
		 * Tell the browser to prep for a performance gain.
		 *
		 * @return {undefined} - Nothing.
		 *
		 * @resource [https://dev.opera.com/articles/css-will-change-property/]
		 */
		function perf_hint($el, props) {
			$el.style.willChange = props || "transform";
		}

		/**
		 * Remove performance CSS.
		 *
		 * @return {undefined} - Nothing.
		 */
		function perf_unhint($el) {
			$el.style.willChange = "auto";
		}

		/**
		 * Calculate the duration based on the amount needed to
		 *     scroll. The more distance needed to be scrolled,
		 *     the slower the scroll. The shorter the scroll
		 *     distance the faster the scroll animation.
		 *
		 * @param  {number} to - The new "to" location.
		 * @return {number} - The calculated scroll duration.
		 */
		function scroll_duration(to) {
			// Calculate the diff in distance and use that as the duration.
			var duration = Math.abs(window.pageYOffset - to);

			// Set lower and upper time limits.
			// Anything over 1000 gets reset to 1000.
			duration = Math.min(duration, 1000);
			// Anything below 350 gets reset to 350.
			duration = Math.max(duration, 350);

			return duration;
		}

		function trigger_sinput(value, $el) {
			var event;

			// [https://stackoverflow.com/a/35659572]
			// [https://developer.mozilla.org/en-US/docs/Web/API/Event/Event]
			// [https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent]
			// [https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent]
			if (is_event_support()) {
				event = new Event("input", {
					bubbles: true,
					cancelable: true
				});
			} else {
				event = document.createEvent("Event");
				event.initEvent("input", true, true);
			}

			// Clear the search and trigger the input event.
			$el.value = decodeURIComponent(value || "");
			$el.dispatchEvent(event);
		}

		/**
		 * Remove any and all the expanded menu items.
		 *
		 * @param  {htmlelement} $el - Optional element to set moused
		 *     over element to.
		 * @return {undefined} - Nothing.
		 */
		function remove_expanders($el) {
			// Reset the moused_el2 ref if an element is provided.
			if ($el) {
				GETGLOBAL("$moused_el2", $el);
			}

			// Get the elements.
			let $moused_el2_inserts = GETGLOBAL("$moused_el2_inserts");

			// Remove all expanded menu items.
			if ($moused_el2_inserts.length) {
				// Reset everything.
				GETGLOBAL("$moused_el2", null);
				// Remove the elements.
				for (var i = 0, l = $moused_el2_inserts.length; i < l; i++) {
					$el = $moused_el2_inserts[i];
					$el.parentNode.removeChild($el);
				}
				// Clear the array.
				$moused_el2_inserts.length = 0;
			}
		}

		/**
		 * Show the code blocks tab indicators.
		 *
		 * @return {undefined} - Nothing.
		 */
		function show_tab_indicators() {
			// Get the indicator elements.
			var $indicators = document.querySelectorAll(".tabs > .indicator");
			// Show the tab indicators.
			for (let i = 0, l = $indicators.length; i < l; i++) {
				// Cache current loop item.
				var $indicator = $indicators[i];

				// Get the gid.
				let gid = $indicator.getAttribute("data-gid");
				// Get the parent element.
				let $parent = document.getElementById(`cb-tabs-${gid}`);
				// Get the currently visible tab.
				let $tab = $parent.getElementsByClassName("activetab")[0];

				if ($tab) {
					// Show the indicator.
					classes($indicator, "!none");
					// Set the indicator width.
					$indicator.style.width = `${Math.floor(
						$tab.getBoundingClientRect().width
					)}px`;
					// Set the indicator x position.
					$indicator.style.left = `${Math.floor($tab.offsetLeft)}px`;
				}
			}
		}

		// Attach to module to "export" access to other modules.
		this[name]["cssloader"] = cssloader;
		this[name]["show_tb_loader"] = show_tb_loader;
		this[name]["hide_tb_loader"] = hide_tb_loader;
		this[name]["show_loader"] = show_loader;
		this[name]["hide_loader"] = hide_loader;
		this[name]["scroll"] = scroll;
		this[name]["get_headers"] = get_headers;
		this[name]["get_header"] = get_header;
		this[name][
			"reset_cblock_width_highlight"
		] = reset_cblock_width_highlight;
		this[name]["inject_sidebar_tops_css"] = inject_sidebar_tops_css;
		this[name]["get_height"] = get_height;
		this[name]["replace_html"] = replace_html;
		this[name]["inject_filename"] = inject_filename;
		this[name]["inject"] = inject;
		this[name]["bottom_nav"] = bottom_nav;
		this[name]["toggle_sb_elements"] = toggle_sb_elements;
		this[name]["is_element_max_scrolled"] = is_element_max_scrolled;
		this[name]["disable_rubber_band"] = disable_rubber_band;
		this[name]["show_sidebar"] = show_sidebar;
		this[name]["hide_sidebar"] = hide_sidebar;
		this[name]["perf_hint"] = perf_hint;
		this[name]["perf_unhint"] = perf_unhint;
		this[name]["scroll_duration"] = scroll_duration;
		this[name]["trigger_sinput"] = trigger_sinput;
		this[name]["remove_expanders"] = remove_expanders;
		this[name]["show_tab_indicators"] = show_tab_indicators;
	},
	"complete",
	"Module handles making/exporting core app functions."
);
