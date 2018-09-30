/*jshint bitwise: false*/
/*jshint browser: true*/
/*jshint esversion: 6 */
/*jshint node: false*/
/*jshint -W014 */
/*jshint -W018 */
/*jshint maxerr: 10000 */

document.onreadystatechange = function() {
	"use strict";

	// All resources have loaded (document + subresources).
	if (document.readyState === "complete") {
		// Third-party //

		// Init FastClickJS.
		if ("addEventListener" in document) {
			FastClick.attach(document.body);
		}

		// Grab the HTTP library.
		var http = window.app.libs.http;

		// Elements //

		// Get needed elements.
		var $loadertop = document.getElementById("loader-top");
		var $topbar = document.getElementById("topbar");
		var $sidebar = document.getElementById("sidebar");
		var $markdown = document.getElementById("markdown");
		var $soverlay = document.getElementById("sidebar-overlay");
		var $moverlay = document.getElementById("main-overlay");
		var $splash = document.getElementById("splash-overlay");
		var $splash_icon = document.getElementById("leaf");
		var $crumbs_folder = document.getElementById("crumbs-folder");
		var $crumbs_filename = document.getElementById("crumbs-filename");
		var $tb_loader = document.getElementById("tb-loader");
		var $copied_message = document.getElementById("copied-message");
		var $search_cont = document.getElementById("search");
		var $sinput = document.getElementById("sinput");
		var $no_matches_cont;
		var $no_matches_cont_v = document.getElementById("no-matches-cont-v");
		var $versions_cont = document.getElementById("versions-list-cont");
		var $version_cont = document.getElementById("version-cont");
		var $vlist = document.getElementById("v-list-wrapper");
		var $current_version = document.getElementById("current-version");
		var $sb_menu = document.getElementById("sidebar-menu");
		var $sb_footer = document.getElementById("sb-footer");

		// Variables //

		// The request filepath.
		var REQUEST_PATH = "./devdocs/data.json";

		// Functions //

		/**
		 * Find the browser root element. The root element differs
		 *     in browsers. This function determines which to use.
		 *     The returned element element can then be used like
		 *     so: $root.scrollTop = 0;
		 *
		 * @return {HTMLElement} - The browser root element.
		 *
		 * @resource [https://gist.github.com/electerious/7ad886432f55cfcb4222]
		 * @resource [https://medium.com/@bdc/stripe-open-source-behind-the-scenes-59790999dea0]
		 */
		var $sroot = (function() {
			if ("scrollingElement" in document) {
				return document.scrollingElement;
			}

			var initial = document.documentElement.scrollTop;
			document.documentElement.scrollTop = initial + 1;

			var updated = document.documentElement.scrollTop;
			document.documentElement.scrollTop = initial;

			return updated > initial ? document.documentElement : document.body;
		})();

		/**
		 * Determines which animation[start|end|iteration] event the user's
		 *     browser supports and returns it.
		 *
		 * @param {string} type - The event type: either start, end, or
		 *     iteration.
		 * @return {string} - The browser prefixed transition event.
		 *
		 * @resource [https://davidwalsh.name/css-animation-callback]
		 * @resource [https://github.com/cgabriel5/snippets/blob/master/js/detection/which_animation_transition_event.js]
		 */
		var which_transition_event = function(type) {
			// Lowercase type.
			type = type.toLowerCase();

			var el = document.createElement("div"),
				transitions = {
					transition: "transition",
					// Opera prefix info:
					// [https://developer.mozilla.org/en-US/docs/Web/Events/transitionend]
					OTransition: "oTransition",
					otransition: "otransition",
					MozTransition: "transition",
					WebkitTransition: "webkitTransition",
					MSTransition: "MSTransition"
				};

			for (var transition in transitions) {
				if (el.style[transition] !== undefined) {
					// Cache value.
					var value = transitions[transition];

					// Determine if suffix needs to be capitalized.
					var end = value.match(/[A-Z]/)
						? type.charAt(0).toUpperCase() + type.substring(1)
						: type;

					// Return prefixed event.
					return value + end;
				}
			}
		};

		/**
		 * Determines which animation[start|end|iteration] event the user's
		 *     browser supports and returns it.
		 *
		 * @param {string} type - The event type: either start, end, or
		 *     iteration.
		 * @return {string} - The browser prefixed transition event.
		 *
		 * @resource [https://davidwalsh.name/css-animation-callback]
		 * @resource [https://github.com/cgabriel5/snippets/blob/master/js/detection/which_animation_transition_event.js]
		 */
		var which_animation_event = function(type) {
			// Lowercase type.
			type = type.toLowerCase();
			var el = document.createElement("div"),
				animations = {
					animation: "animation",
					OAnimation: "oAnimation",
					oanimation: "oanimation",
					MozAnimation: "animation",
					WebkitAnimation: "webkitAnimation",
					MSAnimation: "MSAnimation"
				};
			for (var animation in animations) {
				if (el.style[animation] !== undefined) {
					// Cache value.
					var value = animations[animation];

					// Determine if suffix needs to be capitalized.
					var end = value.match(/[A-Z]/)
						? type.charAt(0).toUpperCase() + type.substring(1)
						: type;

					// Return prefixed event.
					return value + end;
				}
			}
		};

		/**
		 * Debounces provided function.
		 *
		 * @param {function} func - The function to debounce.
		 * @param {number} time - The time to debounce by.
		 * @param {object} scope - The scope in which to run function with.
		 * @param {boolean} run_immediately - Flag indicating whether the
		 *     function should run immediately.
		 *
		 * @return {function} - The new debounced function.
		 *
		 * @resource debouncing function from John Hann
		 * @resource [http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/]
		 * @resource [https://www.paulirish.com/2009/throttled-smartresize-jquery-event-handler/]
		 * @resource [https://davidwalsh.name/javascript-debounce-function]
		 * @resource [https://github.com/cgabriel5/snippets/blob/master/js/function/debounce.js]
		 */
		var debounce = function(func, time, scope, run_immediately) {
			var timeout;
			return function() {
				var context = scope || this,
					args = arguments;

				function delayed() {
					if (!run_immediately) {
						func.apply(context, args);
					}
					timeout = null;
				}
				if (timeout) {
					clearTimeout(timeout);
				} else if (run_immediately) {
					func.apply(context, args);
				}
				timeout = setTimeout(delayed, time || 100);
			};
		};

		/**
		 * Determine correct requestAnimationFrame function.

		 * @return {function} - The correct function to use.
		 *
		 * @resource [https://gist.github.com/mrdoob/838785]
		 * @resource [https://davidwalsh.name/requestanimationframe-shim]
		 */
		var request_aframe = (function() {
			return (
				window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				function(callback) {
					window.setTimeout(callback, 250 / 60);
				}
			);
		})();

		/**
		 * General animation function.
		 *
		 * @param {object} options - The options object.
		 * @return {undefined} - Nothing.
		 *
		 * @resource [https://codereview.stackexchange.com/a/106993]
		 * @resource [https://javascript.info/js-animation]
		 */
		var animate = function(options) {
			options = options || {};

			// Defaults.
			var duration = options.duration || 1000,
				ease =
					options.easing ||
					// Easing functions:
					// [https://github.com/component/ease/blob/master/index.js#L16]
					// [https://github.com/component/ease/blob/master/index.js#L72]
					// [https://kodhus.com/easings/]
					function(n) {
						return --n * n * n + 1;
					},
				noop = function() {},
				onProgress = options.onProgress || noop,
				onComplete = options.onComplete || noop,
				onSkip = options.onSkip || noop,
				from = options.from,
				to = options.to,
				delay = options.delay,
				// Store the timer ID.
				tid,
				// Relay back some meta data.
				meta = {
					// Store the current animation tick.
					tick: 0,
					to: to,
					from: from
				};

			// A from and to value is required.
			if (typeof from !== "number" || typeof to !== "number") {
				return;
			}

			// Runtime variables.
			var startTime = Date.now();

			// Skip animation when the on skip function returns true and
			// just run the callback.
			if (onSkip() === true) {
				return onComplete(startTime, meta);
			}

			function update() {
				var deltaTime = Date.now() - startTime,
					progress = Math.min(deltaTime / duration, 1),
					factor = ease(progress),
					value;

				// Increment the tick.
				meta.tick++;

				// Calculate the value.
				value = meta.from + (meta.to - meta.from) * factor;

				// True or False can be returned to stop animation/prevent
				// callback function.
				var result = onProgress(value, meta);
				// True: Stop animation + Run callback.
				// False: Stop animation + Don't run callback.

				// Stop animation progress when false is returned.
				if (result === true || progress === 1) {
					// Stop animation function AND RUN the callback.
					return onComplete(deltaTime, meta);
				} else if (result === false) {
					// Stop animation function AND DON'T run the callback.
					return;
				}

				// Continue requesting the animation frame.
				tid = request_aframe(update);
			}

			// Add a delay if provided.
			if (delay) {
				setTimeout(function() {
					// Run the first frame request.
					tid = request_aframe(update);
				}, delay);
			} else {
				// Run the first frame request.
				tid = request_aframe(update);
			}

			return {
				// [https://stackoverflow.com/a/31282386]
				cancel: function(cb) {
					(window.cancelAnimationFrame ||
						window.mozCancelAnimationFrame)(tid);

					// Run cancel callback if provided.
					if (cb) {
						cb.call(this, meta);
					}
				}
			};
		};

		/**
		 * Creates the target elements path (target elements parents).
		 *
		 * @param {eventobject} event - The browsers EventObject.
		 * @return {array} parents - The created path array containing
		 *     the target elements parent elements.
		 *
		 * @resource [https://github.com/cgabriel5/snippets/blob/master/js/events/event_path.js]
		 */
		var build_path = function(event) {
			// Cache target element.
			var element = event.target;

			// There must be a target element...else return empty path.
			if (!event.target) {
				return [];
			}

			// Start building path.
			var parents = [element];

			while (element) {
				// The current parent element.
				element = element.parentNode;
				// If parent exists add to array.
				if (element) {
					parents.push(element);
				}
			}

			// Finally, return the path!
			return parents;
		};

		/**
		 * Determine whether the provided element contains a parent with the
		 *     provided class. If a class is not provided, a custom function
		 *     function can be provided. This function basically acts as a
		 *     delegate check function. The current looped over parent is
		 *     provided. Do what is needed with the check and return the
		 *     parent if the check passes.
		 *
		 * @param  {htmlelement} $el - The HTML element.
		 * @param  {string|null} classname - The optional class name parent
		 *     must have.
		 * @param  {function} cb - If a classname is not provided, a custom
		 *     function can be provided to check for needed parent.
		 * @return {htmlelement|false} - The HTML element if check passes.
		 *     Otherwise, false.
		 */
		var is_target_el = function($el, classname, cb) {
			// Get the target element parents.
			var parents = build_path({ target: $el });

			// Loop over the parents and check if any is a header
			// element.
			for (var i = 0, l = parents.length; i < l; i++) {
				var parent = parents[i];

				// If a custom function is provided run it.
				if (cb) {
					// Run the function.
					var result = cb.call(parent, parent, $el, parents);
					if (result) {
						return result;
					}
				} else if (classname) {
					// Get the classes.
					var clist = parent.classList;
					// Check if the parent contains the provided class.
					if (clist && clist.contains(classname)) {
						return parent;
					}
				}
			}

			// Not the element needed.
			return false;
		};
		is_target_el.code_pre_code_element = function(parent /*$el, parents*/) {
			// The parent must be a:
			// - pre element
			// - contain only 1 child
			// - child must contain the class "lang-*"

			// The element must either be the code or the
			// pre element.
			if (
				(parent.classList &&
					parent.tagName === "CODE" &&
					/\slang-.*\s/.test(" " + (parent.className || "") + " ")) ||
				(parent.classList && parent.tagName === "PRE")
				// && parent.children.length === 2
			) {
				// If the element is the code element reset
				// the element to the parent element.
				if (parent.tagName === "CODE") {
					parent = parent.parentNode;
				}

				return parent;
			}
		};

		/**
		 * Parse the URL query parameters.
		 *
		 * @return {object} - Object containing the parameter pairs.
		 */
		var parameters = function() {
			// Get the query.
			var query = location.search.replace(/^\?/, "");

			// Contain parameter key/values here.
			var params = {};

			// Only parse if not empty.
			if (query.trim() !== "") {
				// Loop over pairs.
				query.split("&").forEach(function(part) {
					var delimiter_index = part.indexOf("=");
					var key = decodeURIComponent(
						part.substring(0, delimiter_index)
					);
					var value = decodeURIComponent(
						part.substring(delimiter_index + 1, part.length)
					);
					params[key] = value;
				});
			}

			return params;
		};
		parameters.build = function(params) {
			// Contain params here.
			var search = [];

			// If empty return an empty string.
			if (Object.keys(params).length === 0) {
				return "";
			}

			// Keep a counter for ?/&.
			var i = 0;

			// Empty the headers object.
			for (var param in params) {
				if (params.hasOwnProperty(param)) {
					search.push(
						i === 0 ? "?" : "&",
						`${param}=${encodeURIComponent(params[param])}`
					);

					i++;
				}
			}

			// Join and return the string.
			return search.join("");
		};

		/**
		 * Scroll to bottom of page.
		 *
		 * @return {undefined} - Nothing.
		 *
		 * @resource [https://stackoverflow.com/a/33193668]
		 */
		var scroll_to_bottom = function() {
			$sroot.scrollTop = $sroot.scrollHeight;
		};

		/**
		 * Get the amount page the has been y-scrolled as a percent.
		 *
		 * @return {number} - The percent scrolled.
		 *
		 * @resource [https://stackoverflow.com/a/8028584]
		 */
		var percent_scrolled = function() {
			var h = document.documentElement,
				b = document.body,
				st = "scrollTop",
				sh = "scrollHeight";

			// Calculate the percent.
			var percent =
				(h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight) * 100;

			// If the page is not scrollable reset the percent to 0.
			if (h.scrollHeight === h.clientHeight) {
				percent = 0;
			}

			// Return the percent.
			return percent;
		};

		/**
		 * Detect whether device supports touch events.
		 *
		 * @return {boolean} - Boolean indicating touch support.
		 *
		 * @resource [https://stackoverflow.com/a/20293441]
		 */
		var touchsupport = function() {
			try {
				document.createEvent("TouchEvent");
				return true;
			} catch (e) {
				return false;
			}
		};

		/**
		 * Return the UAParser parsed user agent object.
		 *
		 * @return {object} - The UAParser object.
		 */
		var user_agent = function() {
			return UAParser(navigator.userAgent);
		};

		/**
		 * Detect whether viewport is within "mobile" size.
		 *
		 * @return {boolean} - Boolean indicating whether in "mobile" size.
		 */
		var is_mobile_viewport = function() {
			return !window.matchMedia("(min-width: 769px)").matches;
		};

		/**
		 * Detect whether the device is a "mobile" device. Basically anything
		 *     other than a desktop device.
		 *
		 * @return {boolean} - Boolean indicating whether device is "mobile".
		 */
		var is_mobile = function() {
			return user_agent().device.type;
		};

		/**
		 * Determine whether browser Webkit based, running on a desktop device
		 *     and is not MacOS.
		 *
		 * @return {boolean} - Boolean indicating whether the above conditions
		 *     are true.
		 */
		var is_desktop_webkit = function() {
			// Get the user agent object.
			var ua = user_agent();

			return (
				// No MacOS.
				ua.os.name !== "Mac OS" &&
				// Only Webkit browsers.
				ua.engine.name === "WebKit" &&
				// Must be a desktop device.
				!ua.device.type
			);
		};

		/**
		 * Create and insert a <style> element into the DOM.
		 *
		 * @param  {string} content - The CSS definitions.
		 * @param  {string} title - Optional sheet title.
		 * @return {htmlelement} - The reference to the style element.
		 *
		 * @resource [https://stackoverflow.com/a/38063486]
		 * @resource [https://stackoverflow.com/q/524696]
		 * @resource [https://stackoverflow.com/q/8209086]
		 */
		var stylesheet = function(content, title) {
			// Create element.
			var style = document.createElement("style");

			// Set type.
			style.type = "text/css";

			// Set the title if provided.
			if (title) {
				style.setAttribute("data-title", title);
			}

			// Add the title marker to the contents.
			var contents = `/*title:${title}*/\n` + content;

			// Support for IE.
			if (style.styleSheet) {
				style.styleSheet.cssText = contents;
			} else {
				// All other browsers.
				style.appendChild(document.createTextNode(contents));
			}

			// Append element to head tag.
			document.getElementsByTagName("head")[0].appendChild(style);

			return style;
		};

		/**
		 * Get the CSS style element based on a function logic.
		 *
		 * @param  {function} cb - The function logic.
		 * @return {object} - The style element else undefined.
		 *
		 * @resource [https://developer.mozilla.org/en-US/docs/Web/API/DocumentOrShadowRoot/styleSheets#Examples]
		 */
		stylesheet.get = function(cb) {
			// Get the stylesheets.
			var sheets = document.getElementsByTagName("style");

			// Loop over and return the sheet with the matching title.
			for (let i = 0, l = sheets.length; i < l; i++) {
				// Cache the sheet.
				var sheet = sheets[i];

				cb.apply(sheet, [sheet, sheet.innerHTML, sheets]);
			}

			return;
		};

		/**
		 * Remove <style> element(s) from the DOM.
		 *
		 * @param  {function} cb - The remove function logic. Must return
		 *     true to remove.
		 * @return {undefined} - Nothing.
		 */
		stylesheet.remove = function(cb) {
			// Get the stylesheets.
			var sheets = document.getElementsByTagName("style");

			// Loop backwards and run the remove logic function.
			for (let i = sheets.length - 1; i > -1; i--) {
				// Cache the sheet.
				var sheet = sheets[i];

				// If callback returns true the sheet gets removed.
				if (cb.apply(sheet, [sheet, sheet.innerHTML, sheets])) {
					sheet.parentNode.removeChild(sheet);
				}
			}
		};

		/**
		 * Add a definition (selector:rule) to a style sheet.
		 *
		 * @param {object} sheet - The style sheet object.
		 * @param {string} selector - The CSS definition selector.
		 * @param {string} rules - The CSS definition rules.
		 * @param {number} index - The position of definition insertion.
		 * @return {undefined} - Nothing.
		 *
		 * @resource [https://davidwalsh.name/add-rules-stylesheets]
		 */
		stylesheet.definition = function(sheet, selector, rules, index) {
			// Default to the end of the sheet if index not provided.
			index = index || sheet.cssRules.length;

			// For browsers that support insertRule.
			if ("insertRule" in sheet) {
				sheet.insertRule(`${selector}{${rules}}`, index);
			} else if ("addRule" in sheet) {
				// Else default second function.
				sheet.addRule(selector, rules, index);
			}
		};

		/**
		 * Run a function on the stylesheet objects.
		 *
		 * @param  {function} cb - The function logic.
		 * @return {undefined} - Nothing.
		 */
		stylesheet.sheets = function(cb) {
			// Get the sheets.
			var sheets = document.styleSheets;

			// Loop over and return the sheet with the matching title.
			for (let i = 0, l = sheets.length; i < l; i++) {
				// Cache the sheet.
				var sheet = sheets[i];

				// Run the callback.
				cb.apply(sheet, [sheet, sheets]);
			}
		};

		/**
		 * Get the provided element's top coordinates.
		 *
		 * @return {number} - The top position.
		 */
		var coors = function($el) {
			// Get the rect information.
			var rect = $el.getBoundingClientRect();

			// Add the page coor positions.
			rect.pageY = rect.top + window.pageYOffset;
			rect.pageX = rect.left + window.pageXOffset;

			// Return rect object.
			return rect;
		};

		/**
		 * Select the text of an element.
		 *
		 * @param  {htmlelement} $el - The element.
		 * @return {undefined} - Nothing.
		 *
		 * @resource [https://www.sanwebe.com/2014/04/select-all-text-in-element-on-click]
		 */
		var selection = function($el) {
			// Clear any current selection.
			selection.clear();

			// Create the selection...

			var sel, range;
			if (window.getSelection && document.createRange) {
				//Browser compatibility
				sel = window.getSelection();
				if (sel.toString() === "") {
					//no text selection
					window.setTimeout(function() {
						range = document.createRange(); //range object
						range.selectNodeContents($el); //sets Range
						sel.removeAllRanges(); //remove all ranges from selection
						sel.addRange(range); //add Range to a Selection.
					}, 1);
				}
			} else if (document.selection) {
				//older ie
				sel = document.selection.createRange();
				if (sel.text === "") {
					//no text selection
					range = document.body.createTextRange(); //Creates TextRange object
					range.moveToElementText($el); //sets Range
					range.select(); //make selection.
				}
			}
		};
		selection.clear = function() {
			// First clear any current range selection.
			// [https://stackoverflow.com/a/3171348]
			var sel = window.getSelection
				? window.getSelection()
				: document.selection;
			if (sel) {
				if (sel.removeAllRanges) {
					sel.removeAllRanges();
				} else if (sel.empty) {
					sel.empty();
				}
			}
		};

		/**
		 * Checks whether the new Event constructor is supported.
		 *
		 * @return {boolean} - Boolean indicating support.
		 *
		 * @resource [https://stackoverflow.com/a/26596324]
		 * @resource [https://stackoverflow.com/a/42089476]
		 */
		var is_event_support = function() {
			return typeof Event === "function";
		};

		/**
		 * Escapes string to use it as a RegExp pattern.
		 *
		 * @param  {string} string - The literal string to escape.
		 * @return {string} - The escaped string.
		 *
		 * @resource [https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript]
		 * @resource [https://stackoverflow.com/a/30851002]
		 */
		var regexp_escape = function(string) {
			return string.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, "\\$&");
		};

		/**
		 * Check whether the child element is in "view" or hidden
		 *     in the parent's overflow.
		 *
		 * @param  {htmlelement} container - The parent element.
		 * @param  {htmlelement} element - The child element.
		 * @param  {modifier} modifier - An optional modifier function to
		 *     modify the dimensions if needed. For example, if the parent's
		 *     top value needs an offset applied this can be done.
		 * @return {object} - Object containing visibility information.
		 *
		 * @resource [https://stackoverflow.com/a/37285344]
		 */
		var is_in_view = function($cont, $el, modifier) {
			// Get the container dimensions (top, bottom, height).
			var ccoors = coors($cont);
			var ctop = ccoors.top;
			var cbottom = ccoors.bottom;
			var cheight = ccoors.height;

			// Get the element dimensions (top, bottom, height).
			var ecoors = coors($el);
			var etop = ecoors.top;
			var ebottom = ecoors.bottom;
			var eheight = ecoors.height;

			// Apply modifier if provided.
			if (modifier) {
				var mods = modifier({
					ctop: ctop,
					cbottom: cbottom,
					cheight: cheight,
					ccoors: ccoors,
					etop: etop,
					ebottom: ebottom,
					eheight: eheight,
					ecoors: ecoors
				});

				// Reset values.
				ctop = mods.ctop;
				cbottom = mods.cbottom;
				cheight = mods.cheight;

				etop = mods.etop;
				ebottom = mods.ebottom;
				eheight = mods.eheight;
			}

			// Visibility vars.
			var complete = false;
			var level = null;
			var partial = false;
			var percent = 0;

			// Check for complete visibility: The element's dimensions.
			// must fall within the container's.
			if (etop >= ctop && ebottom <= cbottom) {
				complete = true;

				// Calculate the visibility percentage.
				percent = 100;

				// Calculate the level (1-5).
				// Break down view into 5 sections.
				var levels = [];
				var breakdown_percentage = cheight / 4;
				var brdn_prctg = 0;
				while (brdn_prctg <= cheight) {
					levels.push(brdn_prctg);
					brdn_prctg = brdn_prctg + breakdown_percentage;
				}

				/**
				 * Find the closest number in an array.
				 *
				 * @param  {array} array - The array or numbers to check against.
				 * @param  {number} num - The number.
				 * @return {number} - The closest number in array with respect to
				 *    provided number.
				 *
				 * @resources [https://stackoverflow.com/a/19277804]
				 */
				var closest = function(array, num) {
					return array.reduce(function(prev, curr) {
						return Math.abs(curr - num) < Math.abs(prev - num)
							? curr
							: prev;
					});
				};

				// Get the level.
				var nearest = closest(levels, etop);
				levels.filter(function(lvl, index) {
					if (lvl === nearest) {
						level = index + 1;
						return level;
					}
				});
			} else {
				// Check for partial visibility (top or bottom).
				if (etop < ctop && ebottom > ctop) {
					// Top-partial visibility.
					partial = "top";

					// Calculate the visibility percentage.
					percent = Math.abs(ebottom - ctop) / eheight * 100;

					// It's at the very top (highest level).
					level = 1;
				} else if (etop < cbottom && ebottom > cbottom) {
					// Bottom-partial visibility.
					partial = "bottom";

					// Calculate the visibility percentage.
					percent = Math.abs(cbottom - etop) / eheight * 100;

					// It's at the very bottom (lowest level).
					level = 5;
				}
			}

			// Return results.
			return {
				complete: complete,
				level: level,
				partial: partial,
				percent: percent
			};
		};

		/**
		 * Get the time ago from a timestamp given in milliseconds.
		 *
		 * @param  {number} timestamp - The timestamp in milliseconds (not UNIX).
		 * @return {string} - The "time ago" (i.e. 1 minute ago).
		 *
		 * @resource [https://github.com/simonlc/epoch-timeago/blob/master/src/index.js]
		 * @resource [https://stackoverflow.com/a/5971324]
		 * @resource [https://stackoverflow.com/a/11072549]
		 */
		var timeago = function(timestamp) {
			// Timestamp must be a number.
			if (!timestamp || typeof timestamp !== "number") {
				return undefined;
			}

			// Get the elapsed time.
			var elapsed = Date.now() - (timestamp || 0);

			// Time segment breakdown information.
			var time_segments = [
				["year", "1 year ago", 3.154e10],
				["month", "1 month ago", 2.628e9],
				["week", "1 week ago", 6.048e8],
				["day", "1 day ago", 8.64e7],
				["hour", "1 hour ago", 3.6e6],
				["minute", "1 minute ago", 60000],
				["second", "just now", -Infinity]
			];

			// Find the time segment to grab the needed segment array.
			for (let i = 0, l = time_segments.length; i < l; i++) {
				var cur = time_segments[i];
				if (elapsed > cur[2]) {
					// Format and return the time ago.
					return (function(unit, singular, time_segment, time) {
						return unit === "second"
							? singular
							: time >= 2 * time_segment
								? Math.floor(time / time_segment) +
									" " +
									unit +
									"s ago"
								: singular;
					})(cur[0], cur[1], cur[2], elapsed);
				}
			}
		};

		/**
		 * Formats template with provided data object.
		 *
		 * @param {string} template - The template to use.
		 * @param {object} data - The object containing the data to replace
		 *     placeholders with.
		 * @return {undefined} - Nothing.
		 */
		var format = function(template, data) {
			return template.replace(/\{\{\#(.*?)\}\}/g, function(match) {
				match = match.replace(/^\{\{\#|\}\}$/g, "");
				return data[match] ? data[match] : match;
			});
		};

		/**
		 * Remove/add an element's classes.
		 *
		 * @param-1 {htmlelement} - The element to remove/add classes to.
		 * @param-2:N {object} data - The classes to remove/add.
		 * @return {classlist} - The element's 'classList' property.
		 */
		var classes = function() {
			// Turn the arguments into an array.
			var args = Array.prototype.slice.call(arguments);

			// Get the element.
			var $el = args.shift();
			// Get the class list.
			var clist = $el.classList;

			// Add/remove classes.
			for (let i = 0, l = args.length; i < l; i++) {
				// Cache current loop item.
				var name = args[i];

				// Check whether removing or adding.
				var remove = /^\!/.test(name);

				// Remove the ! identifier.
				name = name.replace(/^\!/g, "");

				// Add/remove the class name.
				clist[remove ? "remove" : "add"](name);
			}

			// Return the class list.
			return clist;
		};

		// ------------------------------------------------------------

		// Start the logo/splash animations.
		classes($splash_icon, "off");

		var __data;

		// Create a new HTTP request.
		var req = new http(REQUEST_PATH);
		// Parse the data as JSON.
		req.parseJSON(true);
		// Listen to the HTTP request progress event.
		// req.events({
		// 	progress: loader
		// });
		// Run the request.
		req
			.run()
			.then(function(xhr) {
				if (
					xhr.status >= 200 &&
					xhr.status < 300 &&
					xhr.readyState === 4
				) {
					// Return the JSON response.
					return xhr.responseJSON;
				} else {
					return Promise.reject(
						"Failed to load configuration data file."
					);
				}
			})
			.then(function(data) {
				__data = data;

				// Get the version.
				var params = parameters();

				// Get the version.
				var version = params.v;
				if (!version) {
					// Get the latest version.
					version = data.latest;

					if (!version) {
						// Reject if no version supplied.
						return Promise.reject("No version was supplied.");
					}
				}

				// Create a new HTTP request.
				var req = new http(
					REQUEST_PATH.replace(
						/^(.*)\/data\.json/,
						`$1/data-${version}.json`
					)
				);
				// Parse the data as JSON.
				req.parseJSON(true);
				// Run the request.

				return req.run();
			})
			.then(function(xhr) {
				if (
					xhr.status >= 200 &&
					xhr.status < 300 &&
					xhr.readyState === 4
				) {
					// Return the JSON response.
					return xhr.responseJSON;
				} else {
					// If the version data file could not be loaded, it more
					// than likely does not exist. Therefore, hide the sidebar
					// elements, remove the splash screen and inject the 404
					// version file HTML content.

					// Hide the splash screen, side bar elements.
					classes($splash, "none");
					classes($search_cont, "none");

					// Get the version.
					let version = parameters().v;

					// Get the versions array.
					var versions = __data.versions;

					if (versions.length) {
						// Finally inject the 404 version HTML.
						$markdown.innerHTML = format(
							__data.files.internal._404_version,
							{
								version: `<code>v${version}</code>`,
								version_html: versions.length
									? versions
											.map(function(item) {
												return `<div class="found-versions-cont"><a href="?v=${item}"><code class="found-versions flex flex-center"><i class="fas fa-external-link-square-alt mr5"></i>v${item}</code></a></div>`;
											})
											.join("")
									: ""
							}
						);

						// Show the versions list if versions exists.
						classes(
							document.getElementById("existing-versions-cont"),
							"!none"
						);
						// Add the message.
						document
							.getElementsByClassName("error-msg-2")[0]
							.insertAdjacentHTML(
								"beforeend",
								versions.length
									? " Docs exist for:"
									: " No other versions exist."
							);
					} else {
						// If there are no docs at all show that specific HTML error.
						$markdown.innerHTML =
							__data.files.internal._404_missing_docs;
					}

					// Throw error to stop further code execution.
					return Promise.reject(
						`Failed to load ${parameters().v} data file.`
					);
				}
			})
			.then(function(data) {
				// Combine the data sets.
				__data.dirs = data.dirs;
				__data.html.menu = data.menu;
				__data.outputpath = data.outputpath;

				// Get the file contents.
				var contents = {};
				__data.dirs.forEach(function(dir) {
					contents = Object.assign(contents, dir.contents);
				});
				__data.files.user = contents;

				// Get the first file.
				__data.first_file = __data.dirs[0].first_file;

				// Reset the var.
				data = __data;

				/**
				 * Add MacOS scrollbars style sheet.
				 */
				(function() {
					// Only if engine is webkit.
					if (user_agent().engine.name !== "WebKit") {
						return;
					}

					// Create the stylesheet.
					var sheet = stylesheet(
						data.html.styles_macos_sb.join(""),
						"dd/mac-scrollbars"
					);

					// Only enable MacOS style scrollbars when running Chrome
					// on a desktop device.
					if (!is_desktop_webkit()) {
						sheet.disabled = true;
					}
				})();

				setTimeout(function() {
					// Turn the logo green.
					classes($splash_icon, "on");
				}, 100);

				// Set the title if provided.
				if (data.title) {
					document.title = data.title;

					// Set the topbar information.
					$crumbs_folder.textContent = data.title;
				}

				// Note: Pre-load logo to prevent "blinking in".
				return new Promise(function(resolve, reject) {
					// Get the logo source/SVG data object.
					var logo = data.logo;

					// Load image if provided in data object.
					if (logo) {
						// If an SVG is provided...
						if (typeof logo === "object") {
							resolve(data);
						} else {
							// Create HTMLImageElement instance for non SVG image.
							var image = new Image();

							// Attach event listeners to image instance.
							image.onload = function() {
								// Get photo dimensions.
								var w = this.width;
								var h = this.height;

								// Reset the logo data.
								data.logo = {
									width: w,
									height: h,
									src: logo,
									type:
										w === h
											? "square"
											: w > h ? "landscape" : "portrait"
								};

								resolve(data);
							};
							image.onerror = function() {
								reject();
							};

							// Add the image source file.
							image.src = logo;
						}
					} else {
						// If the data object does not contain an image simply
						// resolve the promise to continue with the chain.
						resolve(data);
					}
				}).then(null, function() {
					return Promise.reject("Failed to load logo.");
				});
			})
			.then(function(data) {
				// console.log(data);

				// Animate the logo.
				classes($splash_icon, "animate-pulse");

				// Variables:Scoped:Inner //

				// Store the currently displayed file.
				var current_file;
				var menu_anim_timer;
				var sb_animation;
				var $sb_animation_header;
				var sb_active_el_loader;
				var clipboardjs_instance;
				var codeblock_scroll;
				var sidebar_menu_scroll;
				var timeago_timer;

				// Functions:Scoped:Inner //

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
					} animate-spin" style="min-width:${size}px;min-height:${size}px;"></div>`;
				}

				function show_tb_loader() {
					// Show the topbar loader.
					classes($loadertop, "!none");

					// Show the main overlay.
					classes($moverlay, "!none");

					// Show the topbar loader.
					$tb_loader.innerHTML = cssloader(15);
					classes($tb_loader, "!none");
				}

				function hide_tb_loader() {
					// Show the topbar loader.
					classes($loadertop, "none");

					// Show the main overlay.
					classes($moverlay, "none");

					// Hide the topbar loader.
					classes($tb_loader, "!add");
					$tb_loader.innerHTML = "";
				}

				function show_loader($el) {
					if (!$el) {
						return;
					}

					// Hide the previous sb filename loader.
					if (sb_active_el_loader) {
						hide_loader(sb_active_el_loader, true);
					}

					show_tb_loader();

					// Show the sidebar loader next to filename.
					// Hide the arrow element.
					classes($el.children[0], "none");
					// Add the loader.
					$el.children[0].insertAdjacentHTML(
						"afterend",
						cssloader(10, true)
					);
					classes($el.children[1], "mr5");

					// Set the flag.
					sb_active_el_loader = $el;
				}

				function hide_loader($el, skip) {
					if (!$el) {
						return;
					}

					if (skip) {
						// Hide the sidebar loader next to filename.
						// Add the loader.
						$el.removeChild($el.childNodes[1]);
						// Hide the arrow element.
						classes($el.children[0], "!none");

						return;
					} else {
						hide_tb_loader();

						// Reset the flag.
						sb_active_el_loader = null;

						// Hide the sidebar loader next to filename.
						// Add the loader.
						$el.removeChild($el.childNodes[1]);
						// Hide the arrow element.
						classes($el.children[0], "!none");
					}
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
					prevent_mousemove_expanders = true;

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
					document.addEventListener(
						"touchmove",
						scroll.animation_handler,
						{
							passive: false
						}
					);
					document.addEventListener(
						"wheel",
						scroll.animation_handler,
						false
					);
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
							var de = document.documentElement;
							if (
								// When the page is not scrollable
								// (no overflow), skip to immediately invoke
								// the callback.
								de.scrollHeight === de.clientHeight ||
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
							if (
								// When scrolling down and percent scrolled
								// is >= 100 stop animation.
								Math.round(percent_scrolled()) >= 100 &&
								Math.sign(meta.from - meta.to) === -1
							) {
								// Scroll to the bottom of the page.
								scroll_to_bottom();

								return true;
							}

							// Reset the to var if the check for sticky header is set.
							if (
								check_stickyheader &&
								!update_check_stickyheader
							) {
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
							prevent_mousemove_expanders = null;

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
					return is_mobile_viewport()
						? // For "mobile" size.
							coors($el.nextElementSibling).pageY -
								($topbar.clientHeight + $el.clientHeight)
						: // Desktop size.
							coors($el).pageY - 10;
				};
				scroll.animation_handler = function(e) {
					// Cancel event if no animation is ongoing.
					if (!scroll.animation) {
						return;
					}

					// Keys can also be used: up/down/space-bar/esc keys will
					// cancel the animation.
					if (
						e.type === "keydown" &&
						![38, 40, 32, 27].includes(e.which)
					) {
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

				// Contain all content headers.
				var headers = {};

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

					// Take that into account the markdown body top margin.
					var offset =
						getComputedStyle(
							$markdown.children[0],
							null
						).marginTop.replace("px", "") * 1;

					// Get the headers.
					var $headers = document.querySelectorAll(
						"h1,h2,h3,h4,h5,h6"
					);
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

						var $parent = $header.parentNode;
						// If the parent is a header return that.
						if (/h\d/i.test($parent.tagName.toLowerCase())) {
							return $parent;
						}

						var $wrapper = is_target_el(
							$header,
							"header-content-ddwrap"
						);
						if ($wrapper) {
							var $next = $wrapper.nextElementSibling;
							if ($next) {
								var $fchild = $next.firstChild;
								if (
									/h\d/i.test($fchild.tagName.toLowerCase())
								) {
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
					var $blocks = document.querySelectorAll(
						"pre code[class^='lang']"
					);

					// Loop over blocks...
					for (var i = 0, l = $blocks.length; i < l; i++) {
						let $block = $blocks[i];
						let $parent = $blocks[i].parentNode;
						let $third = $parent.querySelectorAll(
							".line-nums.third"
						)[0];

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
				var inject_sidebae_tops_css = function() {
					// Remove the needed stylesheets.
					stylesheet.remove(function(sheet, contents) {
						// Check if the contents contains the title.
						return contents.includes(
							`/*title:dd/sidebar-sticky-tops-`
						);
					});

					// Get the search container height.
					var height = Math.floor(coors($search_cont).height); // - 1;
					if (height >= 79) {
						height = 78;
					}

					// CSS definitions.
					var definitions = [
						`.l-2 {top: ${height}px;}`,
						`@media (max-width: 1024px) {.l-2 {top: ${height}px;}}`
					];

					// Create the stylesheet.
					var sheet = stylesheet(
						definitions.join(""),
						"dd/sidebar-sticky-tops-desktop"
					);

					// Reset the definitions if on a mobile device.
					if (is_mobile()) {
						// Viewport >= 1024px.
						if (window.matchMedia("(min-width: 1024px)").matches) {
							if (
								!stylesheet.get(function(sheet, contents) {
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
								!stylesheet.get(function(sheet, contents) {
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

				// Contain all the sidebar submenu heights.
				var heights = {};
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
					var clone = $new_current.nextElementSibling.cloneNode(true);
					// Set the height to its normal height.
					clone.style.height = "auto";

					// Get the height using a virtual dom.
					var html = `<div id="virtual-height-element">${
						clone.outerHTML
					}</div>`;

					// Inject the clone to the DOM.
					document
						.getElementsByTagName("body")[0]
						.insertAdjacentHTML("afterbegin", html);

					// Get the virtual element.
					var $vel = document.getElementById(
						"virtual-height-element"
					);

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
					var clone = $markdown.cloneNode(false);
					clone.innerHTML = content;
					$markdown.parentNode.replaceChild(clone, $markdown);
					// $markdown.innerHTML = content;

					// Re-grab the markdown element.
					$markdown = document.getElementById("markdown");

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
					var dirs = data.dirs[0].files;
					for (var i = 0, l = dirs.length; i < l; i++) {
						if (dirs[i].dirname === filename) {
							filename = dirs[i].alias;
							break;
						}
					}

					// Get the needed element.
					var $scroll_tb_file_cont = document.getElementById(
						"crumbs-file"
					);

					// If a file name exists, set it.
					if (filename) {
						classes($scroll_tb_file_cont, "!none");
						$crumbs_filename.textContent = filename;
					} else {
						// Else, hide the element.
						classes($scroll_tb_file_cont, "none");
					}
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
					if (filename === current_file) {
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

									classes(
										$parent,
										"animate-header-highlight"
									);
								}, 0);
							}
						}

						hide_tb_loader();
						// show_loader($new_current);

						// Cancel any current sidebar menu scroll.
						if (sidebar_menu_scroll) {
							sidebar_menu_scroll.cancel();
						}

						// Scroll to the menu item.
						sidebar_menu_scroll = animate({
							from: $sidebar.scrollTop,
							to: $new_current.nextElementSibling.offsetTop + 15,
							duration: 300,
							onSkip: function() {
								// Get visibility information.
								var inview = is_in_view(
									$sidebar,
									$new_current,
									function(vals) {
										// Reset needed values.
										vals.ctop =
											vals.ctop +
											$search_cont.clientHeight;
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
								sidebar_menu_scroll = null;
							}
						});

						return;
					}

					// Disable mouse events.
					classes($markdown, "pnone");

					show_loader($new_current);

					// Add the loading content class.
					classes($markdown, "loading-content");

					// Default to the first file when one does not exist.
					if (!current_file) {
						current_file = data.first_file;
					}

					// Get the file content.
					var file = data.files.user[filename];

					// Show 404 file when selected file does not exist.
					if (!file) {
						var error_404 = "_404";
						file = data.files.internal[error_404];
						filename = error_404;
					}

					// Un-highlight/Highlight:

					// Un-highlight the current highlighted menu element.
					var $current = document.querySelector(
						`[data-file="${current_file}"]`
					);
					if ($current) {
						let $parent = $current.parentNode;
						// Remove the highlight.
						classes($parent, "!active-page", "!ACTIVE-PAGE--");

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
									getComputedStyle($ul).height.replace(
										"px",
										""
									) * 1,
								to: 0,
								duration: 250,
								onSkip: function() {
									if (!$ul) {
										return true;
									}
								},
								onProgress: function(val) {
									$ul.style.height = `${val}px`;
								},
								onComplete: function() {
									var $ulp = document.querySelector(
										`.menu-section[data-dir='${id.split(
											"."
										)[0] *
											1 -
											1}']`
									).children[1];

									// Remove the UL if it exists.
									if ($ul && $ulp.contains($ul)) {
										// $ulp.removeChild($ul);
										document
											.getElementById(
												`parent-menu-file-${id}`
											)
											.removeChild($ul);
									}
								}
							});
						}

						// Un-highlight the menu arrow and reset to right
						// position.
						let menu_arrow = $parent.children[0];
						let menu_classes = menu_arrow.classList;
						menu_classes.remove("menu-arrow-active");
						menu_classes.remove("fa-caret-down");
						menu_classes.add("fa-caret-right");
					}

					// Set the new highlight for the new current element.
					if (!$new_current && filename !== "_404") {
						$new_current = document.querySelector(
							`[data-file="${filename}"]`
						).parentNode;
					}
					if (filename !== "_404") {
						// Get the menu arrow element and its CSS classes.
						let $menu_arrow = $new_current.children[0];

						// Change text color to blue.
						classes($new_current, "active-page", "ACTIVE-PAGE--");
						// Change the menu arrow to be active (blue/down).
						classes(
							$menu_arrow,
							"menu-arrow-active",
							"!fa-caret-right",
							"fa-caret-down"
						);

						// Animate menu height opening.
						if (menu_anim_timer) {
							clearTimeout(menu_anim_timer);
						}
						menu_anim_timer = setTimeout(function() {
							var id = $new_current.id.replace(/[a-z\-]/g, "");
							var $ul = document.getElementById(
								`menu-headers-${id}`
							);

							if (!$ul) {
								// Embed the current sub-menu list.
								var dirs =
									data.dirs[id.split(".")[0] * 1 - 1].files;
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
								duration: 300,
								onProgress: function(val) {
									$ul.style.height = `${val}px`;
								},
								onComplete: function() {
									// if (_max_height) {
									// 	// Reset the stying to hide the scrollbar.
									// 	classes($ul, "file-headers-active");
									// }

									// Cancel any current sidebar menu scroll.
									if (sidebar_menu_scroll) {
										sidebar_menu_scroll.cancel();
									}

									// Scroll to the menu item.
									sidebar_menu_scroll = animate({
										from: $sidebar.scrollTop,
										to:
											$new_current.nextElementSibling
												.offsetTop + 15,
										duration: 300,
										onSkip: function() {
											// Get visibility information.
											var inview = is_in_view(
												$sidebar,
												$new_current,
												function(vals) {
													// Reset needed values.
													vals.ctop =
														vals.ctop +
														$search_cont.clientHeight;
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
											sidebar_menu_scroll = null;

											$ul.style.opacity = 1;

											// Inject the html.
											replace_html(file);

											// Show the current filename.
											inject_filename(current_file, data);

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
									});
								}
							});
						}, 225);
					} else {
						// 404 File.

						// Inject the html.
						replace_html(file);

						// Show the current filename.
						inject_filename(current_file, data);

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

										classes(
											$parent,
											"animate-header-highlight"
										);

										// Remove optimization.
										perf_unhint($sroot);
									});
								}, 300);
							}
						}
					}

					// Reset the active element.
					current_file = filename;
				}

				/**
				 * Make and insert the bottom navigation UI elements.
				 *
				 * @return {undefined} - Nothing.
				 */
				function bottom_nav() {
					// Get the current active sidebar menu item.
					var $active = document.getElementsByClassName(
						"ACTIVE-PAGE--"
					)[0];

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
						}"><i class="fas fa-arrow-alt-circle-left mr5"></i> <span class="truncate">${$prev_el.getAttribute(
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
						}"><span class="mr5 truncate">${$next_el.getAttribute(
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
					let footer_html = data.html.footer || "";

					// Insert the HTML.
					$footer_ddwrap.insertAdjacentHTML(
						"beforeend",
						html + footer_html
					);
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
					$search_cont.classList[state ? "add" : "remove"]("pnone");
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

				// AppCode:Scoped:Inner //

				// Get the menu elements.
				// [https://davidwalsh.name/nodelist-array]
				var $l_2 = [];

				// Enclose in a timeout to give the loader a chance to fade away.
				setTimeout(function() {
					// Get the logo source/SVG data object.
					var logo = data.logo;

					// Embed the logo to the page if it exists.
					if (logo) {
						// Get the GitHub account information.
						var github = Object.assign(
							{
								// Defaults.
								account_username: "",
								project_name: ""
							},
							data.github
						);

						// Get the GitHub information.
						var uname = github.account_username;
						var pname = github.project_name;

						// Vars.
						var link_start = "",
							link_end = "";

						// Make the link HTML if the GitHub info exists.
						if (uname && pname) {
							link_start = `<a href="https://github.com/${uname}/${pname}/" target="_blank">`;
							link_end = "</a>";
						}

						// Make the needed image HTML.
						var img_html = !logo.data
							? `<img src="${logo.src}">`
							: logo.data;
						var logo_html = `<div class="none animate-fadein animate-logo logo LOGO-- ${
							logo.type
						} mr5">${link_start}${img_html}${link_end}</div>`;

						// Add the needed sidebar logo HTML.
						$search_cont.insertAdjacentHTML(
							"afterbegin",
							'<div class="flex flex-center"></div>'
						);
						// Move around needed child elements.
						$search_cont.children[0].appendChild(
							$search_cont.children[1]
						);
						// Embed the sidebar image.
						$search_cont.children[0].insertAdjacentHTML(
							"afterbegin",
							logo_html
						);

						// Embed the topbar logo.
						$tb_loader.insertAdjacentHTML(
							"beforebegin",
							logo_html
								.replace(" logo ", " flex flex-center logo ")
								.replace(
									"_blank",
									'_blank" class="flex flex-center topbar-fix'
								)
						);

						// Show logos after some time.
						setTimeout(function() {
							var $els = document.getElementsByClassName(
								"LOGO--"
							);
							for (let i = 0, l = $els.length; i < l; i++) {
								classes($els[i], "!none");
							}
						}, 200);
					}

					// Get the version.
					var params = parameters();
					// Get the version.
					var version = params.v || data.latest;

					// Show the versions container.
					classes($version_cont, "!none");
					// Add the versions.
					var versions = data.versions;
					var latest = data.latest;
					var versions_html = [];
					versions.forEach(function(v) {
						versions_html.push(
							`<div class="version-option" data-v="${v}">` +
								(v === version
									? '<i class="fa-check fas mr5"></i>'
									: "") +
								`<span class="VTEXT-- truncate">${v}</span>` +
								(v === latest
									? '<span class="version-latest">latest</span>'
									: "") +
								`</div>`
						);
					});
					// Inject the versions list.
					$vlist.innerHTML = versions_html.join("");
					// Set the current version.
					$current_version.innerHTML = `<i class="fas fa-layer-group mr2"></i> v${version}`; // +
					$current_version.insertAdjacentHTML(
						"afterend",
						version === latest
							? '<span class="version-latest">latest</span>'
							: '<span class="version-latest version-latest-not">not latest</span>'
					);
					$current_version.setAttribute("data-v", version);

					// Inject the needed sidebar menu item tops CSS.
					inject_sidebae_tops_css();

					// Add the sidebar HTML.
					document.getElementById(
						"menu-dynamic-cont"
					).innerHTML = data.html.menu.join("");

					// [https://davidwalsh.name/nodelist-array]
					$l_2 = Array.prototype.slice.call(
						document.getElementsByClassName("L2--")
					);

					// Get the no matches container.
					$no_matches_cont = document.getElementById(
						"no-matches-cont"
					);

					// Animate the entire menu.
					classes($sb_menu, "animate-fadein");

					// Show the sidebar footer.
					classes($sb_footer, "!none");

					// Inject the file contents to the page. Provide the
					// inject function the page parameter or default to the
					// first file when the page parameter does not exist.
					show_tb_loader();
					inject(params.p ? params.p : data.first_file);
				}, 500);

				// EventListeners:Scoped:Inner //

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
					inject(params.p ? params.p : data.first_file);
				});

				// When the URL changes (history) update the HTML content.
				window.addEventListener(
					"resize",
					debounce(function() {
						// If the flag is not set then disable the sheet.
						var sheet = stylesheet.get(function(sheet, contents) {
							// Check if the contents contains the title.
							return contents.includes(
								"/*title:dd/mac-scrollbars*/"
							);
						});

						if (sheet) {
							// Disable the sheet based on user agent condition.
							sheet.disabled = !is_desktop_webkit();
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
						inject_sidebae_tops_css();
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
							text: function(/*trigger*/) {
								return $el
									.getElementsByTagName("code")[0]
									.getAttribute("data-orig-text");
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
					classes($search_cont, "!sinput-focused");

					// Hide the versions container.
					if (
						!$versions_cont.classList.contains("none") &&
						!$versions_cont.contains($target)
					) {
						classes($versions_cont, "none");

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

						if ($target.tagName !== "A") {
							// Get the anchor child element.
							$target = $target.children[0];
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
							$sb_animation_header = $header;

							// Hide the sidebar.
							sb_animation = true;
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
							history.pushState({}, null, `${href}`);
						}

						return;
					} else if (
						clist.contains("hamburger") &&
						$soverlay.style.display !== "block"
					) {
						// The hamburger menu was clicked OR the allowed area
						// range was touched.
						sb_animation = true;

						// Show the sidebar.
						show_sidebar();

						return;
					} else if (clist.contains("sidebar-overlay")) {
						sb_animation = true;

						// Hide the sidebar.
						hide_sidebar();

						return;
					} else if (is_target_el($target, "codeblock-placeholder")) {
						// Reset the target.
						$target = is_target_el(
							$target,
							"codeblock-placeholder"
						);

						// Hide the element.
						classes($target, "none");
						// Show the buttons and the pre element.
						classes($target.nextElementSibling, "!none");
						classes(
							$target.nextElementSibling.nextElementSibling,
							"!none"
						);

						return;
					} else if (is_target_el($target, "btn-cba-collapse")) {
						// Reset the target.
						$target = is_target_el($target, "btn-cba-collapse")
							.parentNode;

						// Hide itself and the pre element.
						classes($target, "none");
						classes($target.nextElementSibling, "none");
						// Show the show element.
						classes($target.previousElementSibling, "!none");

						return;
					} else if (is_target_el($target, "dd-expandable-message")) {
						// Reset the target.
						$target = is_target_el(
							$target,
							"dd-expandable-message"
						);

						// Get the icon.
						var $icon = $target.querySelectorAll("i")[0];

						// Check whether it needs closing or opening.
						if (
							!$target.classList.contains(
								"dd-expandable-message-active"
							)
						) {
							// Add the active class.
							classes($target, "dd-expandable-message-active");
							// Open the contents.
							classes($target.nextElementSibling, "!none");
							// Rotate the icon.
							classes($icon, "dd-expandable-message-icon-active");
						} else {
							// Close the contents.
							classes($target.nextElementSibling, "none");
							// Add the active class.
							classes($target, "!dd-expandable-message-active");
							// Rotate the icon.
							classes(
								$icon,
								"!dd-expandable-message-icon-active"
							);
						}

						return;
					} else if (is_target_el($target, "tab")) {
						// Cancel any current codeblock scroll.
						if (codeblock_scroll) {
							codeblock_scroll.cancel();
						}

						// Reset the target.
						$target = is_target_el($target, "tab");
						// Get the parent.
						var $parent = $target.parentNode;

						// Scroll to the menu item.
						codeblock_scroll = animate({
							from: $parent.scrollLeft,
							to: $target.offsetLeft - 7,
							duration: 225,
							onProgress: function(val) {
								$parent.scrollLeft = val;
							},
							onComplete: function() {
								// Reset the var.
								codeblock_scroll = null;
							}
						});

						// Get the tab index.
						var tindex = $target.getAttribute("data-tab-index") * 1;

						// Get the codegroup.
						var $codegroup =
							$target.parentNode.parentNode.nextElementSibling
								.children;

						// Get the tab elements.
						var $tabs = $target.parentNode.children;

						// Remove the active class.
						for (let i = 0, l = $tabs.length; i < l; i++) {
							classes($tabs[i], "!activetab");
						}
						// Highlight the clicked tab element.
						classes($target, "activetab");

						// Hide all the children except the one that matches
						// the tab index.
						for (let i = 0, l = $codegroup.length; i < l; i++) {
							$codegroup[i].classList[
								i === tindex ? "remove" : "add"
							]("none");
						}

						setTimeout(function() {
							// Reset code block width/highlight.
							reset_cblock_width_highlight();
						}, 300);

						return;
					} else if (is_target_el($target, "search-ui")) {
						// Save a reference to the old target before reset.
						var $tar = $target;
						// Reset the target.
						$target = is_target_el($target, "search-ui");

						var $input = $target.parentNode.getElementsByClassName(
							"SINPUT--"
						)[0];

						if (is_target_el($tar, "SCLEAR--")) {
							trigger_sinput(null, $input);
						}

						classes($search_cont, "sinput-focused");
						$input.focus();

						return;
					} else if (is_target_el($target, "current-version-cont")) {
						// Reset the target.
						// $target = is_target_el($target, "current-version-cont");

						// Show the versions container.
						classes($versions_cont, "!none");

						// Toggle sidebar elements mouse events.
						toggle_sb_elements(true);

						// Un-highlight current last highlighted version.
						var $last = document.querySelector(`.active-version`);
						if ($last) {
							classes($last, "!active-version");
						}
						// Highlight the current
						var $cur = document.querySelector(
							`.version-option[data-v='${$current_version.getAttribute(
								"data-v"
							)}']`
						);
						if ($cur) {
							classes($cur, "active-version");

							// Update the scroll-y position.
							$vlist.scrollTop = $cur.offsetTop;
						}

						// Focus on the input.
						$versions_cont.getElementsByTagName("input")[0].focus();

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
						var current_version = $current_version.getAttribute(
							"data-v"
						);

						// Return if the version is the current version.
						if (version === current_version) {
							// Hide the versions container.
							classes($versions_cont, "none");

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
									classes(
										$header,
										"animate-header-highlight"
									);

									// Remove optimization.
									perf_unhint($sroot);
								},
								$header.classList.contains("ignore-header")
							);

							// Get the anchor href.
							let href = $header
								.getElementsByClassName("ANCHOR--")[0]
								.getAttribute("href");

							// Don't store the same hash. Only store if the hash
							// is different than the current hash.
							if (href && location.hash !== href) {
								history.pushState({}, null, `${href}`);
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
						filename = $target.children[0].getAttribute(
							"data-file"
						);
					} else if (is_target_el($target, "arrow")) {
						// Reset the target.
						$target = is_target_el($target, "arrow");

						// Reset the target to the l-2.
						$target = document.getElementById(
							$target.getAttribute("data-refid")
						);

						// Get the data-attribute.
						filename = $target.children[0].getAttribute(
							"data-file"
						);
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
						filename = data.first_file;

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
						if (filename !== current_file) {
							history.pushState(
								{},
								null,
								`?p=${encodeURIComponent(`${dir}/${file}`)}`
							);
						}

						// Set the HTML.
						inject(filename, $target);

						e.preventDefault();
					}
				});

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
						$moused_el2 = $el;
					}

					// Remove all expanded menu items.
					if (moused_el2_inserts.length) {
						// Reset everything.
						$moused_el2 = null;
						// Remove the elements.
						for (
							var i = 0, l = moused_el2_inserts.length;
							i < l;
							i++
						) {
							$el = moused_el2_inserts[i];
							$el.parentNode.removeChild($el);
						}
						// Clear the array.
						moused_el2_inserts.length = 0;
					}
				}

				var $moused_el2;
				var prevent_mousemove_expanders;
				// var $moused_el3;
				var moused_el2_inserts = [];
				// var moused_el3_inserts = [];
				document.addEventListener("mousemove", function(e) {
					// Prevent expanders when flag is set.
					if (prevent_mousemove_expanders) {
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
						if ($l2 === $moused_el2) {
							return;
						} else {
							// Reset the target.
							$target = $l2;

							remove_expanders($target);

							// Clone the element.
							let $clone = $target.cloneNode(true);
							var $anchor = $clone.getElementsByClassName(
								"truncate"
							)[0];

							// Add clone identifier class.
							classes($clone, "clone-true-l2", "pnone");

							// Remove/add classes.
							classes($anchor, "!l-2-link", "!truncate", "mr5");

							// Check if active.
							var is_active = $target.classList.contains(
								"ACTIVE-PAGE--"
							);

							// Get the position of the element on the page.
							let coors = $target.getBoundingClientRect();
							let yoffset = window.pageYOffset;
							let xoffset = window.pageXOffset;
							let _top = coors.top + yoffset;
							let _left =
								coors.left + xoffset + (is_active ? 1 : 0);

							var bg = !is_active ? "background: #f4f4f4;" : "";

							// Add the coordinates to the clone.
							$clone.setAttribute(
								"style",
								`transition: none;top: ${_top}px;left: ${_left}px;z-index: 2;position: absolute !important;${bg}border-radius: 0 4px 4px 0;font-size:15px;box-shadow: 0px 1px 1px rgba(57,70,78, 0.2), 1px 0px 0px rgba(57,70,78, 0.1);`
							);

							// Add clone to page.
							document.body.insertAdjacentElement(
								"beforeend",
								$clone
							);

							// Get the clone width.
							let cwidth = $clone.getBoundingClientRect().width;
							// Hide the element.
							classes($clone, "none");

							// If the clone is longer than the original target
							// inject the clone.
							if (cwidth > coors.width) {
								moused_el2_inserts.push($clone);

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
						if ($l3 === $moused_el2) {
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
							document.body.insertAdjacentElement(
								"beforeend",
								$clone
							);

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
								moused_el2_inserts.push($wrapper);

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
						classes($search_cont, "!sinput-focused");
					},
					false
				);

				// Unfocus the search input then the escape key it hit.
				document.addEventListener("keydown", function(e) {
					// Focus on the search input.
					if (e.keyCode === 27) {
						// Hide the versions container.
						if (!$versions_cont.classList.contains("none")) {
							classes($versions_cont, "none");

							// Toggle sidebar elements mouse events.
							toggle_sb_elements(false);

							e.preventDefault();
							return;
						}

						// Skip when the element already has focus.
						let $active = document.activeElement;
						if ($active && $active.classList.contains("SINPUT--")) {
							// classes($search_cont, "!sinput-focused");
							$sinput.blur();
							e.preventDefault();
							return;
						}
					} else if (e.keyCode === 86) {
						// If an input is focused return.
						// Skip when the element already has focus.
						let $active = document.activeElement;
						if ($active && $active.classList.contains("SINPUT--")) {
							// e.preventDefault();
							return;
						}

						// Hide the versions container.
						if ($versions_cont.classList.contains("none")) {
							// Show version container by triggering the element.
							$current_version.click();
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
						if ($active && $active.classList.contains("SINPUT--")) {
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
						if (!$versions_cont.classList.contains("none")) {
							// Check what is being focused on.
							// - either a version container
							// - or the input itself

							// Check for an active container.
							let $cur = document.querySelector(
								".active-version"
							);

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
						if (!$versions_cont.classList.contains("none")) {
							// Check what is being focused on.
							// - either a version container
							// - or the input itself

							// Check for an active container.
							let $cur = document.querySelector(
								".active-version"
							);

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

						if ($target.classList.contains("SINPUT--")) {
							if ($target.classList.contains("sinput-main")) {
								// Get the text.
								var text = $target.value.trim();

								// Get the clear element.
								var $clear_search = $target.parentNode.getElementsByClassName(
									"SCLEAR--"
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

									// Start filtering elements.
									for (
										var i = 0, l = $l_2.length;
										i < l;
										i++
									) {
										var item = $l_2[i];
										var title = item.getAttribute(
											"data-title"
										);

										if (
											title
												.toLowerCase()
												.includes(text.toLowerCase())
										) {
											// Switch the flag since there was a
											// a match.
											at_least_one = true;

											// Show it.
											item.style.display = null;
											// Also check for a possible UL.
											let $next = item.nextElementSibling;

											// Highlight the search needle.
											var $anchor = item.getElementsByTagName(
												"a"
											)[0];
											var highlight_title = title.replace(
												new RegExp(
													"(" +
														regexp_escape(text) +
														")",
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
												$next.getAttribute(
													"data-og-height"
												)
											) {
												// Must also match the current file.
												if (
													current_file ===
													item
														.getElementsByTagName(
															"i"
														)[0]
														.getAttribute(
															"data-file"
														)
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
											item.style.display = "none";
											// Also check for a possible UL.
											let $next = item.nextElementSibling;
											if (
												$next &&
												$next.tagName === "UL" &&
												!$next.getAttribute(
													"data-og-height"
												)
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

									// Show no results message when nothing no
									// matches were returned.
									$no_matches_cont.classList[
										at_least_one ? "add" : "remove"
									]("none");
								} else {
									// Hide the clear button.
									classes($clear_search, "none");

									// Hide the no matches container.
									classes($no_matches_cont, "none");

									// Unhide them all.

									// Start filtering elements.
									for (
										let i = 0, l = $l_2.length;
										i < l;
										i++
									) {
										let item = $l_2[i];

										// Show it.
										item.style.display = null;
										// Also check for a possible UL.
										var $next = item.nextElementSibling;

										// Un-highlight the search needle.
										let $anchor = item.getElementsByTagName(
											"a"
										)[0];
										// Insert original title.
										$anchor.innerHTML = item.getAttribute(
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
												current_file ===
												item
													.getElementsByTagName(
														"i"
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

								// Get the clear element.
								let $clear_search = $target.parentNode.getElementsByClassName(
									"SCLEAR--"
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
								var $els = document.querySelectorAll(
									".version-option"
								);

								var first_v = false;
								// Check for an active container.
								var $cur = document.querySelector(
									".active-version"
								);
								if ($cur) {
									classes($cur, "!active-version");
								}

								if (text !== "") {
									// Show the clear button.
									classes($clear_search, "!none");

									let at_least_one = false;

									// Start filtering elements.
									for (
										let i = 0, l = $els.length;
										i < l;
										i++
									) {
										let item = $els[i];
										let title = item.getAttribute("data-v");

										if (
											title
												.toLowerCase()
												.includes(text.toLowerCase())
										) {
											// Highlight the first element.
											if (!first_v) {
												first_v = true;

												classes(item, "active-version");
											}

											// Switch the flag since there was a
											// a match.
											at_least_one = true;

											// Show it.
											item.style.display = null;

											// Highlight the search needle.
											let highlight_title = title.replace(
												new RegExp(
													"(" +
														regexp_escape(text) +
														")",
													"gi"
												),
												"<span class='search-highlight'>$1</span>"
											);
											// Insert the highlighted needle(s).
											item.getElementsByClassName(
												"VTEXT--"
											)[0].innerHTML = highlight_title;
										} else {
											// Hide it.
											item.style.display = "none";
										}
									}

									// Show no results message when nothing no
									// matches were returned.
									$no_matches_cont_v.classList[
										at_least_one ? "add" : "remove"
									]("none");
								} else {
									// Hide the clear button.
									classes($clear_search, "none");

									// Hide the no matches container.
									classes($no_matches_cont_v, "none");

									// Unhide them all.

									// Start filtering elements.
									for (
										let i = 0, l = $els.length;
										i < l;
										i++
									) {
										let item = $els[i];

										// Show it.
										item.style.display = null;

										// Insert original title.
										item.getElementsByClassName(
											"VTEXT--"
										)[0].innerHTML = item.getAttribute(
											"data-v"
										);
									}

									// Set scrollbar back to original scroll
									// position and remove attribute.
									$vlist.scrollTop = $vlist.getAttribute(
										"data-ypos"
									);
									$vlist.removeAttribute("data-ypos");

									// Check for an active container.
									let $cur = document.querySelector(
										".active-version"
									);
									if ($cur) {
										classes($cur, "!active-version");
									}
									classes(
										$vlist.firstChild,
										"active-version"
									);
								}
							}
						}
					},
					true
				);

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
							$target.id === "app" &&
							nodes_added.length &&
							nodes_removed.length &&
							nodes_added[0].id === "markdown" &&
							nodes_removed[0].id === "markdown"
						) {
							// Reset the link-docs.

							// Get the GitHub data.
							var github = data.github;

							// Get the links.
							var $links = [].slice.call(
								document.getElementsByClassName("link-doc")
							);
							// Store the links length.
							var links_length = $links.length;

							// When no links immediately hide the loader to
							// signal "page load" completion.
							if (!links_length) {
								if (sb_active_el_loader) {
									hide_loader(sb_active_el_loader);
								} else {
									hide_tb_loader();
								}
							} else {
								// Else...reset the links then end "page load"
								// completion.

								// Loop over the links.
								$links.forEach(function($link, i) {
									// Get the data-attribute.
									var filename = $link.getAttribute(
										"data-file"
									);
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
										if (
											filename_untouched === "LICENSE.md"
										) {
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
										if (sb_active_el_loader) {
											hide_loader(sb_active_el_loader);
										} else {
											hide_tb_loader();
										}
									}
								});
							}

							// Set up the ClipboardJS.
							// Remove previous clipboardjs instance
							if (clipboardjs_instance) {
								clipboardjs_instance.destroy();
							}
							// Set up the clipboardjs listeners.
							clipboardjs_instance = new ClipboardJS(
								".BTN-COPY--",
								{
									text: function(trigger) {
										// Check whether the button is part of
										// of a codegroup.
										if (
											is_target_el(
												trigger,
												"codeblock-actions-group"
											)
										) {
											// Get the container parent.
											var $cont = is_target_el(
												trigger,
												"codeblock-actions-group"
											);

											// Get the visible code block.
											var $block = $cont.nextElementSibling.querySelectorAll(
												"pre:not(.none)"
											)[0];

											if ($block) {
												// Set the correct id.
												trigger.setAttribute(
													"data-expid",
													$block.getAttribute("id")
												);
											}
										}

										// Get the text content from the pre element.
										return document
											.getElementById(
												trigger.getAttribute(
													"data-expid"
												)
											)
											.getElementsByTagName("code")[0]
											.getAttribute("data-orig-text");
										// .trim();
										// .textContent.trim();
									}
								}
							);

							clipboardjs_instance.on("success", function(/*e*/) {
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
							});

							clipboardjs_instance.on("error", function(/*e*/) {
								if (window.copy_timer) {
									clearTimeout(window.copy_timer);
								}
							});

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
									"MTIME-TS--"
								);

								for (
									let i = 0, l = $mtimes.length;
									i < l;
									i++
								) {
									// Cache the current mtime element.
									var $mtime = $mtimes[i];

									// Set the timeago.
									$mtime.textContent = timeago(
										parseInt(
											$mtime.getAttribute("data-ts"),
											10
										)
									);

									// Finally, show the element.
									classes($mtime, "!none");
								}
							};

							// Run for the first time.
							mtime_update();

							// Clear any previous timer.
							if (timeago_timer) {
								clearInterval(timeago_timer);
							}
							// Set the mtime time internal timer.
							timeago_timer = setInterval(function() {
								mtime_update();
							}, 60000);
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

				// Listen to the end of the splash animation.
				document.addEventListener(
					which_animation_event("start"),
					function(e) {
						if (e.animationName === "animate-pulse") {
							setTimeout(function() {
								// Remove the class and hide the splash elements.
								classes($splash, "!opa1", "opa0");
								classes($topbar, "!none");
							}, 250);
						}
					}
				);
				document.addEventListener(
					which_animation_event("end"),
					function(e) {
						var name = e.animationName;
						var $target = e.target;

						// Remove the animation class once completed.
						if (name === "animate-header-highlight") {
							// Remove the animation class.
							classes($target, "!animate-header-highlight");
						}
					}
				);

				// Listen to sidebar showing/hiding transition ends to reset
				// the needed elements.
				document.addEventListener(
					which_transition_event("end"),
					function(e) {
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
							var opacity =
								getComputedStyle($soverlay, null).opacity * 1;

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
							sb_animation = false;
						}
					}
				);

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
										if (
											is_target_el(
												$el,
												"code-block-grouped"
											)
										) {
											$el_ =
												$el.parentNode
													.previousElementSibling;
										} else {
											$el_ = $el.previousElementSibling;
										}

										$el_
											.getElementsByClassName(
												"BTN-COPY--"
											)[0]
											.click();
									}, 1);
								}
							} else {
								timeout = setTimeout(function() {
									// Clear the timer.
									clearTimeout(timeout);

									// Run the regular code.

									// Prevent further animations if animation ongoing.
									if (sb_animation) {
										return;
									}

									// Get touched coordinates.
									var touch_info = e.targetTouches[0];
									var x = touch_info.clientX;
									var y = touch_info.clientY;
									// The allowed range the touched pixels can be in
									// to still allow for the mobile trigger to happen.
									var range =
										getComputedStyle(
											$topbar
										).height.replace("px", "") *
											1 -
										1;

									// The hamburger menu was clicked OR the allowed area
									// range was touched.
									if (
										clist.contains("hamburger") ||
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

										sb_animation = true;

										// Show the sidebar.
										show_sidebar();

										// Prevent later click event handlers.
										// [https://stackoverflow.com/a/39575105]
										// [https://stackoverflow.com/a/48536959]
										// [https://stackoverflow.com/a/41289160]
										e.preventDefault();
									} else if (
										clist.contains("sidebar-overlay")
									) {
										sb_animation = true;

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
							var lbound =
								$sidebar.scrollHeight - $sidebar.clientHeight;
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

					$sidebar.addEventListener(
						"touchstart",
						touchstart_handler,
						false
					);
					$sidebar.addEventListener(
						"touchmove",
						touchmove_handler,
						false
					);
					$soverlay.addEventListener(
						"touchstart",
						touchstart_handler,
						false
					);
					$soverlay.addEventListener(
						"touchmove",
						touchmove_handler,
						false
					);
				}
			})
			.catch(function(msg) {
				console.error(msg);
			});
	}
};
