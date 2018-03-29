/**
 * Handle project image operations.
 *
 * • By default the task does not do much as no image files exist.
 *     Update the task as needed.
 *
 */
gulp.task("img", function(done) {
	// Pause the watcher to prevent infinite loops.
	$.watcher.pause("watcher:img");

	// Copy hidden files/folders?
	// [https://github.com/klaascuvelier/gulp-copy/issues/5]

	pump([gulp.src($paths.img_source), $.debug(), __bs.stream()], function() {
		// Un-pause and re-start the watcher.
		$.watcher.start("watcher:img");

		done();
	});
});
