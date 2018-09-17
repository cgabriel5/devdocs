/**
 * Lint a SCSS file.
 *
 * -F, --file <array>
 *     The SCSS file to lint.
 *
 * $ gulp lintcss --file ./css/source/scss/styles.scss
 *     Lint ./css/source/scss/styles.scss.
 *
 * Notes
 *
 * • This task requires Ruby and the Ruby gem 'scss_lint' to be installed. If
 *     running Ubuntu, simply run: '$ sudo apt-get install ruby-full --yes'
 *     followed by '$ sudo gem install scss_lint'. For other OS's please check
 *     for your specific OS installation.
 *     Linux install: [https://www.thoughtco.com/instal-ruby-on-linux-2908370]
 */
gulp.task("lintscss", function(done) {
	// Run yargs.
	var __flags = yargs.option("file", {
		alias: "F",
		type: "array"
	}).argv;

	// Get flag values.
	var file = __flags.F || __flags.file;

	// When no files are provided print an error.
	if (!file.length) {
		print.gulp.error("Provide a file to lint.");
		return done();
	}

	pump(
		[
			gulp.src(file, {
				cwd: $paths.basedir
			}),
			$.debug({ loader: false }),
			// $.scsslint(/* $configs.csslint */),
			$.scsslint({ customReport: function() {} }),
			// Note: Use the custom reporter printer function to be consistent
			// with the other linters.
			$.fn(function(file) {
				// Array will contain the standardized issues.
				var issues_std = [];

				// Only if there were issues found.
				if (!file.scsslint.success) {
					// Get the issues.
					var issues = file.scsslint.issues;

					// Loop over the issues to standardized.
					issues.forEach(function(issue) {
						// [https://github.com/juanfran/gulp-scss-lint#results]
						// Add the standardized issue to the array.
						issues_std.push([
							issue.line,
							issue.column,
							issue.severity,
							issue.reason
						]);
					});
				}

				// Pretty print the issues.
				lint_printer(issues_std, file.path);
			})
		],
		done
	);
});
