#! /usr/bin/env node

"use strict";

// Node modules.
let fs = require("fs");
let path = require("path");

// Universal modules.
let chalk = require("chalk");
let marked = require("marked");
let prism = require("prismjs");
// Extend the default prismjs languages.
require("prism-languages");
let highlightjs = require("highlight.js");
let argv = require("minimist")(process.argv.slice(2));

// let del = require("del");
let pump = require("pump");
let mkdirp = require("mkdirp");
let fe = require("file-exists");
let findup = require("find-up");
// let json = require("json-file");
// let jsonc = require("comment-json");
let get = require("object-path-get");
let sequence = require("run-sequence");
let cheerio = require("cheerio");

// Lazy load gulp plugins.
let $ = require("gulp-load-plugins")({
	rename: {
		"gulp-clean-css": "clean_css",
		// "gulp-json-sort": "json_sort",
		"gulp-prettier-plugin": "prettier"
		// "gulp-real-favicon": "real_favicon",
		// "gulp-strip-json-comments": "strip_jsonc"
	},
	postRequireTransforms: {
		json_sort: function(plugin) {
			return plugin.default;
		},
		uglify: function() {
			// By default es-uglify is used to uglify JS.
			// [https://stackoverflow.com/a/45554108]
			let uglifyjs = require("uglify-es");
			let composer = require("gulp-uglify/composer");
			return composer(uglifyjs, console);
		}
	}
});

// Project utils.
let utils = require(apath("./gulp/assets/utils/utils.js"));
let print = utils.print;
let notify = utils.notify;
let gulp = utils.gulp;
let uri = utils.uri;
// let browser = utils.browser;
// let bangify = utils.bangify;
let globall = utils.globall;
// let extension = utils.ext;
// let expand_paths = utils.expand_paths;
// let opts_sort = utils.opts_sort;
// let escape = utils.escape;

/**
 * Remove line breaks and tab characters from a string.
 *
 * @param  {string} string - The string to use.
 * @return {string} - The cleaned string.
 */
function remove_space(string) {
	return string.replace(/(\r\n|\n|\r|\t)/g, "");
}

/**
 * Create the absolute path while taking into account the app/module directory.
 *
 * @param  {string} __path - The path to resolve.
 * @return {string} - The resolved path.
 */
function apath(__path) {
	return path.resolve(__dirname, __path);
}

/**
 * Create the absolute path while taking into account the user's directory.
 *
 * @param  {string} __path - The path to resolve.
 * @return {string} - The resolved path.
 */
function upath(__path, recursive) {
	return path.resolve(process.cwd(), __path);
}

// Get the CLI parameters.
let highlighter = (argv.highlighter || argv.h || "p").toLowerCase();
let configpath = argv.config || argv.c;
let outputpath = argv.output || argv.o;
let outputpath_filename = argv.name || argv.n;

// App variables.
let menu = [];
let promises = [];
let first_file = false;

// 1. Look for a config file in the cwd.
// 2. Look for a file in the cwd inside the sub folder configs/FILE or config/FILE.
// 3. If nothing is found throw an error.
// 4. Provide the path from the CLI (CLI path will trump looking for a config file).

// Store the current working directory.
let cwd = process.cwd();

// Look for a config file if one if not provided via the CLI.
if (!configpath) {
	// Look for a config in the current working directory.
	let root_config = path.join(cwd, "devdocs.config.js");
	if (fe.sync(root_config)) {
		// Reset the config path.
		configpath = root_config;
	} else {
		// Look for a config file in a config folder.
		let subconfig_config = path.join(cwd, "/config", "devdocs.config.js");
		if (fe.sync(subconfig_config)) {
			// Reset the config path.
			configpath = subconfig_config;
		} else {
			// Try a final time and look for a sub folder /configs
			let subconfig_config = path.join(
				cwd,
				"/configs",
				"devdocs.config.js"
			);
			if (fe.sync(subconfig_config)) {
				// Reset the config path.
				configpath = subconfig_config;
			} else {
				// If nothing is found return and give an error message.
				return print.gulp.error(
					"A config (devdocs.config.js) file was not found."
				);
			}
		}
	}
}

// Load the configuration file.
let config = require(configpath);
let root = get(config, "root", "docs/");
let toc = get(config, "toc", []);
let links = get(config, "links", {});
let logo = config.logo;
let title = config.title;
let debug = get(config, "debug", true);
let animations = config.animations;
let modifier = config.modifier;
// Add an object to store the converted Markdown to HTML content.
config.files = {};
// Add the default 404 HTML file markup.
config.files._404 = remove_space(
	'<div class="markdown-body animate-fadein"> \
	<div class="error-cont"> \
		<div class="error-logo-cont"><img alt="logo-leaf" class="error-logo" src="${dir_path}/img/leaf-216.png" width="30%"></div> \
		<div class="error-msg-1"><i class="fas fa-exclamation-circle"></i></div> \
		<div class="error-msg-2">The page trying to be viewed does not exist.</div> \
		<div class="error-btn-cont"> \
			<span class="btn btn-white btn-home noselect" id="btn-home">Take me home</span> \
		</div> \
	</div> \
</div>'
);
// Add the svg loader.
config.loader = `<img class="loader-img" src="devdocs/img/loader-dark.svg">`;
// Add the MacOS scrollbar styles.
config.styles_macos_sb = [
	`::-webkit-scrollbar {
	width: 16px;
	height: 16px;
	background: #f8f8f8;
}`,
	`::-webkit-scrollbar:window-inactive {
	background: #f8f8f850;
}`,
	`::-webkit-scrollbar-button {
	width: 0;
	height: 0;
}`,
	`::-webkit-scrollbar-thumb {
	background: #c1c1c1;
	border-radius: 1000px;
	border: 4px solid transparent;
	background-clip: content-box;
}`,
	`::-webkit-scrollbar-thumb:window-inactive {
	background: #c1c1c150;
	border-radius: 1000px;
	border: 4px solid transparent;
	background-clip: content-box;
}`,
	`::-webkit-scrollbar-thumb:hover {
	background: #7d7d7d;
	border: 4px solid transparent;
	background-clip: content-box;
}`,
	`::-webkit-scrollbar-thumb:window-inactive:hover {
	background: #c1c1c150;
	border: 4px solid transparent;
	background-clip: content-box;
}`,
	`::-webkit-scrollbar-track {
	background: 0 0;
	border-radius: 0;
}`,
	`::-webkit-scrollbar-track:vertical {
	background: 0 0;
	border-radius: 0;
	border-left: 1px solid #eaeaea;
}`,
	`::-webkit-scrollbar-track:horizontal {
	background: 0 0;
	border-radius: 0;
	border-top: 1px solid #eaeaea;
}`,
	`::-webkit-scrollbar-track:vertical:window-inactive {
	border-left: 1px solid #eaeaea50;
}`,
	`::-webkit-scrollbar-track:horizontal:window-inactive {
	border-top: 1px solid #eaeaea50;
}`,
	`::-webkit-scrollbar-corner {
	background: #ffffff;
	border-top: 1px solid #dddddd;
	border-left: 1px solid #dddddd;
}`
];

// Honor the CLI outputpath parameter but if nothing is provided reset the
// value to the config given value. If nothing is found in the config file
// then default to the default devdocs folder.
if (!outputpath) {
	outputpath = get(config, "output.path", "devdocs/");
}
if (!outputpath_filename) {
	outputpath_filename = get(config, "output.filename", "data.json");
}

// Make the output folder structure.
mkdirp.sync(outputpath);

// Determine whether to highlight code blocks.
if (highlighter && ["p", "h"].includes(highlighter.charAt(0))) {
	marked.setOptions({
		highlight: function(code, language) {
			// Reset languages.
			if (language) {
				// Reset "md" to "markup".
				if (language.toLowerCase() === "md") {
					language = "markup";
				}
			}

			// Determine what highlighter to use. Either prismjs or highlightjs.
			if (highlighter[0] === "h") {
				// Use highlightjs.
				return highlightjs.highlightAuto(code).value;
			} else {
				// Use prismjs.
				// Default to markup when language is undefined or get an error.
				return prism.highlight(
					code,
					prism.languages[language || "markup"]
				);
			}
		}
	});
}

// Extend the marked renderer:
// [https://github.com/markedjs/marked/blob/master/USAGE_EXTENSIBILITY.md]

// Make a reference to the marked Renderer.
let renderer = new marked.Renderer();

// Add GitHub like anchors to headings.
// [https://github.com/markedjs/marked/blob/master/lib/marked.js#L822]
renderer.heading = function(text, level) {
	let escaped_text = text.toLowerCase().replace(/[^\w]+/g, "-");

	// Copy GitHub anchor SVG. The SVG was lifted from GitHub.
	return `
		<h${level}>
			${text}
            <a href="#${escaped_text}" aria-hidden="true" class="anchor" name="${escaped_text}" id="${escaped_text}">
				<svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewBox="0 0 16 16" width="16">
					<path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z">
					</path>
				</svg>
            </a>
          </h${level}>\n`;
};

// Make checkboxes render like GitHub's.
// [https://github.com/markedjs/marked/blob/master/lib/marked.js#L844]
renderer.listitem = function(text, ordered) {
	// Only change items that start with the following regexp.
	let checkmark_item_pattern = /^\[(.*)\]/;

	// Determine whether it's checked or not.
	if (checkmark_item_pattern.test(text)) {
		// Pattern captures the checkbox and its text.
		let checkbox_pattern = /^\[(.*)\](.*)$/;

		// Run pattern to get matches.
		let matches = text.match(checkbox_pattern);

		// Get the checkbox text content.
		let text_content = matches[2].trim();

		// Determine whether the checkbox is checked.
		let checkbox_content = matches[1].trim();
		// If the checkbox content is not empty it is checked.
		let is_checked = checkbox_content ? 'checked="true"' : "";

		return `
			<li class="task-list-item">
				<input ${is_checked}class="task-list-item-checkbox" disabled="" id="" type="checkbox"> ${text_content}
			</li>\n`;
	} else {
		// Return the original text if not a checkbox item.
		return `<li>${text}</li>\n`;
	}
};

// Setup a counter to use as the id for the directories.
let counter_dir = 1;
// All processed directory data will be contained in this array.
config.dirs = [];

// Supported social platforms for social links.
let socials = {
	user: "fas fa-user-circle",
	facebook: "fab fa-facebook-square",
	twitter: "fab fa-twitter-square",
	youtube: "fab fa-youtube-square",
	vimeo: "fab fa-vimeo-square",
	google_plus: "fab fa-google-plus-square",
	reddit: "fab fa-reddit-square",
	pinterest: "fab fa-pinterest-square",
	snapchat: "fab fa-snapchat-square",
	tumblr: "fab fa-tumblr-square",
	github: "fab fa-github-square",
	bitbucket: "fab fa-bitbucket",
	blogger: "fab fa-blogger",
	stumbleupon: "fab fa-stumbleupon-circle"
};

// Build the social links if provide.
let links_html = ['<div id="link-socials" class="link-socials">'];
if (links) {
	// Loop over the links.
	links.forEach(function(item) {
		// Get the needed information.
		let platform = item[0].toLowerCase();
		let url = item[1];

		// Get the font-awesome classes.
		let fa_classes = socials[platform];

		// Only make the HTML for the platform if the platform is supported.
		if (fa_classes) {
			links_html.push(
				`<div class="social-link"><a href="${url}" target="_blank" class="social-link"><i class="${fa_classes}"></i></a></div>`
			);
		} else {
			print.gulp.warn(
				`'${platform}' was ignored as it's not a supported social link.`
			);
		}
	});
}
// Close the HTML.
links_html.push("</div>");

// Loop over Table-Of-Contents key to generate the HTML files from Markdown.
toc.forEach(function(directory) {
	// Create an object to store all directory information.
	let __dir = {};
	// Add object to the config object.
	config.dirs.push(__dir);

	// Get the directory name
	let dirname = Object.keys(directory)[0];

	// Apply the modifier to the file name if provided.
	let alias_dir = dirname;
	if (modifier) {
		alias_dir = modifier(dirname, "directory");
	}

	// Setup a counter to use as the id for the files.
	let counter_file = 1;

	// Store the directory information.
	__dir.name = dirname;
	__dir.alias = alias_dir;
	__dir.odata = directory; // Original data.
	__dir.html = `<li class="l-1" id="menu-dir-${counter_dir}">${alias_dir}</li>`;
	// All processed files' information will be contained here.
	__dir.files = [];

	// Loop over every file in the directory.
	directory[dirname].forEach(function(file) {
		// Create an object to store all file information.
		let __file = {};
		// Add object to its respective parent directory object.
		__dir.files.push(__file);

		// Remove the .md from the file name if provided.
		file = file.replace(/\.md$/i, "");

		// Apply the modifier to the file name if provided.
		let alias_file = file;
		if (modifier) {
			alias_file = modifier(file, "file");
		}

		// Build the file path.
		let fpath = `${dirname}/${file}`;

		// Store the file information.
		__file.dirname = fpath;
		__file.name = file;
		__file.alias = alias_file;
		__file.html = `<li class="l-2" id="menu-file-${counter_file}" data-dir="${counter_dir}"><i class="fas fa-angle-right menu-arrow" data-file="${fpath}"></i><a class="link" href="#" data-file="${fpath}">${alias_file}</a></li>`;
		// All processed file headings will be contained here.
		__file.headings = [];

		// Build the file path.
		let __path = path.join("./", root, `${dirname}/`, `${file}.md`);
		// Get the absolute path for the file.
		__path = findup.sync(__path);

		// Store the first file.
		if (!first_file) {
			// Attach the first file to the config object.
			config.first_file = `${fpath}`;
			// Set the flag to true.
			first_file = true;
		}

		// Placehold the eventual file before parsed/modified/worked on contents. Once the
		// promise is resolved the -1 will be replaced with the actual worked on file contents.
		// This is done do maintain the file's array order. As promises end once they are
		// resolved, smaller files end quicker. This sometimes causes for the files to be added
		// in the wrong order.
		config.files[`${fpath}`] = -1;

		// Create a Promise for each file.
		let promise = new Promise(function(resolve, reject) {
			// Found headings in the file will be stored in this array.
			let headings = [
				`<ul class="file-headers headings-cont" id="menu-headers-${counter_file}" data-dir="${counter_dir}">`
			];

			// Get the file contents.
			let contents = fs.readFile(__path, "utf8", function(err, contents) {
				if (err) {
					return reject([`${__path} could not be opened.`, err]);
				}

				marked(contents, { renderer: renderer }, function(err, data) {
					if (err) {
						return reject([
							`Marked rendering failed for ${__path}.`,
							err
						]);
					}

					// Use cheerio to parse the HTML data.
					let $ = cheerio.load(data);

					// Grab all anchor elements to
					$("a").each(function(i, elem) {
						// Cache the element.
						let $el = $(this);
						// Get the attributes.
						let href = $el.attr("href");
						let href_untouched = href; // The original href.
						let href_lower = href.toLowerCase();

						// Only when the anchor has an href attribute.
						if (href) {
							// If an href exists, and it is not an http(s) link or
							// scheme-less URLs, and it ends with .md then we have
							// a link that is another documentation file that needs
							// to be linked to.
							if (
								!(
									href_lower.startsWith("htt") ||
									href_lower.startsWith("//")
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
						}
					});

					// Get all headings in the HTML.
					$("h2 a, h3 a, h4 a, h5 a, h6 a").each(function(i, elem) {
						// Cache the element.
						let $el = $(this);

						// Get the element id.
						let id = $el.attr().id;
						// Normalize the id by removing all hyphens.
						let normalized_id = id.replace(/-/g, " ").trim();

						// Add the second level menu template string.
						headings.push(
							`<li class="l-3"><a class="link link-heading" href="#${id}" data-file="${fpath}">${normalized_id}</a></li>`
						);
					});
					// Add the closing tag to the headings HTML.
					headings.push("</ul>");

					// Combine all the headings HTML and add to them to the
					// file object.
					__file.headings.push(headings.join(""));

					// Add the header spacer.
					$("h1, h2, h3, h4, h5, h6").each(function(i, elem) {
						// Cache the element.
						let $el = $(this);

						// Don't add the spacer class if the header group
						// is empty. (no siblings.)
						var spacer_class = !/h[1-6]/i.test($el.next()[0].name)
							? " class='header-spacer'"
							: "";
						$el.after(`<div${spacer_class}></div>`);
					});

					// Hide code blocks that are too big.
					$("pre code[class^='lang']").each(function(i, elem) {
						// Cache the element.
						let $el = $(this);

						// Get text (code) and file stats.
						let text = $el.text().trim();
						let lines = text.split("\n").length;
						let chars = text.split("").length;

						// If the code is > 40 lines show an expander.
						if (lines >= 40) {
							// Get the parent element.
							let $parent = $el.parent();

							// Add the expander.
							$parent.before(`<div class="show-code-cont">
									<div class="code-template-cont">
										<div class="code-template-line">
											<div class="code-template code-template-len40"></div>
											<div class="code-template code-template-len100"></div>
										</div>
										<div class="code-template-left-pad code-template-line">
											<div class="code-template code-template-len40"></div>
											<div class="code-template code-template-len130"></div>
										</div>
										<div class="code-template-left-pad code-template-line">
											<div class="code-template code-template-len40"></div>
											<div class="code-template code-template-len80"></div>
											<div class="code-template code-template-len70"></div>
										</div>
										<div class="code-template-line">
											<div class="code-template code-template-len40"></div>
											<div class="code-template code-template-len50"></div>
										</div>
									</div>
									<div class="show-code-message-cont">
										<div>
											<div>
												<span class="bold noselect">Show code block</span>
												<div class="show-code-file-info">
													<i class="fas fa-code"></i> — ${lines} lines, ${chars} characters
												</div>
											</div>
										</div>
									</div>
								</div>`);

							// Finally hide the element.
							$parent.addClass("none");
							$parent.addClass("animate-fadein");
						}
					});

					// Finally reset the data to the newly parsed/modified HTML.
					data = `<div class="markdown-body animate-fadein">${$.html()}</div>`;

					// Wrap the headers with their "contents".
					// [https://stackoverflow.com/a/21420210]
					var index_of_regexp = function(string, regex, fromIndex) {
						var str = fromIndex
							? string.substring(fromIndex)
							: string;
						var match = str.match(regex);
						return match ? str.indexOf(match[0]) + fromIndex : -1;
					};

					var indices = [];
					var index = index_of_regexp(data, /<h[1-6].*?>/i, 0);
					while (index !== -1) {
						indices.push(index);

						index = index_of_regexp(
							data,
							/<h[1-6].*?>/i,
							index + 1
						);
					}

					// [https://stackoverflow.com/a/25329247]
					String.prototype.insertTextAtIndices = function(text) {
						return this.replace(/./g, function(character, index) {
							return text[index]
								? text[index] + character
								: character;
						});
					};

					// Create the HTML inserts.
					var inserts = {};
					indices.forEach(function(index, i) {
						// <h1st --> Start.
						// <h2nd --> End+Start.
						// <h3rd --> End+Start.
						// <h4th --> End+Start, Find ending tag.

						// Start.
						if (i === 0) {
							inserts[index] =
								'<div class="header-content-ddwrap">';
							// End+Start.
						} else if (i === indices.length - 1) {
							inserts[index] =
								'</div><div class="header-content-ddwrap">';
							inserts[data.length] = "</div>";
						} else {
							// End+Start, Find ending tag.
							inserts[index] =
								'</div><div class="header-content-ddwrap">';
						}
					});

					// Reset the data.
					data = data
						.insertTextAtIndices(inserts)
						.replace(/<\/?(html|body|head)>/gi, "");

					// Add to the object.
					var _placeholder = config.files[`${fpath}`];
					if (_placeholder && _placeholder === -1) {
						// Set the actual contents to the data object.
						config.files[`${fpath}`] = data;
					}

					if (debug) {
						print.gulp.info("Processed", chalk.magenta(`${fpath}`));
					}

					// Finally, resolve the Promise and return the file path,
					// data, and headings as the data.
					resolve([__path, data, headings]);
				});
			});
		});

		// Push the Promise to the promises array.
		promises.push(promise);

		// Increment the file counter.
		counter_file++;
	});
});

// Remove files upon every build.
gulp.task("clean:app", function(done) {
	pump(
		[
			gulp.src([path.join("./", outputpath), path.join("./index.html")]),
			// $.debug(),
			$.clean()
			// $.debug.edit()
		],
		function() {
			if (debug) {
				print.gulp.info("Removed old devdocs files.");
			}

			done();
		}
	);
});

// Create the CSS bundle.
gulp.task("css:app", function(done) {
	let unprefix = require("postcss-unprefix");
	let autoprefixer = require("autoprefixer");
	let perfectionist = require("perfectionist");
	let shorthand = require("postcss-merge-longhand");

	// The default CSS style sheets.
	let css_source_files = [
		"css/vendor/sanitize.css/sanitize.css",
		"css/source/github-markdown.css"
		// "css/vendor/font-awesome/font-awesome.css"
	];

	// Add needed syntax highlight CSS file depending on what was provided
	// via the CLI.

	// Get the first char of the passed in highlighter name.
	let highlighter_fchar = highlighter.charAt(0);

	// If a highlighter name was passed determine whether it is prismjs or
	// highlighterjs.
	if (highlighter_fchar !== "n") {
		if (highlighter_fchar === "h") {
			css_source_files.push("css/source/highlightjs.css");
		} else {
			// Default to prismjs.
			css_source_files.push("css/source/prism-github.css");
		}
	}

	// Add the app styles.
	css_source_files.push("css/source/styles.css");
	// Add CSS animations if wanted.
	if (animations) {
		css_source_files.push("css/source/animations.css");
	}

	// Make the paths absolute to the devdocs module. Not the user's dir.
	css_source_files = css_source_files.map(function(__path) {
		return apath(__path);
	});

	// Get the postcss plugins' configurations.
	let AUTOPREFIXER = require("./configs/autoprefixer.json");
	let PERFECTIONIST = require("./configs/perfectionist.json");

	pump(
		[
			gulp.src(css_source_files),
			// $.debug(),
			$.concat("bundle.min.css"),
			// Replace the default output path with the provided one.
			$.replace(
				/\.\.\/assets\//g,
				// `${path.join(outputpath).replace(process.cwd() + "/", "")}`
				"../"
			),
			$.postcss([
				unprefix(),
				shorthand(),
				autoprefixer(AUTOPREFIXER),
				perfectionist(PERFECTIONIST)
			]),
			// CSS style must be prefixed for it to work at the moment.
			$.replace(/overflow\-scrolling/g, "-webkit-overflow-scrolling"),
			$.clean_css(),
			gulp.dest(path.join(outputpath, "/css"))
			// $.debug.edit()
		],
		function() {
			if (debug) {
				print.gulp.info("Bundled CSS file.");
			}

			done();
		}
	);
});

// Create the JS bundle.
gulp.task("js:app", function(done) {
	pump(
		[
			gulp.src([
				apath("./js/vendor/httpjs/http.js"),
				apath("./js/vendor/fastclick/fastclick.js"),
				apath("./js/vendor/uaparserjs/uaparser.js"),
				// apath("./js/vendor/smoothscrolljs/smoothscroll.js"),
				// apath("./js/vendor/smoothscrolljs/zenscroll.js"),
				apath("./js/source/app.js")
			]),
			// Replace the default output path with the provided one.
			$.replace(
				/var\s*request_path\s+=\s*("|')(.*)\1;/,
				`var request_path = $1${path
					.join(outputpath, outputpath_filename)
					.replace(process.cwd() + "/", "")}$1;`
			),
			// $.debug(),
			$.concat("app.min.js"),
			// $.uglify(),
			gulp.dest(path.join(outputpath, "/js"))
			// $.debug.edit()
		],
		function() {
			if (debug) {
				print.gulp.info("Bundled JS file.");
			}

			done();
		}
	);
});

// Create the index.html file.
gulp.task("html:app", function(done) {
	// Get htmlmin configuration.
	let HTMLMIN = require(apath("./configs/htmlmin.json"));

	// Modify the output path.
	let __path = outputpath.replace(/^[\.\/]+|\/$/g, "");

	// Replace the paths in the error template.
	config.files._404 = config.files._404.replace(/\$\{dir_path\}/g, __path);

	pump(
		[
			gulp.src(apath("./index-src.html")),
			// Set the path to the favicons...
			$.replace(/\$\{dir_path\}/g, __path),
			// $.debug(),
			$.htmlmin(HTMLMIN),
			$.rename("index.html"),
			gulp.dest(cwd)
			// $.debug.edit()
		],
		function() {
			if (debug) {
				print.gulp.info("Created index.html file.");
			}

			done();
		}
	);
});

// Copy the needed images.
gulp.task("img:app", function(done) {
	pump(
		[
			gulp.src(apath(globall("./img/"))),
			// $.debug(),
			gulp.dest(path.join(outputpath, "/img"))
			// $.debug.edit()
		],
		function() {
			if (debug) {
				print.gulp.info("Copied needed image files.");
			}

			done();
		}
	);
});

// Copy the app favicons.
gulp.task("favicon:app", function(done) {
	pump(
		[
			gulp.src(apath(globall("./favicon/"))),
			// $.debug(),
			gulp.dest(path.join(outputpath, "/favicon"))
			// $.debug.edit()
		],
		function() {
			if (debug) {
				print.gulp.info("Copied needed favicon files.");
			}

			done();
		}
	);
});

// // Copy the needed font files.
// gulp.task("fonts:app", function(done) {
// 	pump(
// 		[
// 			gulp.src(apath(globall("./css/assets/fonts/"))),
// 			// $.debug(),
// 			gulp.dest(path.join(outputpath, "/fonts"))
// 			// $.debug.edit()
// 		],
// 		function() {
// 			if (debug) {
// 				print.gulp.info("Copied needed font files.");
// 			}

// 			done();
// 		}
// 	);
// });

// Save the configuration data in its own file to access it in the front-end.
gulp.task("json-data:app", function(done) {
	// Add other needed config data to config object.
	config.logoHTML = `<div class="menu-logo"><div class="menu-logo-wrapper"><img src="${logo}"></div></div>`;
	config.menu = menu;
	config.socials = links_html.join("");

	pump(
		[
			// Create the file via gulp-file and use is at the Gulp.src.
			$.file(outputpath_filename, JSON.stringify(config), {
				src: true
			}),
			// $.debug.edit(),
			gulp.dest(path.join(outputpath))
		],
		function() {
			if (debug) {
				print.gulp.info("Saved devdocs JSON configuration data file.");
			}

			done();
		}
	);
});

// Run all the promises.
Promise.all(promises)
	.then(
		function(values) {
			if (debug) {
				print.gulp.info("All promises completed.");
			}

			// Loop over the directories to make the menu HTML.
			config.dirs.forEach(function(directory) {
				let html = [];

				// Loop over all files  to get the HTML and headings.
				directory.files.forEach(function(file) {
					html.push(file.html, file.headings);
				});

				// Create the submenu for the current directory.
				menu.push(
					remove_space(`<ul class="submenu">
					${directory.html}
					<li>
						<div class="menu-section-cont">
							<ul>
								${html.join("")}
							</ul>
						</div>
					</li>
					</ul>`)
				);
			});

			// Run the tasks.
			sequence.apply(null, [
				"clean:app",
				"css:app",
				"js:app",
				"html:app",
				"img:app",
				"favicon:app",
				// "fonts:app",
				"json-data:app",
				function() {
					print.gulp.success("Documentation generated.");
				}
			]);
		},
		function(err) {
			print.gulp.error("Failed to generate documentation.");
			print(err);
		}
	)
	.catch(function(err) {
		if (typeof err[0] === "string") {
			print.gulp.error(err[0]);
			print(err[1]);
		} else {
			print(err);
		}
	});
