/**
 * Process any SASS files into their CSS equivalents.
 *
 * @internal - Ran via the "css" task.
 */
gulp.task("css:sass", function(done) {
	// Pause the watcher to prevent infinite loops.
	$.watcher.pause("watcher:css:app");

	let sass = require("node-sass");

	// Contain any SCSS processing errors here.
	var scss_errors = { filenames: [] };

	pump(
		[
			gulp.src([$paths.files_all.replace(/\*$/, "scss")], {
				cwd: $paths.scss_source
			}),
			$.debug({ loader: false, title: "files for SASS processing..." }),
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

			// Old Gulp SASS method.
			// // [https://github.com/dlmanning/gulp-sass]
			// // [https://gist.github.com/zwinnie/9ca2409d86f3b778ea0fe02326b7731b]
			// $.sass.sync().on("error", function(err) {
			// 	// $.sass.logError
			// 	// Note: For consistency, use the universal lint printer.

			// 	// Pretty print the issues.
			// 	lint_printer(
			// 		[[err.line, err.column, err.name, err.messageOriginal]],
			// 		err.relativePath
			// 	);

			// 	// [https://github.com/dlmanning/gulp-sass/blob/master/index.js]
			// 	// End gulp.
			// 	this.emit("end");
			// }),

			gulp.dest($paths.css_source),
			$.debug.edit({ loader: false, title: "SASS files processed..." }),
			__bs.stream()
		],
		function() {
			// Un-pause and re-start the watcher.
			$.watcher.start("watcher:css:app");

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
});

/**
 * Build app.css bundle (autoprefix, prettify, etc.).
 *
 * @internal - Ran via the "css" task.
 */
gulp.task("css:app", ["css:sass"], function(done) {
	// Pause the watcher to prevent infinite loops.
	$.watcher.pause("watcher:css:app");

	var unprefix = require("postcss-unprefix");
	var autoprefixer = require("autoprefixer");
	var perfectionist = require("perfectionist");
	var shorthand = require("postcss-merge-longhand");
	var csssorter = require("postcss-sorting");

	pump(
		[
			gulp.src(BUNDLE_CSS.source.files, {
				cwd: $paths.css_source
			}),
			$.debug(),
			$.concat(BUNDLE_CSS.source.names.main),
			$.postcss([
				unprefix(),
				shorthand(),
				autoprefixer(AUTOPREFIXER),
				perfectionist(PERFECTIONIST),
				csssorter(CSSSORTER)
			]),
			gulp.dest($paths.css_bundles),
			$.debug.edit(),
			__bs.stream()
		],
		function() {
			// Un-pause and re-start the watcher.
			$.watcher.start("watcher:css:app");

			done();
		}
	);
});

/**
 * Build vendor.css bundle (autoprefix, prettify, etc.).
 *
 * @internal - Ran via the "css" task.
 */
gulp.task("css:vendor", function(done) {
	// Pause the watcher to prevent infinite loops.
	$.watcher.pause("watcher:css:vendor");

	var unprefix = require("postcss-unprefix");
	var autoprefixer = require("autoprefixer");
	var perfectionist = require("perfectionist");
	var shorthand = require("postcss-merge-longhand");
	var csssorter = require("postcss-sorting");

	// Note: Absolute vendor library file paths should be used.
	// The paths should be supplied in ./configs/bundles.json
	// within the css.vendor.files array.

	pump(
		[
			gulp.src(BUNDLE_CSS.vendor.files),
			$.debug(),
			$.concat(BUNDLE_CSS.vendor.names.main),
			$.postcss([
				unprefix(),
				shorthand(),
				autoprefixer(AUTOPREFIXER),
				perfectionist(PERFECTIONIST),
				csssorter(CSSSORTER)
			]),
			gulp.dest($paths.css_bundles),
			$.debug.edit(),
			__bs.stream()
		],
		function() {
			// Un-pause and re-start the watcher.
			$.watcher.start("watcher:css:vendor");

			done();
		}
	);
});

/**
 * Build app.css and vendor.css.
 *
 * $ gulp css
 *     Build app/vendor bundle files.
 */
gulp.task("css", function(done) {
	// Runs the css:* tasks.
	return sequence("css:app", "css:vendor", function() {
		done();
	});
});
