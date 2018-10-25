"use strict";

// Node modules.
let path = require("path");
let fs = require("fs");

// Universal modules.
let chalk = require("chalk");
let pump = require("pump");

/**
 * Process any SASS files into their CSS equivalents.
 */
module.exports = function(refs) {
	// Get needed references.
	let outputpath_filename = refs.outputpath_filename;
	let remove_space = refs.remove_space;
	let debug_flist = refs.debug_flist;
	let outputpath = refs.outputpath;
	let config = refs.config;
	let footer = refs.footer;
	let debug = refs.debug;
	let print = refs.print;
	let dirs = refs.dirs;
	let gulp = refs.gulp;
	let done = refs.cb;
	let $ = refs.$;

	// Add other needed config data to config object.
	config.html.footer = footer;

	// If the latest version is not one of the processed version, throw
	// an error message.
	if (debug && !config.pversions.includes(config.latest)) {
		print.gulp.warn(
			"The latest version:",
			chalk.magenta(config.latest),
			"was not one of the processed versions:"
		);

		// Show processed versions.
		print.ln();
		print(chalk.underline("Processed versions"));

		// Log versions.
		config.pversions.forEach(function(item) {
			print(`  ${item}`);
		});

		print.ln();
	}

	var __path = path.join(outputpath, "/zdata");

	pump(
		[
			// Create the file via gulp-file and use is at the Gulp.src.
			$.file(outputpath_filename, JSON.stringify(config, null, 4), {
				src: true
			}),
			$.gulpif(
				debug_flist,
				$.debug.edit({
					loader: false,
					title: "saved data file..."
				})
			),
			gulp.dest(__path)
		],
		function() {
			if (debug) {
				print.gulp.info(
					"Saved",
					chalk.magenta(`${path.join(__path, outputpath_filename)}`),
					"(main data file)"
				);
			}

			var fpromises = [];

			// Loop over the dirs array and save each object into its own file.
			dirs.forEach(function(dir) {
				var menu = [];

				// Loop over the directories to make the menu HTML.
				dir.forEach(function(directory, index) {
					let html = [];

					// Loop over all files  to get the HTML and headings.
					directory.files.forEach(function(file) {
						// html.push(file.html, file.headings);
						html.push(file.html);
					});

					// Create the submenu for the current directory.
					menu.push(
						remove_space(`<ul id="submenu-${index +
							1}" class="submenu">
						${directory.html}
						<li>
							<div class="menu-section" data-dir="${index}">
								<ul id="submenu-inner-${index + 1}" class="submenu-ul">
									${html.join("")}
								</ul>
							</div>
						</li>
						</ul>`)
					);
				});

				dir.menu = menu;

				fpromises.push(
					new Promise(function(resolve, reject) {
						var outputpath = path.join(
							__path,
							outputpath_filename.replace(
								/(\.json)$/,
								`-${dir.version}$1`
							)
						);

						var jstring = JSON.stringify(
							{ dirs: dir, menu: menu, outputpath: outputpath },
							null,
							4
						);
						fs.writeFile(outputpath, jstring, function(err) {
							if (err) {
								return reject([
									`${outputpath} could not be opened.`,
									err
								]);
							}

							if (debug) {
								print.gulp.info(
									"Saved",
									chalk.magenta(`${outputpath}`),
									"(version data file)"
								);
							}

							resolve([dir]);
						});
					})
				);
			});

			// Run all the promises.
			return Promise.all(fpromises)
				.then(
					function(/*values*/) {
						if (debug) {
							print.gulp.info(
								"All data/version promises completed."
							);
						}

						done();
					},
					function(err) {
						print.gulp.error(
							"Failed to save data/versions JSON files."
						);
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
		}
	);
};
