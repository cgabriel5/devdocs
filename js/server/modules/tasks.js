"use strict";

module.exports = function(refs) {
	// Get needed refs.
	var gulp = refs.gulp;
	let chalk = refs.chalk;
	let debug = refs.debug;
	let print = refs.print;
	let timer = refs.timer;
	let notify = refs.notify;
	let tstart = refs.tstart;
	let promises = refs.promises;
	let sequence = refs.sequence;

	// Task names.
	var tasks = [
		// Create first run file. Sub-sequent runs skip tasks for faster performance.
		// If files are needed to be re-created/copied/transfered, the initial flag
		// can be explicitly provided via the CLI.
		"first-file-app",
		// Remove files upon every build.
		"clean-del-app",
		// Remove files upon every build.
		["clean-app", "clean-del-app"],
		// Remove files upon every build.
		"css-sass",
		// Create the CSS bundle.
		["css-app", "css-sass"],
		// Create the JS bundle.
		"js-app",
		// Create the index.html file.
		"html-app",
		// Copy the needed images.
		"img-app",
		// Copy the app favicons.
		"favicon-app",
		// // Copy the needed font files.
		// "fonts-app"
		// Save the configuration data in its own file to access it in the front-end.
		"json-data-app"
	];

	// The Gulp task callback.
	var gcb = function(done) {
		return function(done) {
			// Get and run the task.
			return $app
				.module(`@tasks/${this.__wapplr.debug.name}.js`)
				.call(this, Object.assign(refs, { cb: done }));
		};
	};

	// Generate Gulp tasks.
	for (let i = 0, l = tasks.length; i < l; i++) {
		// Cache current loop item.
		var task = tasks[i];

		// Create callback instance.
		var cb = gcb();

		// If task is a string then it's a single task, else it has a pre-task.
		if (typeof task === "string") {
			gulp.task(task, cb);
		} else {
			gulp.task(task[0], [task[1]], cb);
		}
	}

	// Run all the promises.
	Promise.all(promises)
		.then(
			function(/*values*/) {
				if (debug) {
					print.gulp.info("All promises completed.");
				}

				// Run the tasks.
				sequence.apply(null, [
					"first-file-app",
					"clean-app",
					"css-app",
					"js-app",
					"html-app",
					"img-app",
					"favicon-app",
					// "fonts-app",
					"json-data-app",
					function() {
						if (debug) {
							print.gulp.success(
								"Documentation generated.",
								chalk.green(timer(tstart))
							);
						}

						notify(
							"Documentation generated.",
							"devdocs",
							$app.rpath("./img/leaf-216.png")
						);
					}
				]);
			},
			function(err) {
				print.gulp.error("Failed to generate documentation.");
				print(err);
			}
		)
		.catch(function(err) {
			if (typeof err[0] === "string") {
				print.gulp.error(err[0]);
				print(err[1]);
			} else {
				print(err);
			}
		});
};
