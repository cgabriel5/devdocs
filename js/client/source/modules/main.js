/*jshint bitwise: false*/
/*jshint browser: true*/
/*jshint esversion: 6 */
/*jshint node: false*/
/*jshint -W014 */
/*jshint -W018 */
/*jshint maxerr: 10000 */

"use strict";

app.module(
	"main",
	function(modules, name) {
		// Imports.
		let globals = modules.globals;
		var SETGLOBAL = globals.SETGLOBAL;
		var GETGLOBAL = globals.GETGLOBAL;

		var REQUEST_PATH = GETGLOBAL("REQUEST_PATH");
		// Store all fetched data.
		var DATA;
		// Get needed data.
		var VERSIONS;
		var LATEST;
		var VPROCESSED;
		var FIRST_FILE;
		var FILES;
		var INTERNAL_FILES;
		var USER_FILES;
		var CBS_FILES;
		// ------------
		var COMPONENTS;
		var SCROLLBARS;
		var LOGO;
		var FOOTER;
		// ------------
		var SETTINGS;
		var TITLE;
		var GITHUB;
		// ------------
		var FETCHED;
		var DIRS;

		let utils = modules.utils;
		let parameters = utils.parameters;
		let user_agent = utils.user_agent;
		let is_desktop_webkit = utils.is_desktop_webkit;
		let stylesheet = utils.stylesheet;
		let format = utils.format;
		let classes = utils.classes;

		let $$ = modules.$$;
		let $markdown = $$.$markdown;
		let $splash = $$.$splash;
		let $splash_icon = $$.$splash_icon;
		let $crumbs_folder = $$.$crumbs_folder;
		let $tb_loader = $$.$tb_loader;
		let $search = $$.$search;
		let $versions = $$.$versions;
		let $vlist = $$.$vlist;
		let $version = $$.$version;
		let $releases = $$.$releases;
		let $sb_menu = $$.$sb_menu;
		let $sb_footer = $$.$sb_footer;

		let core = modules.core;
		let show_tb_loader = core.show_tb_loader;
		let inject_sidebar_tops_css = core.inject_sidebar_tops_css;
		let inject = core.inject;

		// Grab the HTTP library.
		let libs = modules.libs;
		let http = libs.http;

		// ---------------------------------------------------------------------

		// Start the logo/splash animations.
		classes($splash_icon, "off");

		// Create main data HTTP request.
		var req = new http(REQUEST_PATH);
		// Make sure to parse data as JSON.
		req.parseJSON(true);
		// Run request.
		req
			.run()
			.then(function(xhr) {
				// Check request success.
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
			.then(function() {
				// Store fetched data.
				DATA = SETGLOBAL("DATA", arguments[0]);

				// Get needed data.
				VERSIONS = SETGLOBAL("VERSIONS", DATA.versions);
				LATEST = SETGLOBAL("LATEST", VERSIONS.latest);
				VPROCESSED = SETGLOBAL("VPROCESSED", VERSIONS.processed);
				FIRST_FILE = SETGLOBAL("FIRST_FILE", VERSIONS.first_file);
				FILES = SETGLOBAL("FILES", VERSIONS.files);
				INTERNAL_FILES = SETGLOBAL("INTERNAL_FILES", FILES.internal);
				USER_FILES = SETGLOBAL("USER_FILES", FILES.user);
				CBS_FILES = SETGLOBAL("CBS_FILES", FILES.cbs);
				// ------------
				COMPONENTS = SETGLOBAL("COMPONENTS", DATA.components);
				SCROLLBARS = SETGLOBAL("SCROLLBARS", COMPONENTS.scrollbars);
				LOGO = SETGLOBAL("LOGO", COMPONENTS.logo);
				FOOTER = SETGLOBAL("FOOTER", COMPONENTS.footer);
				// ------------
				SETTINGS = SETGLOBAL("SETTINGS", DATA.settings);
				TITLE = SETGLOBAL("TITLE", SETTINGS.title);
				GITHUB = SETGLOBAL("GITHUB", SETTINGS.github);
			})
			.then(function() {
				// Get data file for specified version.
				// Get the version.
				var params = parameters();

				// Get the version.
				var version = params.v;
				if (!version) {
					// Get the latest version.
					version = LATEST;

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
				// Make sure to parse data as JSON.
				req.parseJSON(true);
				// Run request.
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
					classes($search, "none");

					// Get the version.
					let version = parameters().v;

					// Get the versions array.
					var versions = VPROCESSED;

					if (versions.length) {
						// Finally inject the 404 version HTML.
						$markdown.innerHTML = format(
							INTERNAL_FILES._404_version,
							{
								version: `<code>v${version}</code>`,
								versions: versions.length
									? versions
											.map(function(item) {
												return `<div class="found-versions"><a href="?v=${item}"><code class="found-version"><i class="fas fa-external-link-square-alt"></i>v${item}</code></a></div>`;
											})
											.join("")
									: ""
							}
						);

						// Show the versions list if versions exists.
						classes(
							document.getElementById("error-content"),
							"!none"
						);
						// Add the message.
						document
							.querySelectorAll(".error .message")[0]
							.insertAdjacentHTML(
								"beforeend",
								versions.length
									? " Docs exist for:"
									: " No other versions exist."
							);
					} else {
						// If there are no docs at all show that specific HTML error.
						$markdown.innerHTML = INTERNAL_FILES._404_missing_docs;
					}

					// Throw error to stop further code execution.
					return Promise.reject(
						`Failed to load ${parameters().v} data file.`
					);
				}
			})
			.then(function() {
				// Combine the data sets.
				DATA.fetched = arguments[0];

				// Get needed data.
				FETCHED = SETGLOBAL("FETCHED", DATA.fetched);
				DIRS = SETGLOBAL("DIRS", FETCHED.dirs);

				// Get the file contents.
				var contents = {};
				DIRS.forEach(function(dir) {
					contents = Object.assign(contents, dir.contents);
				});

				USER_FILES = SETGLOBAL("USER_FILES", contents);
				// Get the first file.
				FIRST_FILE = SETGLOBAL("FIRST_FILE", DIRS[0].first_file);
			})
			.then(function() {
				// Add needed stylesheets.
				(function() {
					// Add MacOS scrollbars stylesheet.
					// Only if engine is webkit.
					if (user_agent().engine.name !== "WebKit") {
						return;
					}

					// Create the stylesheet.
					var $sheet = stylesheet(
						SCROLLBARS.macos.join(""),
						"dd/mac-scrollbars"
					);

					// Only enable MacOS style scrollbars when running Chrome
					// on a desktop device.
					if (!is_desktop_webkit()) {
						$sheet.disabled = true;
					}
				})();
			})
			.then(function() {
				setTimeout(function() {
					// Turn the logo green.
					classes($splash_icon, "on");
				}, 100);

				// Set the title if provided.
				if (TITLE) {
					document.title = TITLE;

					// Set the topbar information.
					$crumbs_folder.textContent = TITLE;
				}

				// Note: Pre-load logo to prevent "blinking in".
				return new Promise(function(resolve, reject) {
					// Get the logo source/SVG data object.
					var logo = COMPONENTS.logo;

					// Load image if provided in data object.
					if (logo) {
						// If an SVG is provided...
						if (typeof logo === "object") {
							resolve(DATA);
						} else {
							// Create HTMLImageElement instance for non SVG image.
							var $image = new Image();

							// Attach event listeners to image instance.
							$image.onload = function() {
								// Get photo dimensions.
								var w = this.width;
								var h = this.height;

								// Reset the logo data.
								COMPONENTS.logo = {
									width: w,
									height: h,
									src: logo,
									type:
										w === h
											? "square"
											: w > h ? "landscape" : "portrait"
								};

								resolve(DATA);
							};
							$image.onerror = function() {
								reject();
							};

							// Add the image source file.
							$image.src = logo;
						}
					} else {
						// If the data object does not contain an image simply
						// resolve the promise to continue with the chain.
						resolve(DATA);
					}
				}).then(null, function() {
					return Promise.reject("Failed to load logo.");
				});
			})
			.then(function() {
				// console.log(DATA);

				// Animate the logo.
				classes($splash_icon, "animate-pulse");

				// Enclose in a timeout to give the loader a chance to fade away.
				setTimeout(function() {
					// Get the logo source/SVG data object.
					var logo = COMPONENTS.logo;

					// Embed the logo to the page if it exists.
					if (logo) {
						// Get the GitHub project URL.
						var project_url = GITHUB.project_url;

						// Vars.
						var link_start = "",
							link_end = "";

						// Make the link HTML if the GitHub info exists.
						if (project_url) {
							link_start = `<a href="${project_url}" target="_blank">`;
							link_end = "</a>";
						}

						// Make the needed image HTML.
						var img_html = !logo.data
							? `<img src="${logo.src}">`
							: logo.data;
						var logo_html = `<div class="animate-fadein animate-logo logo ${
							logo.type
						} none">${link_start}${img_html}${link_end}</div>`;

						// Since a logo was provided insert a flex wrapper to
						// allow the logo and search elements to be adjacent.
						$search.insertAdjacentHTML(
							"afterbegin",
							'<div class="logo-search-wrapper" id="logo-search-wrapper"></div>'
						);

						// Get the added element.
						var $logo_search_wrapper = document.getElementById(
							"logo-search-wrapper"
						);

						// Move search-ui element into the logo search wrapper.
						$logo_search_wrapper.appendChild(
							$search.getElementsByClassName("search-ui")[0]
						);
						// Embed the sidebar image into the wrapper.
						$logo_search_wrapper.insertAdjacentHTML(
							"afterbegin",
							logo_html
						);

						// Embed the topbar logo.
						$tb_loader.insertAdjacentHTML(
							"beforebegin",
							logo_html.replace(
								"_blank",
								'_blank" class="topbar-fix'
							)
						);

						// Show logos after some time.
						setTimeout(function() {
							var $els = document.getElementsByClassName("logo");
							for (let i = 0, l = $els.length; i < l; i++) {
								classes($els[i], "!none");
							}
						}, 200);
					}

					// Get the version.
					var params = parameters();
					// Get the version.
					var version = params.v || LATEST;

					// Show the versions container.
					classes($versions, "!none");
					// Add the versions.
					var versions = VPROCESSED;
					var latest = LATEST;
					var versions_html = [];
					versions.forEach(function(v) {
						versions_html.push(
							`<div class="version-option" data-v="${v}">` +
								(v === version
									? '<i class="fa-check fas"></i>'
									: "") +
								`<span class="vtext">${v}</span>` +
								(v === latest
									? '<span class="version-latest">latest</span>'
									: "") +
								`</div>`
						);
					});
					// Inject the versions list.
					$vlist.innerHTML = versions_html.join("");
					// Set the current version.
					$version.innerHTML = `<i class="fas fa-layer-group"></i> v${version}`; // +
					$version.insertAdjacentHTML(
						"afterend",
						version === latest
							? '<span class="version-latest">latest</span>'
							: '<span class="version-latest version-outdated">outdated</span>'
					);
					$version.setAttribute("data-v", version);

					// Show the released UI.
					if (GITHUB.releases_url) {
						// Inject the URL if provided.
						$releases.innerHTML = `<a href="${
							GITHUB.releases_url
						}" target="_blank"><i class="fas fa-tag"></i> Releases</a>`;
					}

					// Inject the needed sidebar menu item tops CSS.
					inject_sidebar_tops_css();

					// Add the sidebar HTML.
					document.getElementById(
						"menu-dynamic-cont"
					).innerHTML = FETCHED.menu.join("");

					// Get the menu elements.
					// [https://davidwalsh.name/nodelist-array]
					SETGLOBAL(
						"$l_2",
						Array.prototype.slice.call(
							document.getElementsByClassName("l-2")
						)
					);

					// Animate the entire menu.
					classes($sb_menu, "animate-fadein");

					// Show the sidebar footer.
					classes($sb_footer, "!none");

					// Inject the file contents to the page. Provide the
					// inject function the page parameter or default to the
					// first file when the page parameter does not exist.
					show_tb_loader();
					inject(params.p ? params.p : FIRST_FILE);
				}, 500);
			})
			.catch(function(msg) {
				console.error(msg);
			});
	},
	"complete",
	"Main app module is where the app's logic should be placed."
);
