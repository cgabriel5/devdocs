/**
 * Remove old lib/ folder.
 *
 * @internal - Used to prepare the lib task.
 */
gulp.task("lib:clean", function(done) {
	pump(
		[gulp.src($paths.lib_home, opts_remove), $.debug.clean(), $.clean()],
		done
	);
});

/**
 * Build the lib/ JS files and folders.
 *
 * @internal - Used to prepare the lib task.
 */
gulp.task("lib:js", function(done) {
	pump(
		[
			gulp.src(BUNDLE_JS.source.files, {
				nocase: true,
				cwd: $paths.js_source
			}),
			// Filter out all but test files (^test*/i).
			$.filter([$paths.files_all, $paths.not_tests]),
			$.debug(),
			$.concat(BUNDLE_JS.source.names.libs.main),
			$.prettier(PRETTIER),
			gulp.dest($paths.lib_home),
			$.debug.edit(),
			$.uglify(),
			$.rename(BUNDLE_JS.source.names.libs.min),
			gulp.dest($paths.lib_home),
			$.debug.edit()
		],
		done
	);
});

/**
 * Build the lib/ folder (library only).
 *
 * $ gulp lib
 *     Create lib/ folder.
 */
gulp.task("lib", function(done) {
	// Cache task.
	var task = this;

	// If the apptype is not a library then stop task.
	if (INT_APPTYPE !== "library") {
		print.gulp.warn(
			"This helper task is only available for library projects."
		);
		return done();
	}

	// Get the gulp build tasks.
	var tasks = BUNDLE_LIB.tasks;

	// Add callback to the sequence.
	tasks.push(function() {
		var message = "Library folder complete.";
		notify(message);
		print.gulp.success(message);
		done();
	});

	// Apply the tasks and callback to sequence and run the tasks.
	return sequence.apply(task, tasks);
});
