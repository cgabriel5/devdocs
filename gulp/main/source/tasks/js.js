/**
 * Build app.js bundle (prettify, etc.).
 *
 * @internal - Ran via the "js" task.
 */
gulp.task("js:app", function(done) {
	// Pause the watcher to prevent infinite loops.
	$.watcher.pause("watcher:js:app");

	pump(
		[
			gulp.src(BUNDLE_JS.source.files, {
				cwd: $paths.js_source
			}),
			$.debug(),
			$.concat(BUNDLE_JS.source.names.main),
			$.prettier(PRETTIER),
			gulp.dest($paths.js_bundles),
			$.debug.edit(),
			__bs.stream()
		],
		function() {
			// Un-pause and re-start the watcher.
			$.watcher.start("watcher:js:app");

			done();
		}
	);
});

/**
 * Build vendor.js bundle (prettify, etc.).
 *
 * @internal - Ran via the "js" task.
 */
gulp.task("js:vendor", function(done) {
	// Pause the watcher to prevent infinite loops.
	$.watcher.pause("watcher:js:vendor");

	// Note: absolute vendor library file paths should be used.
	// The paths should be supplied in ./configs/bundles.json
	// within the js.vendor.files array.

	pump(
		[
			gulp.src(BUNDLE_JS.vendor.files),
			$.debug(),
			$.concat(BUNDLE_JS.vendor.names.main),
			$.prettier(PRETTIER),
			gulp.dest($paths.js_bundles),
			$.debug.edit(),
			__bs.stream()
		],
		function() {
			// Un-pause and re-start the watcher.
			$.watcher.start("watcher:js:vendor");

			done();
		}
	);
});

/**
 * Build app.js and vendor.js.
 *
 * $ gulp js
 *     Build app/vendor bundle files.
 */
gulp.task("js", function(done) {
	// Runs the js:* tasks.
	return sequence("js:app", "js:vendor", function() {
		done();
	});
});
