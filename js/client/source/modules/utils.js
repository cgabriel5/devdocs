/*jshint bitwise: false*/
/*jshint browser: true*/
/*jshint esversion: 6 */
/*jshint node: false*/
/*jshint -W014 */
/*jshint -W018 */
/*jshint maxerr: 10000 */

"use strict";

app.module(
	"utils",
	function(modules, name) {
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

			var $el = document.createElement("div"),
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
				if ($el.style[transition] !== undefined) {
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
			var $el = document.createElement("div"),
				animations = {
					animation: "animation",
					OAnimation: "oAnimation",
					oanimation: "oanimation",
					MozAnimation: "animation",
					WebkitAnimation: "webkitAnimation",
					MSAnimation: "MSAnimation"
				};
			for (var animation in animations) {
				if ($el.style[animation] !== undefined) {
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
						// List of possible easing functions.

						// [outExpo]
						// return 1 == n ? n : 1 - Math.pow(2, -10 * n);

						// [inOutExpo]
						// if (0 == n) return 0;
						// if (1 == n) return 1;
						// if ((n *= 2) < 1) return .5 * Math.pow(1024, n - 1);
						// return .5 * (-Math.pow(2, -10 * (n - 1)) + 2);

						// [inOutCirc]
						// n *= 2
						// if (n < 1) return -0.5 * (Math.sqrt(1 - n * n) - 1);
						// return 0.5 * (Math.sqrt(1 - (n -= 2) * n) + 1);

						// [outQuint]
						// return --n * n * n * n * n + 1;

						// [inOutQuint]
						// n *= 2;
						// if (n < 1) return 0.5 * n * n * n * n * n;
						// return 0.5 * ((n -= 2) * n * n * n * n + 2);

						// [outCube]
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
			var $element = event.target;

			// There must be a target element...else return empty path.
			if (!event.target) {
				return [];
			}

			// Start building path.
			var $parents = [$element];

			while ($element) {
				// The current parent element.
				$element = $element.parentNode;
				// If parent exists add to array.
				if ($element) {
					$parents.push($element);
				}
			}

			// Finally, return the path!
			return $parents;
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
			var $parents = build_path({ target: $el });

			// Loop over the parents and check if any is a header
			// element.
			for (var i = 0, l = $parents.length; i < l; i++) {
				var $parent = $parents[i];

				// If a custom function is provided run it.
				if (cb) {
					// Run the function.
					var result = cb.call($parent, $parent, $el, $parents);
					if (result) {
						return result;
					}
				} else if (classname) {
					// Get the classes.
					var clist = $parent.classList;
					// Check if the parent contains the provided class.
					if (clist && clist.contains(classname)) {
						return $parent;
					}
				}
			}

			// Not the element needed.
			return false;
		};
		is_target_el.code_pre_code_element = function(
			$parent /*$el, $parents*/
		) {
			// The parent must be a:
			// - pre element
			// - contain only 1 child
			// - child must contain the class "lang-*"

			// The element must either be the code or the
			// pre element.
			if (
				($parent.classList &&
					$parent.tagName === "CODE" &&
					/\slang-.*\s/.test(
						" " + ($parent.className || "") + " "
					)) ||
				($parent.classList && $parent.tagName === "PRE")
			) {
				// If the element is the code element reset
				// the element to the parent element.
				if ($parent.tagName === "CODE") {
					$parent = $parent.parentNode;
				}

				return $parent;
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
		 *     Can also provide an element to find its amount scrolled. Axis
		 *     can also be provided. Defaults to finding the document's y
		 *     scroll amount.
		 *
		 * @param {string} axis - The axis of which to find the amount scrolled.
		 *     Provide either "x" or "y".
		 * @param {HTMLElement} $el - HTML Element to find the amount scrolled.
		 * @return {number} - The percent scrolled.
		 *
		 * @resource [https://stackoverflow.com/a/8028584]
		 */
		var percent_scrolled = function(axis, $el) {
			// By default get the y:Width scroll amount.
			axis = axis || "y";
			var dimension = axis === "y" ? "Height" : "Width";
			axis = axis === "y" ? "Top" : "Left";

			var $h = $el || document.documentElement,
				$b = $el || document.body,
				st = `scroll${axis}`,
				sh = `scroll${dimension}`;

			// Calculate the percent.
			var percent =
				($h[st] || $b[st]) /
				(($h[sh] || $b[sh]) - $h[`client${dimension}`]) *
				100;

			// If the page is not scrollable reset the percent to 0.
			if ($h[`scroll${dimension}`] === $h[`client${dimension}`]) {
				percent = 0;
			}

			// Return the percent.
			return percent;
		};

		/**
		 * Check whether the provided element is scrollable along the provided
		 *     axis.
		 * @param  {string} axis - The axis to determine scrollability.
		 * @param  {HTMLElement} $el - The element to check.
		 * @return {Boolean} - Boolean indicating whether the element is
		 *     scrollable along the provided axis.
		 *
		 * @resource [https://stackoverflow.com/a/2146905]
		 */
		var is_element_scrollable = function(axis, $el) {
			// By default check if y scrollable.
			axis = axis || "y";
			var dimension = axis === "y" ? "Height" : "Width";
			var check;

			// If the element is a "regular" element (i.e. not one of the
			// following) do not check against the window.
			if (
				![
					document.getElementsByTagName("html")[0],
					document.documentElement,
					document.body
				].includes($el)
			) {
				check = $el[`scroll${dimension}`] > $el[`client${dimension}`];
			} else {
				// [https://stackoverflow.com/a/2147156]
				check = $el[`scroll${dimension}`] > window[`inner${dimension}`];
			}

			return check;
		};

		/**
		 * Calculate the maximum amount the page can be scrolled.
		 *     The calculation is determined by the following:
		 *     (max_y_scroll_amount - window_inner_height).
		 *
		 * @return {number} - The maximum page Y scroll position.
		 *
		 * @resource [https://stackoverflow.com/a/17698713]
		 * @resource [https://stackoverflow.com/a/1766996]
		 */
		var max_y_scroll_position = function() {
			return (
				Math.max(
					document.body.scrollHeight,
					document.body.offsetHeight,
					document.documentElement.clientHeight,
					document.documentElement.scrollHeight,
					document.documentElement.offsetHeight
				) - window.innerHeight
			);
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
			var $style = document.createElement("style");

			// Set type.
			$style.type = "text/css";

			// Set the title if provided.
			if (title) {
				$style.setAttribute("data-title", title);
			}

			// Add the title marker to the contents.
			var contents = `/*title:${title}*/\n` + content;

			// Support for IE.
			if ($style.styleSheet) {
				$style.styleSheet.cssText = contents;
			} else {
				// All other browsers.
				$style.appendChild(document.createTextNode(contents));
			}

			// Append element to head tag.
			document.getElementsByTagName("head")[0].appendChild($style);

			return $style;
		};

		/**
		 * Get a CSS stylesheet (style element). Loops over all stylesheets
		 *     while running them against the provided callback function. When
		 *     When the callback returns true the stylesheet is returned.
		 *
		 * @param  {function} cb - The function logic.
		 * @return {object} - The style element else undefined.
		 *
		 * @resource [https://developer.mozilla.org/en-US/docs/Web/API/DocumentOrShadowRoot/styleSheets#Examples]
		 */
		stylesheet.get = function(cb) {
			// Get the stylesheets.
			var $sheets = document.getElementsByTagName("style");

			// Loop over and return the sheet with the matching title.
			for (let i = 0, l = $sheets.length; i < l; i++) {
				// Cache the sheet.
				var $sheet = $sheets[i];

				// Run the callback function. If the function returns true,
				// return the current iteration's stylesheet.
				if (cb.apply($sheet, [$sheet, $sheet.innerHTML, $sheets])) {
					return $sheet;
				}
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
			var $sheets = document.getElementsByTagName("style");

			// Loop backwards and run the remove logic function.
			for (let i = $sheets.length - 1; i > -1; i--) {
				// Cache the sheet.
				var $sheet = $sheets[i];

				// If callback returns true the sheet gets removed.
				if (cb.apply($sheet, [$sheet, $sheet.innerHTML, $sheets])) {
					$sheet.parentNode.removeChild($sheet);
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
			var $sheets = document.styleSheets;

			// Loop over and return the sheet with the matching title.
			for (let i = 0, l = $sheets.length; i < l; i++) {
				// Cache the sheet.
				var $sheet = $sheets[i];

				// Run the callback.
				cb.apply($sheet, [$sheet, $sheets]);
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
		 * @param {object|*n} data - The object containing the data to replace
		 *     placeholders with. Or n amount of arguments.
		 * @return {string} - The formatted template.
		 */
		var format = function(template, data) {
			// If an object containing the replacement map is not provided as the
			// second argument, then get all arguments from 1 to N and create the
			// replacement map.
			var rmap = {};
			var normalized;
			if (typeof arguments[1] !== "object") {
				// Set flag.
				normalized = true;

				// Create the replacement map.
				for (let i = 1, l = arguments.length; i < l; i++) {
					// Store the arguments.
					rmap[i] = arguments[i];
				}
				// Finally, reset variable.
				data = rmap;
			}

			return template.replace(/\{\{\#(.*?)\}\}/g, function(match) {
				// Remove formating decorations.
				match = match.replace(/^\{\{\#|\}\}$/g, "");

				// If using an index based replacement map, remove everything
				// but numbers.
				if (normalized) {
					match = match.replace(/[^0-9]/g, "");
				}

				// Lookup replacement value.
				let lookup = data[match];
				// If the value is anything but undefined or null then use it as a
				// substitute. All other values may be used as they will be casted
				// to strings before replacement. This allows for falsy values
				// like "0" (zero) and "" (an empty string) to be used as substitute
				// values.
				return lookup === undefined || lookup === null
					? `{{#${match}}}`
					: String(lookup);
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

		// Attach to module to "export" access to other modules.
		this[name]["$sroot"] = $sroot;
		this[name]["which_transition_event"] = which_transition_event;
		this[name]["which_animation_event"] = which_animation_event;
		this[name]["debounce"] = debounce;
		this[name]["request_aframe"] = request_aframe;
		this[name]["animate"] = animate;
		this[name]["build_path"] = build_path;
		this[name]["is_target_el"] = is_target_el;
		this[name]["parameters"] = parameters;
		this[name]["scroll_to_bottom"] = scroll_to_bottom;
		this[name]["percent_scrolled"] = percent_scrolled;
		this[name]["is_element_scrollable"] = is_element_scrollable;
		this[name]["max_y_scroll_position"] = max_y_scroll_position;
		this[name]["touchsupport"] = touchsupport;
		this[name]["user_agent"] = user_agent;
		this[name]["is_mobile_viewport"] = is_mobile_viewport;
		this[name]["is_mobile"] = is_mobile;
		this[name]["is_desktop_webkit"] = is_desktop_webkit;
		this[name]["stylesheet"] = stylesheet;
		this[name]["coors"] = coors;
		this[name]["selection"] = selection;
		this[name]["is_event_support"] = is_event_support;
		this[name]["regexp_escape"] = regexp_escape;
		this[name]["is_in_view"] = is_in_view;
		this[name]["timeago"] = timeago;
		this[name]["format"] = format;
		this[name]["classes"] = classes;
	},
	"complete",
	"Module handles making/exporting needed app utilities."
);
