/**
 * Lint a SCSS file.
 *
 * -F, --file <array>
 *     The SCSS file to lint.
 *
 * $ gulp lintscss --file ./css/source/scss/styles.scss
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
	var sassLint = require("gulp-sass-lint");

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
			// [https://github.com/brigade/scss-lint#notice-consider-other-tools-before-adopting-scss-lint]
			// scss-lint warns to use sass-lint as the Ruby implementation
			// might no longer be maintained due to switching development
			// languages to Dart.
			sassLint(SASSLINT),
			// Comment out the following as a custom reporter is used.
			// sassLint.format(),
			// sassLint.failOnError(),
			// Note: Use the custom reporter printer function to be consistent
			// with the other linters.
			$.fn(function(file) {
				if (
					file.path.includes("github") ||
					file.path.includes("highlight") ||
					file.path.includes("prism")
				) {
				} else {
					// Get the attached linter object.
					var linter = file.sassLint;

					// Array will contain the standardized issues.
					var issues_std = [];

					// Only if there were issues found.
					if (linter && linter[0]) {
						// Get the actual linter object.
						linter = file.sassLint[0];

						// Get the issues.
						var issues = linter.messages;
						// var error_count = linter.errorCount;
						// var warning_count = linter.warningCount;

						// Loop over the issues to standardized.
						issues.forEach(function(issue) {
							// [https://github.com/juanfran/gulp-scss-lint#results]
							// Add the standardized issue to the array.
							var std_object = [
								issue.line,
								issue.column,
								issue.ruleId,
								issue.message
							];
							issues_std.push(std_object);

							// If an error, color the text red.
							if (issue.ruleId && issue.ruleId === "Fatal") {
								std_object.push("error");
							}
						});
					}

					// Pretty print the issues.
					lint_printer(issues_std, file.path);
				}
			})

			// // $.scsslint(/* $configs.csslint */),
			// $.scsslint({ customReport: function() {} }),
			// // Note: Use the custom reporter printer function to be consistent
			// // with the other linters.
			// $.fn(function(file) {
			// 	// Array will contain the standardized issues.
			// 	var issues_std = [];

			// 	// Only if there were issues found.
			// 	if (!file.scsslint.success) {
			// 		// Get the issues.
			// 		var issues = file.scsslint.issues;

			// 		// Loop over the issues to standardized.
			// 		issues.forEach(function(issue) {
			// 			// [https://github.com/juanfran/gulp-scss-lint#results]
			// 			// Add the standardized issue to the array.
			// 			issues_std.push([
			// 				issue.line,
			// 				issue.column,
			// 				issue.severity,
			// 				issue.reason
			// 			]);
			// 		});
			// 	}

			// 	// Pretty print the issues.
			// 	lint_printer(issues_std, file.path);
			// })
		],
		done
	);
});
