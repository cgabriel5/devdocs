"use strict";

// Universal modules.
let pump = require("pump");
let lint_printer = $app.module("@main/lint_printer.js");

/**
 * Process any SASS files into their CSS equivalents.
 */
module.exports = function(refs) {
	// Get needed references.
	let debug_flist = refs.debug_flist;
	let initial = refs.initial;
	let debug = refs.debug;
	let print = refs.print;
	let gulp = refs.gulp;
	let done = refs.cb;
	let $ = refs.$;

	// Skip task logic if initial flag is not set.
	if (!initial) {
		if (debug) {
			print.gulp.warn("Skipped SCSS processing.");
		}

		return done();
	}

	// NOTE: Make sure to exclude partials (_filename.scss) from processing.
	// [https://stackoverflow.com/a/38095853]

	// The default SCSS style sheets.
	let scss_source_files = ["css/source/scss/**/[^_]*.*scss"];

	// Make the paths absolute to the devdocs module. Not the user's dir.
	scss_source_files = scss_source_files.map(path => $app.rpath(path));

	let sass = require("node-sass");

	// Contain any SCSS processing errors here.
	var scss_errors = { filenames: [] };

	pump(
		[
			gulp.src(scss_source_files),
			$.gulpif(
				debug_flist,
				$.debug({
					loader: false,
					title: "files for SASS processing..."
				})
			),
			$.each(function(content, file, callback) {
				// Get the file path.
				var __path = file.path;

				// Run the Node-SASS processor on the file.
				// [https://github.com/sass/node-sass#render-callback--v300]
				sass.render({ file: __path }, function(err, result) {
					if (err) {
						// Store the error for later output.
						if (scss_errors[__path]) {
							// Append to the errors.
							scss_errors[__path].push([
								err.line,
								err.column,
								err.status,
								err.message
							]);
						} else {
							// Add for the first time.
							scss_errors[__path] = [
								[err.line, err.column, err.status, err.message]
							];

							// Maintain file processing order.
							scss_errors.filenames.push(__path);
						}
					} else {
						// Reset the file contents with the CSS output.
						file.contents = Buffer.from(result.css.toString());
					}

					callback(null, file.contents);
				});
			}),
			$.rename(function(path) {
				// Rename the file extension from .scss to .css.
				path.extname = ".css";
			}),
			// // [https://github.com/dlmanning/gulp-sass]
			// // [https://gist.github.com/zwinnie/9ca2409d86f3b778ea0fe02326b7731b]
			// $.sass.sync().on("error", function(err) {
			// 	// $.sass.logError
			// 	// NOTE: For consistency, use the universal lint printer.

			// 	// Pretty print the issues.
			// 	lint_printer(
			// 		[[err.line, err.column, err.name, err.messageOriginal]],
			// 		err.relativePath
			// 	);

			// 	// [https://github.com/dlmanning/gulp-sass/blob/master/index.js]
			// 	// End gulp.
			// 	this.emit("end");
			// }),
			gulp.dest($app.rpath("./css/source/css")),
			$.gulpif(
				debug_flist,
				$.debug.edit({
					loader: false,
					title: "SASS files processed..."
				})
			)
		],
		function() {
			// Output any processing errors.
			if (scss_errors.filenames.length) {
				// Loop over the errors.
				for (let i = 0, l = scss_errors.filenames.length; i < l; i++) {
					// Cache current loop item.
					var filename = scss_errors.filenames[i];

					// Print the errors.
					lint_printer(scss_errors[filename], filename);
				}
			}

			done();
		}
	);
};
