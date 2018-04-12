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
		var $delement = document.documentElement;
		var $loader = document.getElementById("loader");
		var $topbar = document.getElementById("topbar");
		var $sidebar = document.getElementById("sidebar");
		var $markdown = document.getElementById("markdown");
		var $overlay = document.getElementsByClassName("sidebar-overlay")[0];

		// Variables //

		// The request filepath.
		var REQUEST_PATH = "./devdocs/data.json";
		var SCROLL_TIME = 250;

		// Functions //

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
		 * An custom animated scrolling function.
		 *
		 * @param  {Object} window - The window object.
		 * @return {function} - The scrolling function.
		 *
		 * @resource [https://github.com/madebysource/animated-scrollto]
		 */
		var scroll = (function(window) {
			var ease_in_out_quad = function(t, b, c, d) {
				t /= d / 2;
				if (t < 1) return c / 2 * t * t + b;
				t--;
				return -c / 2 * (t * (t - 2) - 1) + b;
			};

			return function(element, to, duration, callback) {
				var start = element.scrollTop,
					change = to - start,
					animation_start = +new Date();
				var animating = true;
				var lastpos = null;

				var animate_scroll = function() {
					if (!animating) {
						if (callback) {
							callback();
						}
						return;
					}
					request_aframe(animate_scroll);
					var now = +new Date();
					var val = Math.floor(
						ease_in_out_quad(
							now - animation_start,
							start,
							change,
							duration
						)
					);
					if (lastpos) {
						if (lastpos === element.scrollTop) {
							lastpos = val;
							element.scrollTop = val;
						} else {
							animating = false;
						}
					} else {
						lastpos = val;
						element.scrollTop = val;
					}
					if (now > animation_start + duration) {
						element.scrollTop = to;
						animating = false;
					}
				};
				request_aframe(animate_scroll);
			};
		})(window);

		/**
		 * The loader animation function.
		 *
		 * @param  {eventobject} e - The browser event object.
		 * @return {undefined} - Nothing.
		 */
		var done_loader = false;
		var loader = function(e) {
			function animate_loader() {
				if (e.lengthComputable && done_loader !== true) {
					// Calculate the percentage.
					var percent = e.loaded / e.total * 100;

					// Update the loader with the percent.
					$loader.style.width = `${percent}%`;

					// Once fully loaded end animating.
					if (percent === 100) {
						done_loader = true;
						return;
					} else {
						// Else continue animating.
						request_aframe(animate_loader);
					}
				}
			}
			// Start animating.
			request_aframe(animate_loader);
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
		 * Get the provided element's top coordinate position in relation to the
		 *     page and y-scroll amount.
		 *
		 * @return {number} - The top position.
		 */
		var get_element_top_pos = function($el) {
			return $el.getBoundingClientRect().top + window.pageYOffset - 50;
		};

		// ------------------------------------------------------------

		// Create a new HTTP request.
		var req = new http(REQUEST_PATH);
		// Parse the data as JSON.
		req.parseJSON(true);
		// Listen to the HTTP request progress event.
		req.events({
			progress: loader
		});
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
				// Fade-out the loader.
				setTimeout(function() {
					$loader.style.opacity = `0`;
					setTimeout(function() {
						$loader.style.display = "none";
					}, 200);
				}, 500);

				// Set the title if provided.
				if (data.title) {
					document.title = data.title;
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
				var menu_show_count = 0;

				// Functions:Scoped:Inner //

				// Contain all the sidebar submenu heights.
				var heights = {};
				/**
				 * Get the height of a submenu using a virtual element.
				 *
				 * @param  {HTMLElement} $new_current - The newly clicked
				 *     menu directory element.
				 * @param  {string} filename - The file name.
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
				 * Inject the data HTML to the page.
				 *
				 * @param  {string} filename - The file name.
				 * @param  {HTMLElement} $new_current - The newly clicked
				 *     menu directory element.
				 * @return {undefined} - Nothing.
				 */
				function inject(filename, $new_current) {
					// Don't inject the same file content when the menu
					// item is clicked again.
					if (filename === current_file) {
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
						$parent.nextElementSibling.style.height = 0;
						$parent.nextElementSibling.style.opacity = 0;

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

						setTimeout(function() {
							// Change text color to blue.
							$new_current.classList.add("active-page");
							// Change the menu arrow to be active (blue/down).
							menu_classes.add("menu-arrow-active");
							menu_classes.remove("fa-angle-right");
							menu_classes.add("fa-angle-down");

							$new_current.nextElementSibling.style.height = get_height(
								$new_current,
								filename
							);
							$new_current.nextElementSibling.style.opacity = 1;

							// Increment the show counter.
							menu_show_count++;
						}, !menu_show_count ? 500 : 300);
					}

					// Reset the active element.
					current_file = filename;

					// Inject the html.
					$markdown.innerHTML = file;

					// Get the hash.
					var hash = location.hash;

					// Scroll to hash.
					if (hash) {
						var $el = document.getElementById(hash.slice(1));
						if ($el) {
							var $parent = $el.parentNode;

							// Use a timeout to let the injected HTML load
							// and parse properly. Otherwise, getBoundingClientRect
							// will return incorrect values.
							setTimeout(function() {
								scroll(
									$delement,
									get_element_top_pos($parent),
									SCROLL_TIME,
									function() {
										$parent.classList.add("highlight");
									}
								);
							}, 500);
						}
					}
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

					// Parse the URL query parameters.
					var params = parameters();

					// Inject the file contents to the page. Provide the
					// inject function the page parameter or default to the
					// first file when the page parameter does not exist.
					inject(params.page ? params.page : data.first_file);
				}, 200);

				// EventListeners:Scoped:Inner //

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
							// Hide the sidebar.
							$sidebar.classList.remove("sidebar-show");
							$overlay.style.opacity = 0;

							// Slide the topbar + markdown contents to the right.
							$topbar.classList.remove("mobile-slide");
							$markdown.classList.remove("mobile-slide");

							setTimeout(function() {
								$overlay.style.display = "none";
							}, 150);
						}
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

						scroll(
							$delement,
							get_element_top_pos($header),
							SCROLL_TIME,
							function() {
								// Highlight the header.
								$header.classList.add("highlight");

								// Hide the mobile sidebar + overlay.
								if (
									getComputedStyle($overlay).display ===
									"block"
								) {
									// Hide the sidebar.
									$sidebar.classList.remove("sidebar-show");
									$overlay.style.opacity = 0;

									// Slide the topbar + markdown contents to the right.
									$topbar.classList.remove("mobile-slide");
									$markdown.classList.remove("mobile-slide");

									setTimeout(function() {
										$overlay.style.display = "none";
									}, 150);
								}
							}
						);

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

						// Scroll to the top of the page.
						scroll($delement, 0, SCROLL_TIME);

						e.preventDefault();
					}
				});

				// [http://patrickmuff.ch/blog/2014/10/01/how-we-fixed-the-webkit-overflow-scrolling-touch-bug-on-ios/]
				// [https://stackoverflow.com/a/33024813]
				// [https://stackoverflow.com/a/41601290]
				// [https://stackoverflow.com/a/41565471]
				if (touchsupport()) {
					document.addEventListener("touchstart", function(e) {
						// Get the target element.
						var $target = e.target;
						var classes = $target.classList;

						// The hamburger menu was clicked.
						if (classes.contains("mobile-menu-ham")) {
							// Show the sidebar.
							$sidebar.classList.add("sidebar-show");

							// Slide the topbar + markdown contents to the right.
							$topbar.classList.add("mobile-slide");
							$markdown.classList.add("mobile-slide");

							$overlay.style.display = "block";
							setTimeout(function() {
								$overlay.style.opacity = 1;
							}, 150);
						} else if (classes.contains("sidebar-overlay")) {
							// The sidebar overlay was clicked.

							// Hide the sidebar.
							$sidebar.classList.remove("sidebar-show");
							$target.style.opacity = 0;

							// Slide the topbar + markdown contents to the right.
							$topbar.classList.remove("mobile-slide");
							$markdown.classList.remove("mobile-slide");

							setTimeout(function() {
								$target.style.display = "none";
							}, 150);
						}

						// [https://stackoverflow.com/a/42288386]
						// [https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action]
						// [https://github.com/OwlCarousel2/OwlCarousel2/issues/1790]
						// [https://developers.google.com/web/updates/2017/01/scrolling-intervention]
						// e.preventDefault();
					});

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
				}
			})
			.catch(function(msg) {
				console.error(msg);
			});
	}
};
