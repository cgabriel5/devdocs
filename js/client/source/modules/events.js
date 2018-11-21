/*jshint bitwise: false*/
/*jshint browser: true*/
/*jshint esversion: 6 */
/*jshint node: false*/
/*jshint -W014 */
/*jshint -W018 */
/*jshint maxerr: 10000 */

"use strict";

app.module(
	"events",
	function(modules, name) {
		// Imports.
		let globals = modules.globals;
		// Store the currently displayed file.
		var SETGLOBAL = globals.SETGLOBAL;
		var GETGLOBAL = globals.GETGLOBAL;

		let utils = modules.utils;
		let $sroot = utils.$sroot;
		let which_transition_event = utils.which_transition_event;
		let which_animation_event = utils.which_animation_event;
		let debounce = utils.debounce;
		let animate = utils.animate;
		let is_target_el = utils.is_target_el;
		let parameters = utils.parameters;
		let touchsupport = utils.touchsupport;
		let is_mobile_viewport = utils.is_mobile_viewport;
		let is_desktop_webkit = utils.is_desktop_webkit;
		let stylesheet = utils.stylesheet;
		let selection = utils.selection;
		let regexp_escape = utils.regexp_escape;
		let is_in_view = utils.is_in_view;
		let timeago = utils.timeago;
		let classes = utils.classes;
		let is_element_scrollable = utils.is_element_scrollable;

		let $$ = modules.$$;
		let $topbar = $$.$topbar;
		let $sidebar = $$.$sidebar;
		let $markdown = $$.$markdown;
		let $soverlay = $$.$soverlay;
		let $splash = $$.$splash;
		let $copied_message = $$.$copied_message;
		let $search = $$.$search;
		let $sinput = $$.$sinput;
		let $version_options = $$.$version_options;
		let $vlist = $$.$vlist;
		let $version = $$.$version;
		let $crumbs = $$.$crumbs;

		let core = modules.core;
		let show_tb_loader = core.show_tb_loader;
		let hide_tb_loader = core.hide_tb_loader;
		let hide_loader = core.hide_loader;

		let scroll = core.scroll;
		let get_headers = core.get_headers;
		let get_header = core.get_header;
		let reset_cblock_width_highlight = core.reset_cblock_width_highlight;
		let inject_sidebar_tops_css = core.inject_sidebar_tops_css;
		let inject = core.inject;
		let bottom_nav = core.bottom_nav;
		let toggle_sb_elements = core.toggle_sb_elements;
		let disable_rubber_band = core.disable_rubber_band;
		let show_sidebar = core.show_sidebar;
		let hide_sidebar = core.hide_sidebar;
		let perf_hint = core.perf_hint;
		let perf_unhint = core.perf_unhint;
		let trigger_sinput = core.trigger_sinput;
		let remove_expanders = core.remove_expanders;
		let show_tab_indicators = core.show_tab_indicators;

		// ---------------------------------------------------------------------

		// When the URL changes (history) update the HTML content.
		window.addEventListener("popstate", function() {
			// Clear/reset the sinput.
			trigger_sinput(null, $sinput);

			// Parse the URL query parameters.
			var params = parameters();

			// Inject the file contents to the page. Provide the
			// inject function the page parameter or default to the
			// first file when the page parameter does not exist.
			show_tb_loader();
			inject(params.p ? params.p : GETGLOBAL("FIRST_FILE"));
		});

		// When the URL changes (history) update the HTML content.
		window.addEventListener(
			"resize",
			debounce(function() {
				// If the flag is not set then disable the sheet.
				var $sheet = stylesheet.get(function($sheet, contents) {
					// Check if the contents contains the title.
					return contents.includes("/*title:dd/mac-scrollbars*/");
				});

				if ($sheet) {
					// Disable the sheet based on user agent condition.
					$sheet.disabled = !is_desktop_webkit();
				}

				// When the window is no longer in a mobile size
				// and the sidebar is showing, hide the sidebar and
				// reset the content + topbar.
				// [https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia]
				if (
					!is_mobile_viewport() &&
					getComputedStyle($soverlay).display === "block"
				) {
					// Trigger a click on the overlay to hide the sidebar and overlay.
					$soverlay.click();
				}

				get_headers();

				// Reset code block width/highlight.
				reset_cblock_width_highlight();

				// Inject the needed sidebar menu item tops CSS.
				inject_sidebar_tops_css();

				// Show tab indicators.
				show_tab_indicators();
			}),
			200
		);

		// [https://stackoverflow.com/a/30112044]
		// [https://stackoverflow.com/a/24915633]
		// Prevent all scrolling when scrolling on the soverlay.
		$soverlay.addEventListener("wheel", function(e) {
			e.preventDefault();
		});

		// [https://stackoverflow.com/a/30112044]
		// When scrolling on the sidebar, keep all scrolling to the
		// sidebar itself. Do not allow any scrolling to pass the
		// sidebar. When the top and bottom are reached simply prevent
		// any browser default behavior to stop further scrolling.
		$sidebar.addEventListener("wheel", function(e) {
			if (e.deltaY < 0) {
				// Element is at the top of its scroll.
				if ($sidebar.scrollTop > 0 === false) {
					e.preventDefault();
				}
			} else {
				// Element is at the top of its scroll.
				if (
					!(
						$sidebar.scrollTop + $sidebar.clientHeight <
						$sidebar.scrollHeight
					)
				) {
					e.preventDefault();
				}
			}
		});

		// Listen to clicks.
		document.addEventListener("dblclick", function(e) {
			// Get the target element.
			var $target = e.target;

			// [https://github.com/zenorocha/clipboard.js/issues/389#issuecomment-301916808]
			// [https://github.com/zenorocha/clipboard.js/issues/112]
			// [https://gist.github.com/rproenca/64781c6a1329b48a455b645d361a9aa3]
			// [https://stackoverflow.com/a/46858939]
			function clipboard($el /*, event*/) {
				var cb = new ClipboardJS($el, {
					text: function($trigger) {
						// Get the group id.
						var gid = $trigger.id.slice(3);

						// Get the code block's index.
						var index = $el.getAttribute("data-block-index");

						// Get the original code block text.
						return (
							GETGLOBAL("CBS_FILES")[GETGLOBAL("current_file")][
								gid
							][index] || ""
						);
					}
				});

				cb.on("success", function(/*e*/) {
					cb.off("error");
					cb.off("success");
					cb.destroy();

					// Show the message.
					classes($copied_message, "!opa0", "!none");

					// Select the text.
					selection($el);
					setTimeout(function() {
						selection.clear();
					}, 100);

					if (window.copy_timer) {
						clearTimeout(window.copy_timer);
					}
					window.copy_timer = setTimeout(function() {
						classes($copied_message, "opa0");
						window.copy_timer = setTimeout(function() {
							clearTimeout(window.copy_timer);
							window.copy_timer = null;
							delete window.copy_timer;

							classes($copied_message, "none");
						}, 2000);
					}, 2000);
				});

				cb.on("error", function(/*e*/) {
					cb.off("error");
					cb.off("success");
					cb.destroy();

					if (window.copy_timer) {
						clearTimeout(window.copy_timer);
					}
				});

				// cb.onClick(event);
				cb.onClick({ currentTarget: $el });
			}

			var $el = is_target_el(
				$target,
				null,
				is_target_el.code_pre_code_element
			);
			if ($el) {
				e.preventDefault();
				e.stopPropagation();

				clipboard($el, e);
			}
		});

		document.addEventListener("click", function(e) {
			// Get the target element.
			var $target = e.target;
			var filename;
			var clist = $target.classList;

			// Unfocus the search input.
			classes($search, "!sinput-focused");

			// Hide the versions container.
			if (
				!$version_options.classList.contains("none") &&
				!$version_options.contains($target)
			) {
				classes($version_options, "none");

				// Toggle sidebar elements mouse events.
				toggle_sb_elements(false);

				e.preventDefault();
				return;
			}

			// Actions/code logic is broken down into returnables
			// and non-returnables. Returnables will stop the event
			// from within the code block. Non-returnables will
			// continue down to change the spa contents.

			// Returnables:

			if (
				is_target_el($target, "link-heading") ||
				is_target_el($target, "l-3")
			) {
				// Remove any expanders.
				remove_expanders();

				e.preventDefault();
				e.stopPropagation();

				// Reset the target element.
				$target =
					is_target_el($target, "link-heading") ||
					is_target_el($target, "l-3");

				// When the sidebar menu element is clicked (l-3),
				// reset the target to its child anchor element.
				if ($target.tagName !== "A") {
					// Get the anchor child element.
					$target = $target.getElementsByClassName("link-heading")[0];
				}

				// Get the href.
				var href = $target.getAttribute("href");
				// Get the header element.
				let $header = get_header(href);

				// Remove the class before adding.
				classes($header, "!animate-header-highlight");

				// Let browser know to optimize scrolling.
				perf_hint($sroot, "scroll-position");

				// Store the header to scroll to it later if in the
				// mobile viewport view. This is only done when the
				// sidebar menu is shown, however we look of the
				// overlay is visible.
				if (
					is_mobile_viewport() &&
					getComputedStyle($soverlay).display === "block"
				) {
					SETGLOBAL("$sb_animation_header", $header);

					// Hide the sidebar.
					SETGLOBAL("sb_animation", true);
					hide_sidebar();
				} else {
					// Scroll to the header.
					scroll($header, function() {
						// console.log("A:Desktop");

						// Highlight the header.
						classes($header, "animate-header-highlight");

						// Remove optimization.
						perf_unhint($sroot);
					});
				}

				// Don't store the same hash. Only store if the hash
				// is different than the current hash.
				if (href && location.hash !== href) {
					history.pushState({}, null, href);
				}

				return;
			} else if (
				is_target_el($target, "hamburger") &&
				$soverlay.style.display !== "block"
			) {
				// The menu was interacted with.
				SETGLOBAL("sb_animation", true);

				// Show the sidebar.
				show_sidebar();

				return;
			} else if (clist.contains("sidebar-overlay")) {
				SETGLOBAL("sb_animation", true);

				// Hide the sidebar.
				hide_sidebar();

				return;
			} else if (is_target_el($target, "codeblock-placeholder")) {
				// Reset the target.
				$target = is_target_el($target, "codeblock-placeholder");

				// Hide the element.
				classes($target, "none");

				// Show the pre/code block.
				classes($target.nextElementSibling, "!none");

				// Get the group id.
				var gid = $target.getAttribute("data-gid");

				// Get the collapse action button.
				var $collapse_btn = document
					.getElementById(`tui-${gid}`)
					.getElementsByClassName("collapse")[0];

				// Get the copy action button.
				var $copy_btn = document
					.getElementById(`tui-${gid}`)
					.getElementsByClassName("copy")[0];

				// Show collapse button.
				classes($collapse_btn, "!none");
				// Enable the copy button.
				classes($copy_btn, "!btn-disabled-light");

				return;
			} else if (is_target_el($target, "collapse")) {
				// Reset the target.
				$target = is_target_el($target, "collapse");

				// Get the group id.
				var gid = $target.getAttribute("data-gid");

				// Get the visible code block.
				var $block = document
					.getElementById(`cbs-${gid}`)
					.querySelectorAll("pre:not(.none)")[0];

				// Get the placeholder element.
				var $placeholder = $block.previousElementSibling;

				// Hide the button, code block.
				classes($target, "none");
				classes($block, "none");
				// Show the placeholder.
				classes($placeholder, "!none");

				// Get the copy action button.
				var $copy_btn = document
					.getElementById(`tui-${gid}`)
					.getElementsByClassName("copy")[0];

				// Disable the copy button.
				classes($copy_btn, "btn-disabled-light");

				return;
			} else if (is_target_el($target, "dd-exp-message")) {
				// Reset the target.
				$target = is_target_el($target, "dd-exp-message");

				// Get the icon.
				var $icon = $target.querySelectorAll("i")[0];

				// Check whether it needs closing or opening.
				if (!$target.classList.contains("dd-exp-message-active")) {
					// Add the active class.
					classes($target, "dd-exp-message-active");
					// Open the contents.
					classes($target.nextElementSibling, "!none");
					// Rotate the icon.
					classes($icon, "dd-exp-message-icon-active");
				} else {
					// Close the contents.
					classes($target.nextElementSibling, "none");
					// Add the active class.
					classes($target, "!dd-exp-message-active");
					// Rotate the icon.
					classes($icon, "!dd-exp-message-icon-active");
				}

				return;
			} else if (is_target_el($target, "tab")) {
				// Cancel any current codeblock scroll.
				if (GETGLOBAL("codeblock_scroll")) {
					GETGLOBAL("codeblock_scroll").cancel();
				}

				// Reset the target.
				$target = is_target_el($target, "tab");
				// Get the parent.
				var $parent = $target.parentNode;

				// Scroll to the menu item.
				SETGLOBAL(
					"codeblock_scroll",
					animate({
						from: $parent.scrollLeft,
						to: $target.offsetLeft - 7,
						duration: 725,
						onProgress: function(val) {
							$parent.scrollLeft = val;
						},
						onComplete: function() {
							// Reset the var.
							SETGLOBAL("codeblock_scroll", null);
						}
					})
				);

				// Get the tab index.
				var tindex = $target.getAttribute("data-tab-index") * 1;
				// Get the group id.
				var gid = $target.getAttribute("data-gid");

				// Get the code blocks.
				var $codegroup = document.getElementById(`cbs-${gid}`);
				var $blocks = $codegroup.children;
				// Get the tab elements.
				var $tabs = document.getElementById(`cb-tabs-${gid}`).children;

				// Remove the active class from tabs.
				for (let i = 0, l = $tabs.length; i < l; i++) {
					classes($tabs[i], "!activetab");
				}
				// Highlight the clicked tab element.
				classes($target, "activetab");

				// Hide the collapse button.
				classes(
					document
						.getElementById(`tui-${gid}`)
						.getElementsByClassName("collapse")[0],
					"none"
				);

				// Hide all code blocks.
				for (let i = 0, l = $blocks.length; i < l; i++) {
					classes($blocks[i], "none");
				}

				// Finally, show the needed elements.
				var $block = $codegroup.querySelector(
					`pre[data-block-index="${tindex}"]`
				);
				// If the element has a placeholder, show that instead.
				var $placeholder = $block.previousElementSibling;
				if (
					$placeholder &&
					$placeholder.classList.contains("codeblock-placeholder")
				) {
					classes($placeholder, "!none");
				} else {
					classes($block, "!none");
				}

				setTimeout(function() {
					// Reset code block width/highlight.
					reset_cblock_width_highlight();
				}, 300);

				// Show tab indicators.
				show_tab_indicators();

				return;
			} else if (is_target_el($target, "search-ui")) {
				// Save a reference to the old target before reset.
				var $tar = $target;
				// Reset the target.
				$target = is_target_el($target, "search-ui");

				var $input = $target.parentNode.getElementsByClassName(
					"input"
				)[0];

				if (is_target_el($tar, "icon-clear")) {
					trigger_sinput(null, $input);
				}

				classes($search, "sinput-focused");
				$input.focus();

				return;
			} else if (is_target_el($target, "version-loaded")) {
				// Show the versions container.
				classes($version_options, "!none");

				// Toggle sidebar elements mouse events.
				toggle_sb_elements(true);

				// Un-highlight current last highlighted version.
				var $last = document.querySelector(`.active-version`);
				if ($last) {
					classes($last, "!active-version");
				}
				// Highlight the current
				var $cur = document.querySelector(
					`.version-option[data-v='${$version.getAttribute(
						"data-v"
					)}']`
				);
				if ($cur) {
					classes($cur, "active-version");

					// Update the scroll-y position.
					$vlist.scrollTop = $cur.offsetTop;
				}

				// Focus on the input.
				$version_options.getElementsByClassName("input")[0].focus();

				return;
			} else if (is_target_el($target, "version-option")) {
				// Reset the target.
				$target = is_target_el($target, "version-option");

				// Toggle sidebar elements mouse events.
				toggle_sb_elements(false);

				// Get the version.
				var version = $target.getAttribute("data-v");

				// Get the parameters.
				var params = parameters();

				// Get the current version.
				var current_version = $version.getAttribute("data-v");

				// Return if the version is the current version.
				if (version === current_version) {
					// Hide the versions container.
					classes($version_options, "none");

					e.preventDefault();
					return;
				}

				// Set the new version.
				params.v = version;

				// Add the version to the URL.
				history.pushState({}, null, parameters.build(params));

				// Reload the page.
				location.reload();

				e.preventDefault();
				return;
			} else if (is_target_el($target, "anchor")) {
				// Check if clicking the header anchor octicon element.
				let $header = false;

				// Reset the target.
				$target = is_target_el($target, "anchor");

				if ($target) {
					// Get the parent.
					$header = $target.parentNode;
				}

				// Skip if empty (no children).
				if (!$header.childElementCount) {
					return;
				}

				// Scroll to the header.
				if ($header) {
					classes($header, "!animate-header-highlight");

					// Let browser know to optimize scrolling.
					perf_hint($sroot, "scroll-position");

					// Scroll to the header.
					scroll(
						$header,
						function() {
							// console.log("B");

							// Highlight the header.
							classes($header, "animate-header-highlight");

							// Remove optimization.
							perf_unhint($sroot);
						},
						$header.classList.contains("ignore-header")
					);

					// Get the anchor href.
					let href = $header
						.getElementsByClassName("anchor")[0]
						.getAttribute("href");

					// Don't store the same hash. Only store if the hash
					// is different than the current hash.
					if (href && location.hash !== href) {
						history.pushState({}, null, href);
					}

					e.preventDefault();
					return;
				}
			}

			// Non-returnables:

			// The clicked element is an li element since it has the
			// l-2 (level-2) class. Since this is the case get the
			// child element's (anchor element) data-attribute.
			if (is_target_el($target, "l-2")) {
				// Remove any expanders.
				remove_expanders();

				// Reset the target.
				$target = is_target_el($target, "l-2");

				// Get the data-attribute.
				filename = $target
					.getElementsByClassName("menu-arrow")[0]
					.getAttribute("data-file");
			} else if (is_target_el($target, "arrow")) {
				// Reset the target.
				$target = is_target_el($target, "arrow");

				// Reset the target to the l-2.
				$target = document.getElementById(
					$target.getAttribute("data-refid")
				);

				// Get the data-attribute.
				filename = $target
					.getElementsByClassName("menu-arrow")[0]
					.getAttribute("data-file");
			} else if (clist.contains("link-doc")) {
				// Get the data-attribute.
				filename = $target.getAttribute("data-file");

				// Reset the target element.
				// $target = $target.parentNode;
				$target = document.querySelector(
					`a.link[data-file='${filename}']`
				).parentNode.parentNode;
			} else if (clist.contains("btn-home")) {
				// Get the data-attribute.
				filename = GETGLOBAL("FIRST_FILE");

				// Reset the target element.
				$target = document.querySelector(
					`a.link[data-file='${filename}']`
				).parentNode.parentNode;
			}

			// If filename variable is set then a menu item was
			// clicked. Therefore, insert the corresponding HTML into
			// the page.
			if (filename) {
				// Get the dir and file components from the file name.
				var parts = filename.split("/");
				var dir = parts[0];
				// Remove the dir from the parts.
				parts.shift();
				var file = parts.join("/");

				// Only store when the file name does not match the
				// current file name to prevent clogging the history.
				if (filename !== GETGLOBAL("current_file")) {
					// Maintain the version if it exists.
					let params = parameters();
					let version = params.v;
					let current_version = version ? `&v=${version}` : "";

					history.pushState(
						{},
						null,
						`?p=${encodeURIComponent(
							`${dir}/${file}`
						)}${current_version}`
					);
				}

				// Set the HTML.
				inject(filename, $target);

				e.preventDefault();
			}
		});

		document.addEventListener("mousemove", function(e) {
			// Prevent expanders when flag is set.
			if (GETGLOBAL("prevent_mousemove_expanders")) {
				return;
			}

			var $target = e.target;

			// Version container active...
			if (is_target_el($target, "version-option")) {
				$target = is_target_el($target, "version-option");

				// Remove the highlight class from the
				// currently active container.
				classes(
					document.querySelector(".active-version"),
					"!active-version"
				);

				classes($target, "active-version");

				return;
			}

			var $l2 = is_target_el($target, "l-2");
			var $l3 = is_target_el($target, "l-3");
			if ($l2) {
				// Skip of the cloned element is hovered.
				if ($l2.classList.contains("clone-true-l2")) {
					return;
				}

				// Skip if its the same element as before.
				if ($l2 === GETGLOBAL("$moused_el2")) {
					return;
				} else {
					// Reset the target.
					$target = $l2;

					remove_expanders($target);

					// Clone the element.
					let $clone = $target.cloneNode(true);
					var $anchor = $clone.getElementsByClassName("l-2-link")[0];

					// Add clone identifier class.
					classes($clone, "clone-true-l2", "pnone");

					// Add class to allow text to fully expand.
					classes($anchor, "l-2-link-expanded");

					// Check if active.
					var is_active = $target.classList.contains("active-page");

					// Get the position of the element on the page.
					let coors = $target.getBoundingClientRect();
					let yoffset = window.pageYOffset;
					let xoffset = window.pageXOffset;
					let _top = coors.top + yoffset;
					let _left = coors.left + xoffset + (is_active ? 1 : 0);

					var bg = !is_active ? "background: #f4f4f4;" : "";

					// Add the coordinates to the clone.
					$clone.setAttribute(
						"style",
						`transition: none;top: ${_top}px;left: ${_left}px;z-index: 2;position: absolute !important;${bg}border-radius: 0 4px 4px 0;font-size:15px;box-shadow: 0px 1px 1px rgba(57,70,78, 0.2), 1px 0px 0px rgba(57,70,78, 0.1);`
					);

					// Add clone to page.
					document.body.insertAdjacentElement("beforeend", $clone);

					// Get the clone width.
					let cwidth = $clone.getBoundingClientRect().width;
					// Hide the element.
					classes($clone, "none");

					// If the clone is longer than the original target
					// inject the clone.
					if (cwidth > coors.width) {
						GETGLOBAL("$moused_el2_inserts").push($clone);

						// Hide the element.
						classes($clone, "!none");
					} else {
						// Remove the element.
						$clone.parentNode.removeChild($clone);
					}
				}
			} else if ($l3) {
				// Skip of the cloned element is hovered.
				if ($l3.classList.contains("clone-true-l3")) {
					return;
				}

				// Skip if its the same element as before.
				// if ($l3 === $moused_el3) {
				if ($l3 === GETGLOBAL("$moused_el2")) {
					return;
				} else {
					// Reset the target.
					$target = $l3;

					remove_expanders($target);

					// Clone the element.
					let $clone = $target.cloneNode(true);

					// Add clone identifier class.
					// classes($clone, "clone-true-l3");
					classes($clone, "pnone");

					// Get the position of the element on the page.
					let coors = $target.getBoundingClientRect();
					let yoffset = window.pageYOffset;
					let xoffset = window.pageXOffset;
					let _top = coors.top + yoffset;
					let _left = coors.left + xoffset;

					// Add the coordinates to the clone.
					$clone.setAttribute(
						"style",
						`transition: none;top: ${_top}px;left: ${_left}px;z-index: 2;position: absolute;border-right: 2px solid #2578f8;background: #f4f4f4;overflow: unset;box-shadow: 0px 1px 1px rgba(57,70,78, 0.2), 1px 0px 0px rgba(57,70,78, 0.1);`
					);

					// Add clone to page.
					document.body.insertAdjacentElement("beforeend", $clone);

					// [https://plainjs.com/javascript/manipulation/wrap-an-html-structure-around-an-element-28/]
					// Create wrapper container.
					var $wrapper = document.createElement("ul");
					$wrapper.setAttribute(
						"style",
						"margin: 0;padding: 0;list-style: none;"
					);

					classes($wrapper, "clone-true-l3", "pnone");

					// insert wrapper before el in the DOM tree
					$clone.parentNode.insertBefore($wrapper, $clone);

					// move el into wrapper
					$wrapper.appendChild($clone);

					////////////////////////////////////////////////////

					// Get the clone width.
					let cwidth = $clone.getBoundingClientRect().width;
					// Hide the element.
					classes($wrapper, "none");

					// If the clone is longer than the original target
					// inject the clone.
					if (cwidth > coors.width) {
						GETGLOBAL("$moused_el2_inserts").push($wrapper);

						// Hide the element.
						classes($wrapper, "!none");
					} else {
						// Remove the element.
						$wrapper.parentNode.removeChild($wrapper);
					}
				}
			} else {
				remove_expanders();
			}
		});

		$sidebar.addEventListener(
			"scroll",
			function() {
				remove_expanders();
			},
			false
		);

		window.addEventListener(
			"blur",
			function() {
				// Remove the active class.
				classes($search, "!sinput-focused");
			},
			false
		);

		// Unfocus the search input then the escape key it hit.
		document.addEventListener("keydown", function(e) {
			// Focus on the search input.
			if (e.keyCode === 27) {
				// Hide the versions container.
				if (!$version_options.classList.contains("none")) {
					classes($version_options, "none");

					// Toggle sidebar elements mouse events.
					toggle_sb_elements(false);

					e.preventDefault();
					return;
				}

				// Skip when the element already has focus.
				let $active = document.activeElement;
				if ($active && $active.classList.contains("input")) {
					// classes($search, "!sinput-focused");
					$sinput.blur();
					e.preventDefault();
					return;
				}
			} else if (e.keyCode === 86) {
				// If an input is focused return.
				// Skip when the element already has focus.
				let $active = document.activeElement;
				if ($active && $active.classList.contains("input")) {
					// e.preventDefault();
					return;
				}

				// Hide the versions container.
				if ($version_options.classList.contains("none")) {
					// Show version container by triggering the element.
					$version.click();
					e.preventDefault();
					return;
				}
			}
		});

		// Focus on the search input when the forward slash key it hit.
		document.addEventListener("keypress", function(e) {
			// Focus on the search input.
			if (e.keyCode === 47) {
				// Skip when the element already has focus.
				var $active = document.activeElement;
				if ($active && $active.classList.contains("input")) {
					return;
				}

				// classes($search, "sinput-focused");
				$sinput.focus();
				e.preventDefault();
			}
		});

		// Focus on the search input when the forward slash key it hit.
		document.addEventListener("keydown", function(e) {
			// Go up.
			if (e.keyCode === 38) {
				// Only when the popup is visible.
				if (!$version_options.classList.contains("none")) {
					// Check what is being focused on.
					// - either a version container
					// - or the input itself

					// Check for an active container.
					let $cur = document.querySelector(".active-version");

					// If a container exists...
					if ($cur) {
						// Highlight the prev sibling if it exists.

						let $e = $cur.previousElementSibling;
						var $prev;
						while ($e) {
							if ($e.style.display !== "none") {
								$prev = $e;
								break;
							}
							$e = $e.previousElementSibling;
						}

						if ($prev) {
							// Remove the highlight class from the
							// currently active container.
							classes($cur, "!active-version");

							classes($prev, "active-version");

							// Update the scroll-y position.
							if (!is_in_view($vlist, $prev).complete) {
								$vlist.scrollTop = $prev.offsetTop;
							}
						}
					}

					e.preventDefault();
					return;
				}
			} else if (e.keyCode === 40) {
				// Only when the popup is visible.
				if (!$version_options.classList.contains("none")) {
					// Check what is being focused on.
					// - either a version container
					// - or the input itself

					// Check for an active container.
					let $cur = document.querySelector(".active-version");

					// If a container exists...
					if ($cur) {
						// Highlight the prev sibling if it exists.

						let $e = $cur.nextElementSibling;
						var $next;
						while ($e) {
							if ($e.style.display !== "none") {
								$next = $e;
								break;
							}
							$e = $e.nextElementSibling;
						}

						if ($next) {
							// Remove the highlight class from the
							// currently active container.
							classes($cur, "!active-version");

							classes($next, "active-version");

							// Update the scroll-y position.
							if (!is_in_view($vlist, $next).complete) {
								$vlist.scrollTop = $next.offsetTop;
							}
						}
					}

					e.preventDefault();
					return;
				}
			} else if (e.keyCode === 13) {
				// Get the current active option.
				// Check for an active container.
				var $cur = document.querySelector(".active-version");

				// Trigger the click event.
				if ($cur) {
					$cur.click();
				}
			}
		});

		// Listen to search input.
		document.addEventListener(
			"input",
			function(e) {
				var $target = e.target;

				if ($target.classList.contains("input")) {
					if ($target.classList.contains("sinput-main")) {
						// Get the text.
						var text = $target.value.trim();

						// Get the parent element.
						var $parent = $target.parentNode;

						// Get the clear element.
						var $clear_search = $parent.getElementsByClassName(
							"icon-clear"
						)[0];

						// Store the scrollTop position of the sidebar
						// to reset back to when there is no input.
						if (text.length === 1) {
							if (!$vlist.getAttribute("data-ypos")) {
								// Store...
								$sidebar.setAttribute(
									"data-ypos",
									$sidebar.scrollTop
								);
							}
						}

						// // [https://stackoverflow.com/a/13451971]
						// if (window.history.replaceState) {
						// 	// Get the parameters.
						// 	var params = parameters();
						// 	// Add the value.
						// 	params.s = text;
						// 	// Remove the search key if empty.
						// 	if (text.trim() === "") {
						// 		delete params["s"];
						// 	}

						// 	var url = parameters.build(params);

						// 	// Prevent browser from storing history, so
						// 	// only modify the changes (don't store).
						// 	history.replaceState(
						// 		{},
						// 		null,
						// 		// [https://stackoverflow.com/a/41061471]
						// 		// [https://stackoverflow.com/a/13451971]
						// 		url.trim() === "" ? location.pathname : url
						// 	);
						// }

						if (text !== "") {
							// Show the clear button.
							classes($clear_search, "!none");

							var at_least_one = false;

							// Get the menu elements.
							let $l_2 = GETGLOBAL("$l_2");

							// Start filtering elements.
							for (var i = 0, l = $l_2.length; i < l; i++) {
								var $item = $l_2[i];
								var title = $item.getAttribute("data-title");

								if (
									title
										.toLowerCase()
										.includes(text.toLowerCase())
								) {
									// Switch the flag since there was a
									// a match.
									at_least_one = true;

									// Show it.
									$item.style.display = null;
									// Also check for a possible UL.
									let $next = $item.nextElementSibling;

									// Highlight the search needle.
									var $anchor = $item.querySelectorAll(
										".l-2-link .link"
									)[0];
									var highlight_title = title.replace(
										new RegExp(
											"(" + regexp_escape(text) + ")",
											"gi"
										),
										"<span class='search-highlight'>$1</span>"
									);
									// Insert the highlighted needle(s).
									$anchor.innerHTML = highlight_title;

									// Show the UL
									if (
										$next &&
										$next.tagName === "UL" &&
										$next.getAttribute("data-og-height")
									) {
										// Must also match the current file.
										if (
											GETGLOBAL("current_file") ===
											$item
												.getElementsByClassName(
													"menu-arrow"
												)[0]
												.getAttribute("data-file")
										) {
											// Add back the height.
											$next.style.height = $next.getAttribute(
												"data-og-height"
											);
											// Remove the attr.
											$next.removeAttribute(
												"data-og-height"
											);
										}
									}
								} else {
									// Hide it.
									$item.style.display = "none";
									// Also check for a possible UL.
									let $next = $item.nextElementSibling;
									if (
										$next &&
										$next.tagName === "UL" &&
										!$next.getAttribute("data-og-height")
									) {
										// Hide it as well.
										// Store the height as an attr.
										$next.setAttribute(
											"data-og-height",
											$next.style.height
										);

										$next.style.height = "0px";
									}
								}
							}

							// Depending on whether there are results,
							// add/remove the search-ui highlight.
							classes(
								$parent,
								(!at_least_one ? "" : "!") + "matchless"
							);
						} else {
							// Hide the clear button.
							classes($clear_search, "none");

							// Restore search-ui highlight.
							classes($parent, "!matchless");

							// Unhide them all.

							// Get the menu elements.
							let $l_2 = GETGLOBAL("$l_2");

							// Start filtering elements.
							for (let i = 0, l = $l_2.length; i < l; i++) {
								let $item = $l_2[i];

								// Show it.
								$item.style.display = null;
								// Also check for a possible UL.
								var $next = $item.nextElementSibling;

								// Un-highlight the search needle.
								let $anchor = $item.querySelectorAll(
									".l-2-link .link"
								)[0];
								// Insert original title.
								$anchor.innerHTML = $item.getAttribute(
									"data-title"
								);

								// Show the UL
								if (
									$next &&
									$next.tagName === "UL" &&
									$next.getAttribute("data-og-height")
								) {
									// Must also match the current file.
									if (
										GETGLOBAL("current_file") ===
										$item
											.getElementsByClassName(
												"menu-arrow"
											)[0]
											.getAttribute("data-file")
									) {
										// Add back the height.
										$next.style.height = $next.getAttribute(
											"data-og-height"
										);
										// Remove the attr.
										$next.removeAttribute("data-og-height");
									}
								}
							}

							// Set scrollbar back to original scroll
							// position and remove attribute.
							$sidebar.scrollTop = $sidebar.getAttribute(
								"data-ypos"
							);
							$sidebar.removeAttribute("data-ypos");
						}
					} else {
						// Get the text.
						let text = $target.value.trim();

						// Get the parent element.
						var $parent = $target.parentNode;

						// Get the clear element.
						let $clear_search = $parent.getElementsByClassName(
							"icon-clear"
						)[0];

						// Store the scrollTop position of the vlist
						// to reset back to when there is no input.
						if (text.length === 1) {
							if (!$vlist.getAttribute("data-ypos")) {
								// Store...
								$vlist.setAttribute(
									"data-ypos",
									$vlist.scrollTop
								);
							}
						}

						// Get the elements.
						var $els = document.querySelectorAll(".version-option");

						var first_v = false;
						// Check for an active container.
						var $cur = document.querySelector(".active-version");
						if ($cur) {
							classes($cur, "!active-version");
						}

						if (text !== "") {
							// Show the clear button.
							classes($clear_search, "!none");

							let at_least_one = false;

							// Start filtering elements.
							for (let i = 0, l = $els.length; i < l; i++) {
								let $item = $els[i];
								let title = $item.getAttribute("data-v");

								if (
									title
										.toLowerCase()
										.includes(text.toLowerCase())
								) {
									// Highlight the first element.
									if (!first_v) {
										first_v = true;

										classes($item, "active-version");
									}

									// Switch the flag since there was a
									// a match.
									at_least_one = true;

									// Show it.
									$item.style.display = null;

									// Highlight the search needle.
									let highlight_title = title.replace(
										new RegExp(
											"(" + regexp_escape(text) + ")",
											"gi"
										),
										"<span class='search-highlight'>$1</span>"
									);
									// Insert the highlighted needle(s).
									$item.getElementsByClassName(
										"vtext"
									)[0].innerHTML = highlight_title;
								} else {
									// Hide it.
									$item.style.display = "none";
								}
							}

							// Depending on whether there are results,
							// add/remove the search-ui highlight.
							classes(
								$parent,
								(!at_least_one ? "" : "!") + "matchless"
							);
						} else {
							// Hide the clear button.
							classes($clear_search, "none");

							// Restore search-ui highlight.
							classes($parent, "!matchless");

							// Unhide them all.

							// Start filtering elements.
							for (let i = 0, l = $els.length; i < l; i++) {
								let $item = $els[i];

								// Show it.
								$item.style.display = null;

								// Insert original title.
								$item.getElementsByClassName(
									"vtext"
								)[0].innerHTML = $item.getAttribute("data-v");
							}

							// Set scrollbar back to original scroll
							// position and remove attribute.
							$vlist.scrollTop = $vlist.getAttribute("data-ypos");
							$vlist.removeAttribute("data-ypos");

							// Check for an active container.
							let $cur = document.querySelector(
								".active-version"
							);
							if ($cur) {
								classes($cur, "!active-version");
							}
							classes($vlist.firstChild, "active-version");
						}
					}
				}
			},
			true
		);

		// Listen to the end of the splash animation.
		document.addEventListener(which_animation_event("start"), function(e) {
			if (e.animationName === "animate-pulse") {
				setTimeout(function() {
					// Remove the class and hide the splash elements.
					classes($splash, "!opa1", "opa0");
					classes($topbar, "!none");
				}, 250);
			}
		});
		document.addEventListener(which_animation_event("end"), function(e) {
			var name = e.animationName;
			var $target = e.target;

			// Remove the animation class once completed.
			if (name === "animate-header-highlight") {
				// Remove the animation class.
				classes($target, "!animate-header-highlight");
			}
		});

		// Listen to sidebar showing/hiding transition ends to reset
		// the needed elements.
		document.addEventListener(which_transition_event("end"), function(e) {
			// Get needed event info.
			var $target = e.target;
			var pname = e.propertyName;

			// Hide the splash element.
			if (
				$target.classList.contains("splash-overlay") &&
				pname === "opacity"
			) {
				classes($splash, "none");
			}

			///////////////////////////

			if ($target === $soverlay) {
				// Get the overlay opacity.
				var opacity = getComputedStyle($soverlay, null).opacity * 1;

				// Get needed classes.
				var classes_overlay = $soverlay.classList;
				var classes_sidebar = $sidebar.classList;

				// Sidebar hidden.
				if (opacity === 0) {
					// Note: Having the sidebar "visible", although
					// offscreen causes scrolling to lag in mobile.
					// Therefore, once the overlay fades out "reset"
					// the sidebar by hiding then unhiding it.
					if (is_mobile_viewport()) {
						classes_sidebar.add("none");
						setTimeout(function() {
							classes_sidebar.remove("none");
						}, 0);
					}

					// Reset the overlay.
					classes_overlay.add("none");
					classes_overlay.remove("tdelay1");

					// Scroll to the stored header after sliding
					// the sidebar away if a header exists.
					var $sb_animation_header = GETGLOBAL(
						"$sb_animation_header"
					);
					if ($sb_animation_header) {
						// Scroll to the header.
						scroll($sb_animation_header, function() {
							// console.log("A:Mobile");

							// Highlight the header.
							classes(
								$sb_animation_header,
								"animate-header-highlight"
							);

							// Remove optimization.
							perf_unhint($sroot);

							// Reset the var.
							$sb_animation_header = null;
						});
					}
				}

				// Turn off the animation flag.
				SETGLOBAL("sb_animation", false);
			}
		});

		// [http://patrickmuff.ch/blog/2014/10/01/how-we-fixed-the-webkit-overflow-scrolling-touch-bug-on-ios/]
		// [https://stackoverflow.com/a/33024813]
		// [https://stackoverflow.com/a/41601290]
		// [https://stackoverflow.com/a/41565471]
		// Double tap detection: [https://stackoverflow.com/a/32905418]
		if (touchsupport()) {
			var timeout;
			var lastTap = 0;

			document.addEventListener(
				"touchstart",
				function(e) {
					var currentTime = new Date().getTime();
					var tapLength = currentTime - lastTap;
					var taptime = 220;

					// Remove any previous timer.
					clearTimeout(timeout);

					// Get the target element.
					var $target = e.target;
					var clist = $target.classList;

					if (tapLength < taptime && tapLength > 0) {
						var $el = is_target_el(
							$target,
							null,
							is_target_el.code_pre_code_element
						);
						if ($el) {
							e.preventDefault();
							e.stopPropagation();

							// Does not seem to work! :/

							setTimeout(function() {
								// Programmatically click the copy button.

								var $el_;

								// When clicking a codegroup block.
								if (is_target_el($el, "cb-blocks")) {
									$el_ =
										$el.parentNode.previousElementSibling;
								} else {
									$el_ = $el.previousElementSibling;
								}

								$el_.getElementsByClassName("copy")[0].click();
							}, 1);
						}
					} else {
						timeout = setTimeout(function() {
							// Clear the timer.
							clearTimeout(timeout);

							// Run the regular code.

							// Prevent further animations if animation ongoing.
							if (GETGLOBAL("sb_animation")) {
								return;
							}

							// Get touched coordinates.
							var touch_info = e.targetTouches[0];
							var x = touch_info.clientX;
							var y = touch_info.clientY;
							// The allowed range the touched pixels can be in
							// to still allow for the mobile trigger to happen.
							var range =
								getComputedStyle($topbar).height.replace(
									"px",
									""
								) *
									1 -
								1;

							// The menu was interacted with.
							if (
								is_target_el($target, "hamburger") ||
								(x <= range &&
									y <= range &&
									$soverlay.style.display !== "block")
							) {
								// Cancel any current header scrolling animation.
								if (scroll.animation) {
									scroll.animation.cancel();
									scroll.animation = null;
								}

								// Note: Weird browser behavior. Sometimes while
								// header scrolling and the sidebar is opened
								// the sidebar is not visible but still
								// useable. Hiding/showing the sidebar fixes
								// this.
								classes($sidebar, "none", "!none");

								SETGLOBAL("sb_animation", true);

								// Show the sidebar.
								show_sidebar();

								// Prevent later click event handlers.
								// [https://stackoverflow.com/a/39575105]
								// [https://stackoverflow.com/a/48536959]
								// [https://stackoverflow.com/a/41289160]
								e.preventDefault();
							} else if (clist.contains("sidebar-overlay")) {
								SETGLOBAL("sb_animation", true);

								// Hide the sidebar.
								hide_sidebar();

								// Prevent later click event handlers.
								// [https://stackoverflow.com/a/39575105]
								// [https://stackoverflow.com/a/48536959]
								// [https://stackoverflow.com/a/41289160]
								e.preventDefault();
							}

							// [https://stackoverflow.com/a/42288386]
							// [https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action]
							// [https://github.com/OwlCarousel2/OwlCarousel2/issues/1790]
							// [https://developers.google.com/web/updates/2017/01/scrolling-intervention]
							// e.preventDefault();
						}, taptime);
					}
					lastTap = currentTime;
				},
				{ passive: false }
			);

			// Store the Y position on touch start.
			var _clientY = null;
			// The touchstart handler stores the Y position.
			var touchstart_handler = function(event) {
				if (event.targetTouches.length === 1) {
					// Detect single touch.
					_clientY = event.targetTouches[0].clientY;
				}
			};
			// The touchmove handler cancels the OS rubber band effect.
			var touchmove_handler = function(event) {
				if (event.targetTouches.length === 1) {
					// Get the correct element.
					var $el = $sidebar.contains(event.target)
						? $sidebar
						: $soverlay;

					// Disable rubber banding.
					disable_rubber_band(event, $el, _clientY);
				}
			};

			// Touchstart/move event listeners.

			// When the sidebar is scrolled to the upper/lower bounds,
			// reset them. Upper bound scroll top to 1 and lower bound
			// scroll to max-scroll - 1.
			$sidebar.addEventListener(
				"scroll",
				debounce(function(e) {
					// The max scroll amount (lower-bound, max - 1).
					var lbound = $sidebar.scrollHeight - $sidebar.clientHeight;
					// The upper bound (0).
					var ubound = $sidebar.scrollTop;

					if (Math.sign(ubound) === -1 || ubound === 0) {
						$sidebar.scrollTop = 1;
						e.preventDefault();
					} else if (ubound >= lbound) {
						$sidebar.scrollTop = lbound - 1;
						e.preventDefault();
					}
				}, 220),
				false
			);

			$sidebar.addEventListener("touchstart", touchstart_handler, false);
			$sidebar.addEventListener("touchmove", touchmove_handler, false);
			$soverlay.addEventListener("touchstart", touchstart_handler, false);
			$soverlay.addEventListener("touchmove", touchmove_handler, false);
		}

		// [https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver]
		// [https://davidwalsh.name/mutationobserver-api]
		// [https://www.javascripture.com/MutationObserver]
		var observer = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				// Get mutation information.
				var nodes_added = mutation.addedNodes;
				var nodes_removed = mutation.removedNodes;
				var $target = mutation.target;

				// Only listen to markdown content changes.
				if (
					// $target.id === "app-wrapper" &&
					$target.id === "markdown" // &&
					// nodes_added.length &&
					// nodes_removed.length &&
					// nodes_added[0].id === "markdown" &&
					// nodes_removed[0].id === "markdown"
				) {
					// Reset the link-docs.
					// Get the GitHub data.
					var github = GETGLOBAL("GITHUB");

					// Get the links.
					var $links = [].slice.call(
						document.getElementsByClassName("link-doc")
					);
					// Store the links length.
					var links_length = $links.length;

					// When no links immediately hide the loader to
					// signal "page load" completion.
					if (!links_length) {
						if (GETGLOBAL("sb_active_el_loader")) {
							hide_loader(GETGLOBAL("sb_active_el_loader"));
						} else {
							hide_tb_loader();
						}
					} else {
						// Else...reset the links then end "page load"
						// completion.

						// Loop over the links.
						$links.forEach(function($link, i) {
							// Get the data-attribute.
							var filename = $link.getAttribute("data-file");
							var filename_untouched = $link.getAttribute(
								"data-file-untouched"
							);

							if (
								!document.querySelector(
									`a.link[data-file='${filename}']`
								)
							) {
								// If the element does not exist then the file does
								// not exist in the data object. Therefore, try
								// opening the link using the GitHub information.

								// Reset the URL if needed.
								if (filename_untouched === "LICENSE.md") {
									filename_untouched = "LICENSE.txt";
								}

								// Build the URL.
								var furl = `https://github.com/${
									github.account_username
								}/${
									github.project_name
								}/blob/master/${filename_untouched}`;

								// Reset the element.
								// Remove the link-doc class.
								classes($link, "!link-doc");
								// Reset/set attributes.
								$link.setAttribute("href", furl);
								$link.setAttribute("target", "_blank");
							}

							// On last loop iteration hide the loader.
							if (links_length - 1 === i) {
								if (GETGLOBAL("sb_active_el_loader")) {
									hide_loader(
										GETGLOBAL("sb_active_el_loader")
									);
								} else {
									hide_tb_loader();
								}
							}
						});
					}

					if (GETGLOBAL("crumb_scroll_timer")) {
						// Clear timer.
						clearTimeout(GETGLOBAL("crumb_scroll_timer"));
						// Clear the global.
						SETGLOBAL("crumb_scroll_timer", null);
					}
					// Animate crumbs (if scrollable) to show it's scrollable.
					SETGLOBAL(
						"crumb_scroll_timer",
						setTimeout(function() {
							// Calculate the remaining scroll area.
							var scroll_rem =
								$crumbs.scrollWidth - $crumbs.clientWidth;
							// Determine the max scroll amount for animation.
							var cscroll_amount =
								scroll_rem < 4 ? scroll_rem : 4;
							var crumb_scroll_duration = 120;

							animate({
								from: 0,
								to: cscroll_amount,
								duration: 125,
								onSkip: function() {
									// If element is not scrollable then skip animation.
									if (!is_element_scrollable("x", $crumbs)) {
										return true;
									}
								},
								onProgress: function(val, meta) {
									$crumbs.scrollLeft = val;
								},
								onComplete: function() {
									// Reset the scrolling.
									animate({
										easing: function(n) {
											if (n < 1 / 2.75) {
												return 7.5625 * n * n;
											} else if (n < 2 / 2.75) {
												return (
													7.5625 *
														(n -= 1.5 / 2.75) *
														n +
													0.75
												);
											} else if (n < 2.5 / 2.75) {
												return (
													7.5625 *
														(n -= 2.25 / 2.75) *
														n +
													0.9375
												);
											} else {
												return (
													7.5625 *
														(n -= 2.625 / 2.75) *
														n +
													0.984375
												);
											}
										},
										from: cscroll_amount,
										to: 0,
										duration: 250,
										onProgress: function(val, meta) {
											$crumbs.scrollLeft = val;
										}
									});
								}
							});
						}, 600)
					);

					// Show tab indicators.
					show_tab_indicators();

					// Set up the ClipboardJS.
					// Remove previous clipboardjs instance
					if (GETGLOBAL("clipboardjs_instance")) {
						GETGLOBAL("clipboardjs_instance").destroy();
					}
					// Set up the clipboardjs listeners.
					SETGLOBAL(
						"clipboardjs_instance",
						new ClipboardJS(".copy", {
							text: function($trigger) {
								// Get the group id.
								var gid = $trigger.getAttribute("data-gid");

								// Get the non-hidden code block.
								var $block = document
									.getElementById(`cbs-${gid}`)
									.querySelectorAll("pre:not(.none)")[0];
								// Get the code block's index.
								var index = $block.getAttribute(
									"data-block-index"
								);

								// Get the original code block text.
								return (
									GETGLOBAL("CBS_FILES")[
										GETGLOBAL("current_file")
									][gid][index] || ""
								);
							}
						})
					);

					GETGLOBAL("clipboardjs_instance").on(
						"success",
						function(/*e*/) {
							// Show the message.
							classes($copied_message, "!opa0", "!none");

							if (window.copy_timer) {
								clearTimeout(window.copy_timer);
							}
							window.copy_timer = setTimeout(function() {
								classes($copied_message, "opa0");
								window.copy_timer = setTimeout(function() {
									clearTimeout(window.copy_timer);
									window.copy_timer = null;
									delete window.copy_timer;

									classes($copied_message, "none");
								}, 2000);
							}, 2000);
						}
					);

					GETGLOBAL("clipboardjs_instance").on(
						"error",
						function(/*e*/) {
							if (window.copy_timer) {
								clearTimeout(window.copy_timer);
							}
						}
					);

					setTimeout(function() {
						// Reset code block width/highlight.
						reset_cblock_width_highlight();
					}, 300);

					// Add the bottom nav UI elements.
					bottom_nav();

					// Add loading class and enable mouse events.
					classes($markdown, "!loading-content", "!pnone");

					// Calculate the time ago times.
					var mtime_update = function() {
						// Get the needed elements.
						var $mtimes = document.getElementsByClassName(
							"mtime-ts"
						);

						for (let i = 0, l = $mtimes.length; i < l; i++) {
							// Cache the current mtime element.
							var $mtime = $mtimes[i];

							// Set the timeago.
							$mtime.textContent = timeago(
								parseInt($mtime.getAttribute("data-ts"), 10)
							);

							// Finally, show the element.
							classes($mtime, "!none");
						}
					};

					// Run for the first time.
					mtime_update();

					// Clear any previous timer.
					if (GETGLOBAL("timeago_timer")) {
						clearInterval(GETGLOBAL("timeago_timer"));
					}
					// Set the mtime time internal timer.
					GETGLOBAL(
						"timeago_timer",
						setInterval(function() {
							mtime_update();
						}, 60000)
					);
				}
			});
		});

		// Mutation config.
		var observerConfig = {
			childList: true,
			// attributes: true,
			// characterData: true,
			subtree: true
			// attributeOldValue: true,
			// characterDataOldValue: true
			// attributeFilter: true
		};

		// Observe body on body.
		observer.observe(document.body, observerConfig);
	},
	"complete",
	"Module handles making/exporting needed app event handlers."
);
