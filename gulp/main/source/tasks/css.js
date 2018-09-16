/**
 * Process any SASS files into their CSS equivalents.
 *
 * @internal - Ran via the "css" task.
 */
gulp.task("css:sass", function(done) {
	// Pause the watcher to prevent infinite loops.
	$.watcher.pause("watcher:css:app");

	pump(
		[
			gulp.src([$paths.files_all.replace(/\*$/, "scss")], {
				cwd: $paths.scss_source
			}),
			$.debug({ loader: false }),
			// [https://github.com/dlmanning/gulp-sass]
			// [https://gist.github.com/zwinnie/9ca2409d86f3b778ea0fe02326b7731b]
			$.sass.sync().on("error", function(err) {
				// $.sass.logError
				// Note: For consistency, use the universal lint printer.

				// Pretty print the issues.
				lint_printer(
					[[err.line, err.column, err.name, err.messageOriginal]],
					err.relativePath
				);

				// [https://github.com/dlmanning/gulp-sass/blob/master/index.js]
				// End gulp.
				this.emit("end");
			}),
			gulp.dest($paths.css_source),
			$.debug.edit({ loader: false }),
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
