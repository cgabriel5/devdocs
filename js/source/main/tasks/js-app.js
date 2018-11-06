"use strict";

// Node modules.
let path = require("path");
let fs = require("fs");

// Universal modules.
let pump = require("pump");
let chalk = require("chalk");

/**
 * Process any SASS files into their CSS equivalents.
 */
module.exports = function(refs) {
	// Get needed references.
	let outputpath_filename = refs.outputpath_filename;
	let debug_flist = refs.debug_flist;
	let outputpath = refs.outputpath;
	let initial = refs.initial;
	let debug = refs.debug;
	let jsonc = refs.jsonc;
	let print = refs.print;
	let timer = refs.timer;
	let gulp = refs.gulp;
	let cwd = refs.cwd;
	let done = refs.cb;
	let $ = refs.$;

	// Create start time.
	let startt = timer();

	// Skip task logic if initial flag is not set.
	if (!initial) {
		if (debug) {
			print.gulp.warn("Skipped JS bundling.");
		}

		return done();
	}

	// Get uglify configuration.
	let UGLIFYCONFIG = jsonc.parse(
		fs.readFileSync($app.rpath("./configs/uglify.cm.json")).toString(),
		null,
		true
	);

	return pump(
		[
			gulp.src([
				$app.rpath("./js/vendor/httpjs/http.js"),
				$app.rpath("./js/vendor/fastclick/fastclick.js"),
				$app.rpath("./js/vendor/uaparserjs/uaparser.js"),
				$app.rpath("./js/vendor/clipboardjs/clipboard.js"),
				// $app.rpath("./js/vendor/smoothscrolljs/smoothscroll.js"),
				// $app.rpath("./js/vendor/smoothscrolljs/zenscroll.js"),
				$app.rpath("./js/source/app.js")
			]),
			// Replace the default output path with the provided one.
			$.replace(
				/var\s*REQUEST_PATH\s+=\s*("|')(.*)\1;/i,
				`var REQUEST_PATH = $1${path
					.join(outputpath, "zdata", outputpath_filename)
					.replace(cwd + "/", "")}$1;`
			),
			$.gulpif(
				debug_flist,
				$.debug({ loader: false, title: "files for app.min.js..." })
			),
			$.concat("app.min.js"),
			$.uglify(UGLIFYCONFIG),
			gulp.dest(path.join(outputpath, "/js")),
			$.gulpif(
				debug_flist,
				$.debug.edit({ loader: false, title: "bundled app.min.js..." })
			)
		],
		function() {
			if (debug) {
				print.gulp.info("Bundled JS file.", chalk.green(timer(startt)));
			}
		}
	);
};