document.onreadystatechange = function() {
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
		// var $loader = document.getElementById("loader");
		// var $loader_cont = document.getElementById("loader-cont");
		var $topbar = document.getElementById("topbar");
		var $sidebar = document.getElementById("sidebar");
		// var $shadow = document.getElementById("tb-shadow");
		var $markdown = document.getElementById("markdown");
		// var $scrolled = document.getElementById("tb-percent-scrolled");
		var $overlay = document.getElementsByClassName("sidebar-overlay")[0];
		var $splash = document.getElementById("splash-loader");
		var $splash_icon = document.getElementById("sl-icon");
		var $tb_title = document.getElementById("scroll-title");
		var $tb_filename = document.getElementById("scroll-filename");

		// Variables //

		// The request filepath.
		var REQUEST_PATH = "./devdocs/data.json";
		var SCROLL_TIME = 250;

		// Functions //

		/**
		 * Find the browser root element. The root element differs
		 *     in browsers. Thid function determines which to use.
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
		 * Determines which animation[start|end|interation] event
		 *     the user's browser supports and returns it.
		 *
		 * @param {string} type - The event type: either start,
		 *     end, or iteration.
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
					// Opera prefix info: [https://developer.mozilla.org/en-US/docs/Web/Events/transitionend]
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
		 * Throttles provided function.
		 *
		 * @param {function} func - The function to throttle.
		 * @param {number} time - The time to throttle by.
		 * @param {object} scope - The scope in which to run function with.
		 *
		 * @return {function} - The new throttled function.
		 * @resouce [https://remysharp.com/2010/07/21/throttling-function-calls]
		 */
		var throttle = function(func, time, scope) {
			time = time || 250;
			var last, deferTimer;
			return function() {
				var context = scope || this,
					now = +new Date(),
					args = arguments;
				if (last && now < last + time) {
					// hold on to it
					clearTimeout(deferTimer);
					deferTimer = setTimeout(function() {
						last = now;
						func.apply(context, args);
					}, time);
				} else {
					last = now;
					func.apply(context, args);
				}
			};
		};

		/**
		 * Determine correct requestAnimationFrame function.

		 * @return {function} - The correct function to use.
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
					// function(n) {
					// 	// [https://github.com/component/ease/blob/master/index.js#L16]
					// 	n *= 2;
					// 	if (n < 1) return 0.5 * n * n;
					// 	return -0.5 * (--n * (n - 2) - 1);
					// },
					function(n) {
						return 0.5 * (1 - Math.cos(Math.PI * n));
					},
				noop = function() {},
				onProgress = options.onProgress || noop,
				onComplete = options.onComplete || noop,
				from = options.from || {},
				to = options.to || {},
				// Store the timer ID.
				tid;

			// Runtime variables.
			var startTime = Date.now();

			function update() {
				var deltaTime = Date.now() - startTime,
					progress = Math.min(deltaTime / duration, 1),
					factor = ease(progress),
					values = {},
					property;

				for (property in from) {
					if (
						from.hasOwnProperty(property) &&
						to.hasOwnProperty(property)
					) {
						values[property] =
							from[property] +
							(to[property] - from[property]) * factor;
					}
				}

				// Stop animation progress when false is returned.
				if (onProgress(values) === false) {
					progress = 1;
				}

				if (progress === 1) {
					onComplete(deltaTime);
				} else {
					// Continue requesting the animation frame.
					tid = request_aframe(update);
				}
			}

			// Run the first frame request.
			tid = request_aframe(update);

			return {
				// [https://stackoverflow.com/a/31282386]
				cancel: function(msg) {
					(window.cancelAnimationFrame ||
						window.mozCancelAnimationFrame)(tid);
				}
			};
		};

		/**
		 * The loader animation function.
		 *
		 * @param {eventobject} e - The browser event object.
		 * @return {undefined} - Nothing.
		 */
		// var done_loader = false;
		// var loader = function(e, percent) {
		// 	// Start splash animation.
		// 	var $splash = document.getElementById("splash-loader");
		// 	var $splash_icon = document.getElementById("sl-icon");

		// 	if (!done_loader && (percent === 100 || percent === null)) {
		// 		$splash_icon.style.transform = "scale(0.4)";
		// 		// $splash_icon.classList.add("animate-pulse");

		// 		setTimeout(function() {
		// 			$splash.classList.add("opa0");
		// 			$splash_icon.style.transform = "scale(0.6)";
		// 		}, 200);
		// 	} else {
		// 		return;
		// 	}
		// };
		// var loader = function(e, percent) {
		// 	function animate_loader() {
		// 		// Stop animating once the complete flag is set.
		// 		if (done_loader === true) {
		// 			return;
		// 		}

		// 		if (e.lengthComputable && percent) {
		// 			// Update the loader with the percent.
		// 			$loader.style.width = `${percent}%`;

		// 			// Once fully loaded end animating.
		// 			if (percent === 100) {
		// 				done_loader = true;
		// 				return;
		// 			} else {
		// 				// Else continue animating.
		// 				request_aframe(animate_loader);
		// 			}
		// 		} else {
		// 			// Chrome for whatever reason sometimes returns
		// 			// e.lengthComputable as false which prevent the
		// 			// progress loader. Therefore, when the property
		// 			// is returned as false we simply set the progress
		// 			// to complete (100%).

		// 			// End animating.
		// 			$loader.style.width = `100%`;
		// 			done_loader = true;
		// 			return;
		// 		}
		// 	}
		// 	// Start animating.
		// 	request_aframe(animate_loader);
		// };

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
			// cache target element
			var element = event.target;
			// there must be a target element...else return empty path
			if (!event.target) return [];
			// start building path
			var parents = [element];
			while (element) {
				// the current parent element
				element = element.parentNode;
				// if parent exists add to array
				if (element) parents.push(element);
			}
			// finally, return the path!
			return parents;
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

			return params;
		};

		/**
		 * Get the amount page the has been y-scrolled as a percent.
		 *
		 * @return {number} - The percent scrolled.
		 *
		 * @resource [https://stackoverflow.com/a/8028584]
		 */
		function percent_scrolled() {
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
		}

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
		 * Detect whether UA is a mobile device.
		 *
		 * @return {boolean} - Boolean indicating if UA is a mobile device.
		 */
		var is_mobile = function() {
			return window.navigator.userAgent.toLowerCase().includes("mobi");
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

		// ------------------------------------------------------------

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
				// $splash_icon.style.transform = "scale(0.4)";
				$splash_icon.classList.add("animate-pulse");

				// setTimeout(function() {
				// $splash.classList.add("opa0");
				// $splash_icon.style.transform = "scale(0.6)";
				setTimeout(function() {
					$splash_icon.classList.add("opa0");
					// $splash_icon.style.opacity = "0";
					// }, 100);
				}, 250);

				// Set the title if provided.
				if (data.title) {
					document.title = data.title;

					// Set the topbar information.
					$tb_title.textContent = data.title;
				}

				// Note: Pre-load logo to prevent "blinking in".
				return new Promise(function(resolve, reject) {
					// Only load image if provided in the data object.
					if (data.logo) {
						// Create new HTMLImageElement instance.
						var image = new Image();

						// Attach event listeners to image instance.
						image.onload = function() {
							resolve(data);
						};
						image.onerror = function() {
							reject();
						};

						// Add the image source file.
						image.src = data.logo;
					} else {
						// If the data object does not contain an image simply
						// resolve the promise to continue with the chain.
						resolve(data);
					}
				}).then(null, function() {
					return Promise.reject("Failed to the load the logo.");
				});
			})
			.then(function(data) {
				console.log(data);

				// Variables:Scoped:Inner //

				// Store the currently displayed file.
				var current_file;
				var running_menu_animation;
				var sb_animation;

				// Functions:Scoped:Inner //

				/**
				 * Scroll to header.
				 *
				 * @return {undefined} - Nothing.
				 */
				var scroll = function($el, callback) {
					// Calculate the to y scroll offset position.
					var to = scroll.offset($el);

					// Scroll to the header.
					animate({
						from: { a: window.pageYOffset },
						to: { a: to },
						duration: scroll_duration(to),
						onProgress: function(values) {
							// The progress value.
							var val = values.a;

							// Edge case: when scrolling to bottom
							// cancel scrolling once the value exceeds
							// that of the scrollable height. Or else
							// the animation will take longer to end.
							// Causing a sense of lag.
							if (percent_scrolled() >= 100) {
								return false;
							}

							// Set the scrolltop value.
							$sroot.scrollTop = val;
						},
						onComplete: callback
					});
				};
				// Calculate scroll offset for mobile and desktop views.
				scroll.offset = function($el) {
					// Calculate the to y scroll position.
					return is_mobile_viewport()
						? // For "mobile" size.
							coors($el.nextElementSibling).pageY - 100
						: // Desktop size.
							coors($el).pageY - 10;
				};

				// Contain all content headers.
				var headers = {};
				/**
				 * Get the height of a submenu using a virtual element.
				 *
				 * @return {undefined} - Nothing.
				 */
				function get_headers() {
					// Empty the headers object.
					for (var key in headers) {
						if (headers.hasOwnProperty(key)) {
							delete headers[key];
						}
					}

					// document.getElementById("test").innerHTML = "";

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
						var pos = Math.floor(
							// $header.offsetTop + $header.offsetHeight - offset
							$header.offsetTop - offset - 6
							// $header.getBoundingClientRect().top - offset - 6
						);

						// 						// Inject the clone to the DOM.
						// 						document.getElementById("test").insertAdjacentHTML(
						// 							"afterbegin",

						// 							// <div class="tested" style="
						// 							//     position: absolute;
						// 							//     z-index: ${123 + i};
						// 							//     left: 0;
						// 							//     top: ${$header.offsetTop}px;
						// 							//     width: 100%;
						// 							//     height: 2px;
						// 							//     background: coral;
						// 							// "></div><div class="tested" style="
						// 							//     position: absolute;
						// 							//     z-index: ${124 + i};
						// 							//     left: 0;
						// 							//     top: ${$header.offsetTop - offset - 6}px;
						// 							//     width: 100%;
						// 							//     height: 2px;
						// 							//     background: green;
						// 							// "></div>

						// 							`<div class="tested" style="
						//     position: absolute;
						//     z-index: ${124 + i};
						//     left: 0;
						//     top: ${$header.offsetTop - offset - 6}px;
						//     width: 100%;
						//     height: 2px;
						//     background: blue;
						// "></div>`
						// 						);

						// 						// console.log(
						// 						// 	i,
						// 						// 	offset,
						// 						// 	"coral",
						// 						// 	$header.offsetTop,
						// 						// 	"green",
						// 						// 	$header.offsetTop - offset - 6,
						// 						// 	$header.getBoundingClientRect().top,
						// 						// 	$markdown.children[0].getBoundingClientRect().top
						// 						// );

						// Store the header offset.
						list.push(pos);
						headers[pos] = $header;
					}

					// console.log(">>>>", list, headers);

					// Store the list.
					headers.list = list;
				}

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
					var html = `<div id="virtual-height-element" class="menu">${
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
						"scroll-tb-file-cont"
					);

					// If a file name exists, set it.
					if (filename) {
						$scroll_tb_file_cont.classList.remove("none");
						$tb_filename.textContent = filename;
					} else {
						// Else, hide the element.
						$scroll_tb_file_cont.classList.add("none");
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
						var hash = location.hash;

						// Scroll to hash.
						if (hash) {
							var $el = document.getElementById(hash.slice(1));
							if ($el) {
								// Get the header element.
								var $parent = $el.parentNode;

								// Remove the class to make sure the highlight
								// works.
								$parent.classList.remove("highlight");
								// Scroll to the position. Don't use an animation
								// as alt + (<-- or -->) needs to be done and
								// felt very quick.
								setTimeout(function() {
									// Instantly scroll to position.
									$sroot.scrollTop = scroll.offset($parent);

									$parent.classList.add("highlight");
								}, 0);
							}
						}

						return;
					}

					// Default to the first file when one does not exist.
					if (!current_file) {
						current_file = data.first_file;
					}

					// Get the file content.
					var file = data.files[filename];

					// Show 404 file when selected file does not exist.
					if (!file) {
						var error_404 = "_404";
						file = data.files[error_404];
						filename = error_404;
					}

					// Un-highlight/Highlight:

					// Un-highlight the current highlighted menu element.
					var $current = document.querySelector(
						`[data-file="${current_file}"]`
					);
					if ($current) {
						var $parent = $current.parentNode;
						// Remove the highlight.
						$parent.classList.remove("active-page");

						// Animate menu height closing.
						var animation = animate({
							from: {
								a:
									getComputedStyle(
										$parent.nextElementSibling
									).height.replace("px", "") * 1
							},
							to: {
								a: 0
							},
							duration: 300,
							onProgress: function(values) {
								$parent.nextElementSibling.style.height = `${
									values.a
								}px`;
							}
						});

						// Un-highlight the menu arrow and reset to right
						// position.
						var menu_arrow = $parent.children[0];
						var menu_classes = menu_arrow.classList;
						menu_classes.remove("menu-arrow-active");
						menu_classes.remove("fa-angle-down");
						menu_classes.add("fa-angle-right");
					}

					// Set the new highlight for the new current element.
					if (!$new_current && filename !== "_404") {
						$new_current = document.querySelector(
							`[data-file="${filename}"]`
						).parentNode;
					}
					if (filename !== "_404") {
						// Get the menu arrow element and its CSS classes.
						var menu_arrow = $new_current.children[0];
						var menu_classes = menu_arrow.classList;

						// Change text color to blue.
						$new_current.classList.add("active-page");
						// Change the menu arrow to be active (blue/down).
						menu_classes.add("menu-arrow-active");
						menu_classes.remove("fa-angle-right");
						menu_classes.add("fa-angle-down");

						if (running_menu_animation) {
							// Cancel the current animation.
							running_menu_animation.cancel();
						}

						// Animate menu height opening.
						var animation = animate({
							from: { a: 0 },
							to: {
								a:
									get_height($new_current, filename).replace(
										"px",
										""
									) * 1
							},
							duration: 300,
							onProgress: function(values) {
								$new_current.nextElementSibling.style.height = `${
									values.a
								}px`;
							},
							onComplete: function(actualDuration, averageFps) {
								$new_current.nextElementSibling.style.opacity = 1;

								// Inject the html.
								replace_html(file);

								// Show the current filename.
								inject_filename(current_file, data);

								// Get the hash.
								var hash = location.hash;

								// Scroll to hash.
								if (hash) {
									var $el = document.getElementById(
										hash.slice(1)
									);
									if ($el) {
										// Get the header element.
										var $parent = $el.parentNode;

										// Remove the class to make sure the highlight
										// works.
										$parent.classList.remove("highlight");

										// Let browser know to optimize scrolling.
										perf_hint($sroot, "scroll-position");

										// Use a timeout to let the injected HTML load
										// and parse properly. Otherwise, getBoundingClientRect
										// will return incorrect values.
										setTimeout(function() {
											// Scroll to the header.
											scroll($parent, function() {
												// console.log("C");

												$parent.classList.add(
													"highlight"
												);

												// Remove optimization.
												perf_unhint($sroot);
											});
										}, 300);
									}
								}
							}
						});

						// Store the animation to cancel if another animation is needed to run.
						running_menu_animation = animation;
					} else {
						// 404 File.

						// Inject the html.
						replace_html(file);

						// Show the current filename.
						inject_filename(current_file, data);

						// Get the hash.
						var hash = location.hash;

						// Scroll to hash.
						if (hash) {
							var $el = document.getElementById(hash.slice(1));
							if ($el) {
								// Get the header element.
								var $parent = $el.parentNode;

								// Remove the class to make sure the highlight
								// works.
								$parent.classList.remove("highlight");

								// Let browser know to optimize scrolling.
								perf_hint($sroot, "scroll-position");

								// Use a timeout to let the injected HTML load
								// and parse properly. Otherwise, getBoundingClientRect
								// will return incorrect values.
								setTimeout(function() {
									// Scroll to the header.
									scroll($parent, function() {
										// console.log("D");

										$parent.classList.add("highlight");

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
					request_aframe(function(t) {
						// Show the sidebar.
						$sidebar.classList.add("sidebar-show");

						// Show the overlay.
						var classes_overlay = $overlay.classList;
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
					request_aframe(function(t) {
						// Hide the sidebar.

						// Show the overlay.
						var classes_overlay = $overlay.classList;
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

					// // Get the scrolling distance.
					// var delta_distance = Math.abs(to - from);

					// // Calculate the duration.
					// var duration = delta_distance / 1.5 + delta_distance * 0.4;

					// // Reset the duration to fit within the min/max bounds.
					// // [https://stackoverflow.com/a/16861139]
					// duration = Math.min(duration, 800);
					// duration = Math.max(duration, 150);

					// return duration;
				}

				// AppCode:Scoped:Inner //

				// Enclose in a timeout to give the loader a chance to fade away.
				setTimeout(function() {
					// Embed the logo to the page if it exists.
					if (data.logo) {
						document.getElementById(
							"menu-dynamic-cont-logo"
						).innerHTML =
							data.logoHTML;
					}

					// Add the sidebar HTML.
					document.getElementById(
						"menu-dynamic-cont"
					).innerHTML = data.menu.join("");

					// Add the social links.
					if (data.socials) {
						document
							.getElementById("sidebar")
							.children[0].insertAdjacentHTML(
								"beforeend",
								data.socials
							);
					}

					// Animate the entire menu.
					document
						.getElementsByClassName("menu")[0]
						.classList.add("animate-fadein");

					// Show the sidebar footer.
					document
						.getElementById("sb-footer")
						.classList.remove("none");

					// Parse the URL query parameters.
					var params = parameters();

					// Inject the file contents to the page. Provide the
					// inject function the page parameter or default to the
					// first file when the page parameter does not exist.
					inject(params.page ? params.page : data.first_file);

					// // Inject CSS to page.
					// var stylesheets = document.styleSheets;
					// var stylesheet;
					// for (var key in stylesheets) {
					// 	if (stylesheets.hasOwnProperty(key)) {
					// 		var sheet = stylesheets[key];
					// 		var href = sheet.href;
					// 		if (href && href.includes("bundle.min.css")) {
					// 			stylesheet = sheet;
					// 			break;
					// 		}
					// 	}
					// }
					// if (stylesheet) {
					// 	stylesheet.insertRule(
					// 		".sidebar {will-change: transform;}",
					// 		stylesheet.cssRules.length
					// 	);
					// }
				}, 200);

				// EventListeners:Scoped:Inner //

				// var $tb_logo = document.getElementById("tb-logo");
				// var $tb_dirname = document.getElementById("scroll-dirname");
				// var $tb_title = document.getElementById("scroll-title");
				// var $tb_filename = document.getElementById("scroll-filename");
				// var $tb_static = document.getElementById("scroll-static");
				// var $tb_dynamic = document.getElementById("scroll-dynamic");
				// var $tb_scroll = document.getElementById("topbar-scroll");

				// var last_top_text;
				// var scroll_count = -1;
				// var tb2_fadeout_timer;
				// //
				// window.addEventListener(
				// 	"scroll",
				// 	throttle(function(event) {
				// 		// Get the y scroll position.
				// 		var y = Math.floor(window.pageYOffset);

				// 		// // As the scroll event fires many times a second it can
				// 		// // be very taxing on the app performance. Therefore, cut
				// 		// // down to n amount of times the event gets fired.
				// 		// // if (++scroll_count % 3 !== 0) {
				// 		// if (++scroll_count % 2 !== 0) {
				// 		// 	return;
				// 		// }

				// 		// // Get the y scroll position.
				// 		// var y = Math.floor(window.pageYOffset);

				// 		// // Show the percentage scrolled.
				// 		// request_aframe(function(timestamp) {
				// 		// 	$scrolled.style.width = `${percent_scrolled() + ""}%`;
				// 		// });

				// 		// // Show/hide tb shadow.
				// 		// if (!window.matchMedia("(min-width: 769px)").matches) {
				// 		// 	if (y <= 0) {
				// 		// 		$shadow.style.display = "none";
				// 		// 	} else {
				// 		// 		request_aframe(function(timestamp) {
				// 		// 			$shadow.style.display = "block";
				// 		// 			$shadow.style.top =
				// 		// 				y <= 16 ? -15 + y / 4 + "px" : "-10px";
				// 		// 		});
				// 		// 	}
				// 		// }

				// 		// Show the current header thats in view/range.
				// 		var list = headers.list;
				// 		if (list) {
				// 			// [https://stackoverflow.com/a/1147768]
				// 			var body = document.body;
				// 			var max_scroll_height = Math.max(
				// 				body.scrollHeight,
				// 				body.offsetHeight,
				// 				$sroot.clientHeight,
				// 				$sroot.scrollHeight,
				// 				$sroot.offsetHeight
				// 			);

				// 			var $header;
				// 			var last = list[list.length - 1] || 0;
				// 			for (var i = 0, l = list.length; i < l; i++) {
				// 				var current = list[i];
				// 				var next = list[i + 1] || last;
				// 				// If it's the last position extend to the max
				// 				// window scroll height.
				// 				if (l - 1 === i) {
				// 					next = max_scroll_height;
				// 				}

				// 				// Position be either one of the following:
				// 				if (y >= current && y <= next) {
				// 					var $header = headers[current];
				// 					// Store the header.
				// 					headers.active = $header;
				// 					break;
				// 				}
				// 			}

				// 			// if ($header) {
				// 			// 	// $tb_logo.classList.remove("none");
				// 			// 	$tb_static.classList.add("none");
				// 			// 	$tb_dynamic.classList.remove("none");
				// 			// } else {
				// 			// 	// $tb_logo.classList.add("none");
				// 			// 	$tb_dynamic.classList.add("none");
				// 			// 	$tb_static.classList.remove("none");
				// 			// }

				// 			if ($header) {
				// 				if (
				// 					// $tb_scroll.classList.contains("opa0") &&
				// 					$tb_scroll.classList.contains("none") ||
				// 					tb2_fadeout_timer
				// 				) {
				// 					// Clear any existing timer.
				// 					if (tb2_fadeout_timer) {
				// 						clearTimeout(tb2_fadeout_timer);
				// 					}

				// 					// Remove the class.
				// 					$tb_scroll.classList.remove("opa0");
				// 					$tb_scroll.classList.remove("none");
				// 					$tb_scroll.classList.add("opa1");
				// 				}
				// 			} else {
				// 				if (
				// 					// $tb_scroll.classList.contains("opa1") &&
				// 					!$tb_scroll.classList.contains("none") ||
				// 					y <= 0
				// 				) {
				// 					// Remove the class.
				// 					$tb_scroll.classList.remove("opa1");
				// 					$tb_scroll.classList.add("opa0");

				// 					if (!tb2_fadeout_timer) {
				// 						tb2_fadeout_timer = setTimeout(
				// 							function() {
				// 								$tb_scroll.classList.add(
				// 									"none"
				// 								);
				// 								tb2_fadeout_timer = null;
				// 							},
				// 							200
				// 						);
				// 					}
				// 				}

				// 				return;
				// 			}

				// 			var text = $header
				// 				? $header.textContent.trim()
				// 				: data.title;
				// 			// Store the text.
				// 			if (text !== last_top_text) {
				// 				// Get the file name alias from the data.
				// 				var filename = "devdocs";
				// 				var dirs = data.dirs[0].files;
				// 				for (var i = 0, l = dirs.length; i < l; i++) {
				// 					if (dirs[i].dirname === current_file) {
				// 						filename = dirs[i].alias;
				// 						break;
				// 					}
				// 				}

				// 				$tb_dirname.textContent = filename;
				// 				$tb_filename.textContent = text;
				// 				last_top_text = text;
				// 			}
				// 		}
				// 	}, 75)
				// );

				// When the URL changes (history) update the HTML content.
				window.addEventListener("popstate", function(event) {
					// Parse the URL query parameters.
					var params = parameters();

					// Inject the file contents to the page. Provide the
					// inject function the page parameter or default to the
					// first file when the page parameter does not exist.
					inject(params.page ? params.page : data.first_file);
				});

				// When the URL changes (history) update the HTML content.
				window.addEventListener(
					"resize",
					debounce(function(event) {
						// When the window is no longer in a mobile size
						// and the sidebar is showing, hide the sidebar and
						// reset the content + topbar.
						// [https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia]
						if (
							window.matchMedia("(min-width: 769px)").matches &&
							$overlay.style.display === "block"
						) {
							sb_animation = true;

							// Hide the sidebar.
							hide_sidebar();
						}

						// // Hide the tb shadow div.
						// if (window.matchMedia("(min-width: 769px)").matches) {
						// 	$shadow.style.display = "none";
						// 	$shadow.style.top = null;
						// }

						get_headers();
					}),
					200
				);

				// Potential Android edge-effect when reaching the top or
				// bottom CSS.
				// height: 0px;width:${_width - 1}px;
				// background: rgba(0, 0, 0, 0.2);
				// top:${_top}px;left:${_left}px;
				// position: fixed;z-index:5;
				// border-radius: 0px 0px 250px 1200px/100px;
				// transition: height 0.2s ease-in-out;

				// [https://stackoverflow.com/a/30112044]
				// [https://stackoverflow.com/a/24915633]
				// Prevent all scrolling when scrolling on the soverlay.
				$overlay.addEventListener("wheel", function(e) {
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

				// /**
				//  * Handle the click/touchstart on the dynamic scroll element.
				//  */
				// var dynamic_handler = function(e) {
				// 	var $header = headers.active;

				// 	// Scroll to the header.
				// 	if ($header) {
				// 		$header.classList.remove("highlight");

				// 		// Let browser know to optimize scrolling.
				// 		perf_hint($sroot, "scroll-position");

				// 		// Note: Find a way to not have this hard-coded.
				// 		var dynamic_scroller_height = 33;

				// 		// Animation from-to.
				// 		var from = window.pageYOffset;
				// 		var to =
				// 			get_element_top_pos($header) -
				// 			dynamic_scroller_height;

				// 		// Scroll to the header.
				// 		animate({
				// 			from: { a: from },
				// 			to: { a: to },
				// 			duration: scroll_duration(from, to),
				// 			onProgress: function(values) {
				// 				$sroot.scrollTop = values.a;
				// 			},
				// 			onComplete: function(actualDuration, averageFps) {
				// 				// Highlight the header.
				// 				$header.classList.add("highlight");

				// 				// Remove optimization.
				// 				perf_unhint($sroot);
				// 			}
				// 		});

				// 		// Get the anchor href.
				// 		var href = $header.children[0].getAttribute("href");

				// 		// Don't store the same hash. Only store if the hash
				// 		// is different than the current hash.
				// 		if (location.hash !== href) {
				// 			history.pushState({}, null, `${href}`);
				// 		}

				// 		e.preventDefault();
				// 		return;
				// 	}
				// };
				// $tb_scroll.addEventListener("touchstart", dynamic_handler);
				// $tb_scroll.addEventListener("click", dynamic_handler);

				// Listen to clicks.
				document.addEventListener("click", function(e) {
					// Get the target element.
					var $target = e.target;
					var filename;
					var classes = $target.classList;

					// Since using event delegation, check that the clicked
					// element is either the anchor element containing the
					// needed data-attribute or the anchor's parent li
					// element.

					// The clicked element is an li element since it has the
					// l-2 (level-2) class. Since this is the case get the
					// child element's (anchor element) data-attribute.
					if (classes.contains("l-2")) {
						// Get the data-attribute.
						filename = $target.children[0].getAttribute(
							"data-file"
						);

						// If this is the case then the anchor element itself was
						// clicked. Simply get the data-attribute.
					} else if ($target.parentNode.classList.contains("l-2")) {
						// Get the data-attribute.
						filename = $target.getAttribute("data-file");

						// Reset the target element.
						$target = $target.parentNode;
					} else if (classes.contains("link-doc")) {
						// Get the data-attribute.
						filename = $target.getAttribute("data-file");

						// Reset the target element.
						// $target = $target.parentNode;
						$target = document.querySelector(
							`a.link[data-file='${filename}']`
						).parentNode;
					} else if (
						classes.contains("link-heading") ||
						classes.contains("l-3")
					) {
						e.preventDefault();
						e.stopPropagation();

						if ($target.tagName !== "A") {
							// Get the anchor child element.
							$target = $target.children[0];
						}

						// Get the href.
						var href = $target.getAttribute("href");
						// Get the header.
						var $header = document.querySelector(
							`[href='${href}'][class='anchor']`
						).parentNode;

						// Remove the class before adding.
						$header.classList.remove("highlight");

						// Let browser know to optimize scrolling.
						perf_hint($sroot, "scroll-position");

						// Scroll to the header.
						scroll($header, function() {
							// console.log("A");

							// Highlight the header.
							$header.classList.add("highlight");

							// Remove optimization.
							perf_unhint($sroot);

							// Hide the mobile sidebar + overlay.
							if (
								getComputedStyle($overlay).display === "block"
							) {
								sb_animation = true;

								// Hide the sidebar.
								hide_sidebar();
							}
						});

						// Don't store the same hash. Only store if the hash
						// is different than the current hash.
						if (location.hash !== href) {
							history.pushState({}, null, `${href}`);
						}

						return;
					} else if (classes.contains("btn-home")) {
						// Get the data-attribute.
						filename = data.first_file;

						// Reset the target element.
						$target = document.querySelector(
							`a.link[data-file='${filename}']`
						).parentNode;
					} else if (
						classes.contains("mobile-menu-ham") &&
						$overlay.style.display !== "block"
					) {
						// The hamburger menu was clicked OR the allowed area
						// range was touched.
						sb_animation = true;

						// Show the sidebar.
						show_sidebar();

						return;
					} else if (classes.contains("sidebar-overlay")) {
						sb_animation = true;

						// Hide the sidebar.
						hide_sidebar();

						return;
					} else {
						// Check if clicking the header anchor octicon element.
						var $header = false;

						// Get the target element parents.
						var parents = build_path(e);
						// Loop over the parents and check if any is a header
						// element.
						for (var i = 0, l = parents.length; i < l; i++) {
							if (/h\d/i.test(parents[i].tagName)) {
								$header = parents[i];
								break;
							}
						}

						// Skip if empty (no children).
						if (!$header.childElementCount) {
							return;
						}

						// Scroll to the header.
						if ($header) {
							$header.classList.remove("highlight");

							// Let browser know to optimize scrolling.
							perf_hint($sroot, "scroll-position");

							// Scroll to the header.
							scroll($header, function() {
								// console.log("B");

								// Highlight the header.
								$header.classList.add("highlight");

								// Remove optimization.
								perf_unhint($sroot);
							});

							// Get the anchor href.
							var href = $header.children[0].getAttribute("href");

							// Don't store the same hash. Only store if the hash
							// is different than the current hash.
							if (location.hash !== href) {
								history.pushState({}, null, `${href}`);
							}

							e.preventDefault();
							return;
						}
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
								`?page=${encodeURIComponent(`${dir}/${file}`)}`
							);
						}

						// Set the HTML.
						inject(filename, $target);

						// Skip scrolling to the top when its the same file.
						if (filename !== current_file) {
							// Let browser know to optimize scrolling.
							perf_hint($sroot, "scroll-position");

							// Use a timeout to let the injected HTML load/parse.
							setTimeout(function() {
								// Scroll to the top of the page.
								animate({
									from: { a: window.pageYOffset },
									to: { a: 0 },
									duration: scroll_duration(0),
									onProgress: function(values) {
										$sroot.scrollTop = values.a;
									},
									onComplete: function() {
										// console.log("E");

										// Remove optimization.
										perf_unhint($sroot);
									}
								});
							}, 300);
						}

						e.preventDefault();
					}
				});

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
							$target.classList.contains("splash-loader-icon") &&
							pname === "opacity"
						) {
							// Remove the class and hide the splash elements.
							$splash.classList.add("opa0");
							$topbar.classList.remove("none");
						}
						if (
							$target.classList.contains("splash-loader") &&
							pname === "opacity"
						) {
							$splash.classList.add("none");
						}

						///////////////////////////

						if ($target === $overlay) {
							// Get the overlay opacity.
							var opacity =
								getComputedStyle($overlay, null).opacity * 1;

							// Reset the overlay.
							var classes_overlay = $overlay.classList;

							if (opacity === 1) {
								// Sidebar shown.
								// Reset the overlay.
							} else if (opacity === 0) {
								// Sidebar hidden.

								// Reset the overlay.
								classes_overlay.add("none");
								classes_overlay.remove("tdelay1");
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
				if (touchsupport()) {
					document.addEventListener(
						"touchstart",
						function(e) {
							// Prevent further animations if animation ongoing.
							if (sb_animation) {
								return;
							}

							// Get the target element.
							var $target = e.target;
							var classes = $target.classList;

							// Get touched coordinates.
							var touch_info = e.targetTouches[0];
							var x = touch_info.clientX;
							var y = touch_info.clientY;
							// The allowed range the touched pixels can be in
							// to still allow for the mobile trigger to happen.
							var range = 45;

							// The hamburger menu was clicked OR the allowed area
							// range was touched.
							if (
								classes.contains("mobile-menu-ham") ||
								(x <= range &&
									y <= range &&
									$overlay.style.display !== "block")
							) {
								sb_animation = true;

								// Show the sidebar.
								show_sidebar();

								// Prevent later click event handlers.
								// [https://stackoverflow.com/a/39575105]
								// [https://stackoverflow.com/a/48536959]
								// [https://stackoverflow.com/a/41289160]
								e.preventDefault();
							} else if (classes.contains("sidebar-overlay")) {
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
								: $overlay;

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
					$overlay.addEventListener(
						"touchstart",
						touchstart_handler,
						false
					);
					$overlay.addEventListener(
						"touchmove",
						touchmove_handler,
						false
					);

					// // Touch slide code.

					// var reset;
					// var x_start;
					// var velocity;
					// var slide_target;
					// var slide_animation;
					// var sidebar_width;
					// document.body.addEventListener(
					// 	"touchstart",
					// 	function(e) {
					// 		// The touched on element must be the sidebar or a sidebar
					// 		// descendant.
					// 		if (build_path(e).includes($sidebar)) {
					// 			// Get the touch event information.
					// 			var info = e.targetTouches[0];

					// 			// Get the touched element and x coordinate.
					// 			x_start = info.pageX;
					// 			slide_target = info.target;
					// 			// Store the start time/x position to later determine
					// 			// the slide velocity on touchmove.
					// 			velocity = {
					// 				time: e.timeStamp,
					// 				position: x_start
					// 			};

					// 			// Store the sidebar with.
					// 			sidebar_width =
					// 				getComputedStyle(
					// 					$sidebar,
					// 					null
					// 				).width.replace("px", "") * 1;

					// 			// Remove all transitions to animations instant.
					// 			var $els = [
					// 				$sidebar,
					// 				$topbar,
					// 				$markdown,
					// 				$shadow,
					// 				$overlay
					// 			];
					// 			for (var i = 0, l = $els.length; i < l; i++) {
					// 				$els[i].style.transition = "none";
					// 			}

					// 			// Prevent any unintentional scrolling.
					// 			// e.preventDefault();
					// 			// e.stopPropagation();
					// 		}
					// 	}
					// 	// { passive: false }
					// );

					// document.body.addEventListener(
					// 	"touchmove",
					// 	function(e) {
					// 		if (slide_target && velocity) {
					// 			// Get the touch event information.
					// 			var info = e.targetTouches[0];
					// 			var x = info.pageX;

					// 			// Calculate the change in movement.
					// 			var delta_x = x - x_start;
					// 			var delta_x_content = sidebar_width + delta_x;

					// 			// [https://stackoverflow.com/a/10996533]
					// 			// Calculate the swipe velocity.
					// 			// Formula: v = abs(x2 - x1) / (t2 - t1)
					// 			var v =
					// 				Math.abs(x - velocity.position) /
					// 				(e.timeStamp - velocity.time);

					// 			// Default to false.
					// 			reset = false;

					// 			// Set a left bound. Once hit anymore movement
					// 			// will be canceled.
					// 			if (delta_x_content <= 0) {
					// 				return;
					// 			} else if (
					// 				// Once the delta_x_content difference is
					// 				// less than 150 pixels or the velocity is
					// 				// greater or equal to 1 the reset flag is
					// 				// set. Therefore on touchend when the flag
					// 				// is set the sidebar and everything else
					// 				// will be reset.
					// 				delta_x_content <= 150 ||
					// 				Math.floor(v) >= 1
					// 			) {
					// 				reset = true;
					// 			}

					// 			// If the movement is to the left animate the
					// 			// movement.
					// 			if (Math.sign(delta_x) === -1) {
					// 				slide_animation = request_aframe(function(
					// 					timestamp
					// 				) {
					// 					var css_rule = "transform";
					// 					var priority = "important";
					// 					var content_def = `translateX(${delta_x_content}px)`;

					// 					// [https://stackoverflow.com/a/7919637]
					// 					$sidebar.style.setProperty(
					// 						css_rule,
					// 						`translateX(${delta_x}px)`,
					// 						priority
					// 					);
					// 					$topbar.style.setProperty(
					// 						css_rule,
					// 						content_def,
					// 						priority
					// 					);
					// 					$markdown.style.setProperty(
					// 						css_rule,
					// 						content_def,
					// 						priority
					// 					);
					// 					$shadow.style.setProperty(
					// 						css_rule,
					// 						content_def,
					// 						priority
					// 					);

					// 					// As the slide movement happens add opacity
					// 					// to the content elements and sidebar.
					// 					var opacity_calc =
					// 						Math.abs(1 / delta_x) * 40;
					// 					$overlay.style.opacity =
					// 						Math.abs(opacity_calc) - 0.15;
					// 					$sidebar.style.opacity = opacity_calc;
					// 				});

					// 				// Prevent y-scrolling.
					// 				e.preventDefault();
					// 				e.stopPropagation();
					// 			}
					// 		}
					// 	},

					// 	{ passive: false }
					// );

					// document.body.addEventListener("touchend", function(e) {
					// 	// Always reset.
					// 	x_start = null;
					// 	velocity = null;

					// 	if (!slide_target) {
					// 		return;
					// 	}

					// 	var cancel =
					// 		window.cancelAnimationFrame ||
					// 		window.mozCancelAnimationFrame;

					// 	if (reset) {
					// 		// Cancel any on-going sliding animate frame request.
					// 		if (slide_animation) {
					// 			cancel(slide_animation);
					// 			slide_animation = null;
					// 		}

					// 		// Clear variables.
					// 		reset = null;
					// 		slide_target = null;

					// 		// Remove transitions
					// 		$sidebar.removeAttribute("style");
					// 		$topbar.removeAttribute("style");
					// 		$markdown.removeAttribute("style");
					// 		$shadow.removeAttribute("style");
					// 		$overlay.removeAttribute("style");
					// 		$overlay.style.display = "block";

					// 		// The sidebar overlay was clicked.

					// 		// Hide the sidebar.
					// 		$sidebar.classList.remove("sidebar-show");
					// 		$overlay.style.opacity = 0;

					// 		// Slide the topbar + markdown contents to the right.
					// 		$topbar.classList.remove("mobile-slide");
					// 		$markdown.classList.remove("mobile-slide");
					// 		$overlay.style.display = "none";
					// 	} else {
					// 		// The slide movement occurred but the movement was
					// 		// not enough to cause the reset.

					// 		// Cancel any on-going sliding animate frame request.
					// 		if (slide_animation) {
					// 			cancel(slide_animation);
					// 			slide_animation = null;
					// 		}

					// 		// Remove transitions
					// 		$sidebar.removeAttribute("style");
					// 		$topbar.removeAttribute("style");
					// 		$markdown.removeAttribute("style");
					// 		$shadow.removeAttribute("style");
					// 		$overlay.removeAttribute("style");
					// 		$overlay.style.display = "block";
					// 		$overlay.style.opacity = 1;
					// 	}
					// });
				}
			})
			.catch(function(msg) {
				console.error(msg);
			});
	}
};
