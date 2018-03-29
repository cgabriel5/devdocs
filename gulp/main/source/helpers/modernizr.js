/**
 * Build modernizr.js.
 *
 * $ gulp modernizr
 *     Build modernizr.js.
 */
gulp.task("modernizr", function(done) {
	var modernizr = require("modernizr");

	// Uses ./modernizr.json.
	modernizr.build($configs.modernizr, function(build) {
		// Build the modernizr description file path.
		var file_location =
			$paths.vendor_modernizr + $paths.modernizr_file_name;

		// Create any missing folders.
		mkdirp($paths.vendor_modernizr, function(err) {
			if (err) {
				throw err;
			}

			// Save the file to vendor.
			fs.writeFile(file_location, build + EOL_ENDING, function() {
				// The following is only needed to log the file.
				pump(
					[
						gulp.src(file_location, {
							cwd: $paths.basedir
						}),
						$.debug.edit()
					],
					done
				);
			});
		});
	});
});
