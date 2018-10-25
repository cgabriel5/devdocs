"use strict";

// Node modules.
let path = require("path");
let fs = require("fs");

// Universal modules.
let chalk = require("chalk");
let fe = require("file-exists");

module.exports = function(refs) {
	// Get needed references.
	let outputpath = refs.outputpath;
	let timeago = refs.timeago;
	let debug = refs.debug;
	let print = refs.print;
	let done = refs.cb;

	// Reset output path.
	outputpath = path.join(outputpath, "._rants.text");

	// Check whether the file exists.
	var file_exists = fe.sync(outputpath);

	// If the file does not exist, create it.
	if (!file_exists) {
		// Reset initial flag to create/copy/transfer needed files for first run.
		refs.initial = true;
	}

	// Get the time stamp.
	var ts = Date.now();

	if (debug) {
		print.gulp.info(
			"devdocs last run",
			chalk.magenta(
				timeago(
					file_exists
						? fs.readFileSync(outputpath, "utf8") * 1
						: ts * 1000
				)
			) + ".",
			file_exists ? "" : "(first run)"
		);
	}

	// Create the file and store the time-stamp.
	fs.writeFile(outputpath, ts.toString(), function(err) {
		if (err) {
			print.gulp.error(`${outputpath} could not be made.`);

			return done();
		}

		if (debug) {
			print.gulp.info(
				file_exists ? "Updated" : "Saved",
				chalk.magenta(outputpath),
				"(first-time file)"
			);
		}

		return done();
	});
};
