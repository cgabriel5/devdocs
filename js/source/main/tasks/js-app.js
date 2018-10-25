"use strict";

// Node modules.
let path = require("path");
let fs = require("fs");

// Universal modules.
let pump = require("pump");

/**
 * Process any SASS files into their CSS equivalents.
 */
module.exports = function(refs) {
	// Get needed references.
	let outputpath_filename = refs.outputpath_filename;
	let debug_flist = refs.debug_flist;
	let outputpath = refs.outputpath;
	let initial = refs.initial;
	let apath = refs.apath;
	let debug = refs.debug;
	let jsonc = refs.jsonc;
	let print = refs.print;
	let gulp = refs.gulp;
	let cwd = refs.cwd;
	let done = refs.cb;
	let $ = refs.$;

	// Skip task logic if initial flag is not set.
	if (!initial) {
		if (debug) {
			print.gulp.warn("Skipped JS bundling.");
		}

		return done();
	}

	// Get uglify configuration.
	let UGLIFYCONFIG = jsonc.parse(
		fs.readFileSync(apath("./configs/uglify.cm.json")).toString(),
		null,
		true
	);

	return pump(
		[
			gulp.src([
				apath("./js/vendor/httpjs/http.js"),
				apath("./js/vendor/fastclick/fastclick.js"),
				apath("./js/vendor/uaparserjs/uaparser.js"),
				apath("./js/vendor/clipboardjs/clipboard.js"),
				// apath("./js/vendor/smoothscrolljs/smoothscroll.js"),
				// apath("./js/vendor/smoothscrolljs/zenscroll.js"),
				apath("./js/source/app.js")
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
				print.gulp.info("Bundled JS file.");
			}
		}
	);
};
