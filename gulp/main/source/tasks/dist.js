/**
 * Remove old dist/ folder.
 *
 * @internal - Used to prepare the dist task.
 */
gulp.task("dist:clean", function(done) {
	pump(
		[gulp.src($paths.dist_home, opts_remove), $.debug.clean(), $.clean()],
		done
	);
});

/**
 * Copy needed favicon file and folders.
 *
 * @internal - Used to prepare the dist task.
 */
gulp.task("dist:favicon", function(done) {
	pump(
		[
			gulp.src(BUNDLE_DIST.source.files.favicon, {
				dot: true,
				cwd: $paths.basedir,
				// To keep the sub-folders define the base in the options.
				// [https://github.com/gulpjs/gulp/issues/151#issuecomment-41508551]
				base: $paths.dot
			}),
			$.debug(),
			gulp.dest($paths.dist_home),
			$.debug.edit()
		],
		done
	);
});

/**
 * Build the dist/ CSS files and folders.
 *
 * @internal - Used to prepare the dist task.
 */
gulp.task("dist:css", function(done) {
	pump(
		[
			gulp.src(BUNDLE_DIST.source.files.css, {
				dot: true,
				cwd: $paths.basedir,
				base: $paths.dot
			}),
			$.debug(),
			$.gulpif(extension.iscss, $.clean_css()),
			gulp.dest($paths.dist_home),
			$.debug.edit()
		],
		done
	);
});

/**
 * Optimize images via imagemin.
 *
 * @internal - Used to prepare the dist task.
 */
gulp.task("dist:img", function(done) {
	// Copy hidden files/folders?
	// [https://github.com/klaascuvelier/gulp-copy/issues/5]

	pump(
		[
			gulp.src(BUNDLE_DIST.source.files.img, {
				dot: true,
				cwd: $paths.basedir,
				base: $paths.dot
			}),
			$.cache(
				$.imagemin([
					$.imagemin.gifsicle({
						interlaced: true
					}),
					$.imagemin.jpegtran({
						progressive: true
					}),
					$.imagemin.optipng({
						optimizationLevel: 5
					}),
					$.imagemin.svgo({
						plugins: [
							{
								removeViewBox: true
							}
						]
					})
				])
			),
			gulp.dest($paths.dist_home),
			$.debug.edit()
		],
		done
	);
});

/**
 * Build the dist/ JS files and folders.
 *
 * @internal - Used to prepare the dist task.
 */
gulp.task("dist:js", function(done) {
	pump(
		[
			gulp.src(BUNDLE_DIST.source.files.js, {
				dot: true,
				cwd: $paths.basedir,
				base: $paths.dot
			}),
			$.debug(),
			$.gulpif(extension.isjs, $.uglify()),
			gulp.dest($paths.dist_home),
			$.debug.edit()
		],
		done
	);
});

/**
 * Copy root files to the dist/ folder.
 *
 * @internal - Used to prepare the dist task.
 */
gulp.task("dist:root", function(done) {
	pump(
		[
			gulp.src(BUNDLE_DIST.source.files.root, {
				dot: true,
				cwd: $paths.basedir,
				base: $paths.dot
			}),
			$.debug(),
			$.gulpif(extension.ishtml, $.htmlmin(HTMLMIN)),
			gulp.dest($paths.dist_home),
			$.debug.edit()
		],
		done
	);
});

/**
 * Build the dist/ folder (webapp only).
 *
 * $ gulp dist
 *     Create dist/ folder.
 */
gulp.task("dist", function(done) {
	// Cache task.
	var task = this;

	// If the apptype is not a webapp then stop task.
	if (INT_APPTYPE !== "webapp") {
		print.gulp.warn(
			"This helper task is only available for webapp projects."
		);
		return done();
	}

	// Get the gulp build tasks.
	var tasks = BUNDLE_DIST.tasks;

	// Add callback to the sequence.
	tasks.push(function() {
		var message = "Distribution folder complete.";
		notify(message);
		print.gulp.success(message);
		done();
	});

	// Apply the tasks and callback to sequence and run the tasks.
	return sequence.apply(task, tasks);
});
