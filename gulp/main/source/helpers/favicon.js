/**
 * Generate the favicon icons.
 *
 * Notes
 *
 * • This task takes a few seconds to complete. You should run it at
 *     least once to create the icons. Then, you should run it whenever
 *     RealFaviconGenerator updates its package
 *     (see the check-for-favicon-update task below).
 *
 * @internal - Used to prepare the favicon task.
 */
gulp.task("favicon:generate", function(done) {
	$.real_favicon.generateFavicon(
		Object.assign(REALFAVICONGEN, {
			// Add in the following paths to the settings object:
			masterPicture: $paths.favicon_master_pic,
			dest: $paths.favicon_dest,
			iconsPath: $paths.favicon_dest,
			markupFile: get_config_file($paths.config_$favicondata)
		}),
		function() {
			done();
		}
	);
});

/**
 * Copy needed favicon files to the root.
 *
 * @internal - Used to prepare the favicon task.
 */
gulp.task("favicon:root", function(done) {
	pump(
		[
			gulp.src([
				$paths.favicon_root_ico,
				$paths.favicon_root_png,
				$paths.favicon_root_config,
				$paths.favicon_root_manifest
			]),
			$.debug(),
			gulp.dest($paths.basedir),
			$.debug.edit(),
			__bs.stream()
		],
		done
	);
});

/**
 * Delete unneeded favicon files.
 *
 * @internal - Used to prepare the favicon task.
 */
gulp.task("favicon:delete", function(done) {
	pump(
		[
			gulp.src([
				$paths.favicon_root_config,
				$paths.favicon_root_manifest
			]),
			$.debug.clean(),
			$.clean()
		],
		done
	);
});

/**
 * Inject new favicon HTML.
 *
 * @internal - Used to prepare the favicon task.
 */
gulp.task("favicon:html", function(done) {
	pump(
		[
			gulp.src($paths.favicon_html),
			$.real_favicon.injectFaviconMarkups(
				JSON.parse(
					fs.readFileSync(get_config_file($paths.config_$favicondata))
				).favicon.html_code
			),
			gulp.dest($paths.favicon_html_dest),
			$.debug.edit(),
			__bs.stream()
		],
		done
	);
});

/**
 * Generate favicon files.
 *
 * -c, --check-updates [boolean]
 *     Check for RealFaviconGenerator updates.
 *
 * $ gulp favicon
 *     Re-build favicons.
 *
 * $ gulp favicon --check-updates
 *     Check for RealFaviconGenerator updates.
 */
gulp.task("favicon", function(done) {
	// Run yargs.
	var __flags = yargs.option("check-updates", {
		alias: "c",
		type: "boolean"
	}).argv;

	// Get flag values.
	var check_updates = __flags.c || __flags["check-updates"];

	// Only check for plugin updates when the flag is provided.
	if (check_updates) {
		// Note: Think: Apple has just released a new Touch icon along
		// with the latest version of iOS. Run this task from time to time.
		// Ideally, make it part of your continuous integration system.
		// Check for RealFaviconGenerator updates.

		// Get the favicon data file.
		var favicondata_file = JSON.parse(
			fs.readFileSync(get_config_file($paths.config_$favicondata))
		).version;

		$.real_favicon.checkForUpdates(favicondata_file, function(err) {
			if (err) {
				throw err;
			}

			return done();
		});
	} else {
		// Cache task.
		var task = this;

		// Get the gulp favicon tasks.
		var tasks = get($configs, "bundles.gulp.favicon.tasks", []);

		tasks.push(function() {
			// Finally, pretty files.
			cmd.get(`${GULPCLI} pretty -q`, function(err, data) {
				if (err) {
					throw err;
				}

				// Highlight data string.
				print(cli_highlight(data));

				// Finally, print success message.
				print.gulp.success("Favicons generated.");
				done();
			});
		});

		// Apply the tasks and callback to sequence and run the tasks.
		return sequence.apply(task, tasks);
	}
});
