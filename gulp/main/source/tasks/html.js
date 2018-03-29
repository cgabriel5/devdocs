/**
 * Build ./index.html.
 *
 * $ gulp html
 *     Build ./index.html.
 */
gulp.task("html", function(done) {
	// Pause the watcher to prevent infinite loops.
	$.watcher.pause("watcher:html");

	pump(
		[
			gulp.src(BUNDLE_HTML.source.files, {
				cwd: $paths.html_source
			}),
			$.debug(),
			$.concat(BUNDLE_HTML.source.names.main),
			$.injection.pre({ replacements: html_injection }),
			$.beautify(JSBEAUTIFY),
			$.injection.post({ replacements: html_injection }),
			gulp.dest($paths.basedir),
			$.debug.edit(),
			__bs.stream()
		],
		function() {
			// Un-pause and re-start the watcher.
			$.watcher.start("watcher:html");

			done();
		}
	);
});
