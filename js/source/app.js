document.onreadystatechange = function() {
	// All resources have loaded (document + subresources).
	if (document.readyState === "complete") {
		// Init FastClickJS.
		if ("addEventListener" in document) {
			FastClick.attach(document.body);
		}

		var request_path = "./devdocs/data.json";
		// Make the request to get the devdocs data file.

		// Grab the http library.
		var http = window.app.libs.http;

		function req_complete_loader() {
			setTimeout(function() {
				$loader.style.opacity = `0`;
			}, 500);

			setTimeout(function() {
				$loader.style.display = "none";
			}, 700);
		}

		// Get the loader element.
		var $loader = document.getElementById("loader");

		// create a new http request
		var req = new http(request_path);
		// Parse the data as JSON.
		req.parseJSON(true);

		// Listen to the http request progress event.
		req.events({
			progress: function(e) {
				if (e.lengthComputable) {
					$loader.style.width = `${e.loaded / e.total * 100}%`;
				}
			}
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
				req_complete_loader();

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

				// Store the currently displayed file.
				var current_file;
				var menu_show_count = 0;

				/**
				 * Parse the URL query parameters.
				 *
				 * @return {object} - Object containing the parameter pairs.
				 */
				function parameters() {
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
				}

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

					// Calculate the element height.
					var height = getComputedStyle(
						document.getElementById("virtual-height-element"),
						null
					).height;

					// Store the height for future runs.
					heights[filename] = height;

					// Remove the virtual element.
					var $vel = document.getElementById(
						"virtual-height-element"
					);
					$vel.parentNode.removeChild($vel);

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
					let file = data.files[filename];

					// Show 404 file when selected file does not exist.
					if (!file) {
						let error_404 = "_404";
						file = data.files[error_404];
						filename = error_404;
					}

					// Un-highlight/Highlight:

					// Un-highlight the current highlighted menu element.
					let $current = document.querySelector(
						`[data-file="${current_file}"]`
					);
					if ($current) {
						let $parent = $current.parentNode;
						// Remove the highlight.
						$parent.classList.remove("active-page");
						$parent.nextElementSibling.style.height = 0;
						$parent.nextElementSibling.style.opacity = 0;

						// Un-highlight the menu arrow and reset to right
						// position.
						let menu_arrow = $parent.children[0];
						let menu_classes = menu_arrow.classList;
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
						$new_current.classList.add("active-page");

						// Get the menu arrow element and its CSS classes.
						let menu_arrow = $new_current.children[0];
						let menu_classes = menu_arrow.classList;

						setTimeout(function() {
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
						}, !menu_show_count ? 500 : 200);
					}

					// Reset the active element.
					current_file = filename;

					// Inject the html.
					document.getElementById("markdown").innerHTML = file;

					// Get the hash.
					var hash = location.hash;

					// Scroll to hash.
					if (hash) {
						var $el = document.getElementById(hash.slice(1));
						if ($el) {
							var $parent = $el.parentNode;
							$parent.classList.add("highlight");
							$el.scrollIntoView({
								behavior: "smooth"
							});
							$parent.classList.add("highlight");
						}
					}
				}

				window.addEventListener("popstate", function(event) {
					// Parse the URL query parameters.
					var params = parameters();

					// Inject the file contents to the page. Provide the
					// inject function the page parameter or default to the
					// first file when the page parameter does not exist.
					inject(params.page ? params.page : data.first_file);
				});

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

				// Parse the URL query parameters.
				var params = parameters();

				// Inject the file contents to the page. Provide the
				// inject function the page parameter or default to the
				// first file when the page parameter does not exist.
				inject(params.page ? params.page : data.first_file);

				// Listen to app clicks.
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
						// Scroll to the header.
						$header.scrollIntoView({
							behavior: "smooth"
						});
						// Highlight the header.
						$header.classList.add("highlight");

						// Don't store the same hash. Only store if the hash
						// is different than the current hash.
						if (location.hash !== href) {
							history.pushState({}, null, `${href}`);
						}

						// Hide the mobile sidebar + overlay.
						let $overlay = document.getElementsByClassName(
							"sidebar-overlay"
						)[0];
						if (getComputedStyle($overlay).display === "block") {
							// Hide the overlay and the sidebar.
							// Hide the sidebar.
							let $sidebar = document.getElementById("sidebar");
							$sidebar.classList.remove("sidebar-show");
							$overlay.style.opacity = 0;

							setTimeout(function() {
								$overlay.style.display = "none";
							}, 150);
						}

						return;
					} else if (classes.contains("btn-home")) {
						// Get the data-attribute.
						filename = data.first_file;

						// Reset the target element.
						$target = document.querySelector(
							`a.link[data-file='${filename}']`
						).parentNode;
					} else if (classes.contains("mobile-menu-ham")) {
						// Show the sidebar.
						let $sidebar = document.getElementById("sidebar");
						// $sidebar.classList.remove("sidebar-show");
						$sidebar.classList.add("sidebar-show");
						let $overlay = document.getElementsByClassName(
							"sidebar-overlay"
						)[0];

						$overlay.style.display = "block";
						setTimeout(function() {
							$overlay.style.opacity = 1;
						}, 150);
						// console.log("showing the sidbar");

						return;
					} else if (classes.contains("sidebar-overlay")) {
						// Hide the sidebar.
						let $sidebar = document.getElementById("sidebar");
						$sidebar.classList.remove("sidebar-show");
						$target.style.opacity = 0;

						setTimeout(function() {
							$target.style.display = "none";
						}, 150);

						// console.log("hid the side-bar");

						return;
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
						document.body.scrollIntoView({
							// behavior: "smooth",
							block: "start"
						});

						e.preventDefault();
					}
				});
			})
			.catch(function(msg) {
				console.error(msg);
			});
	}
};
