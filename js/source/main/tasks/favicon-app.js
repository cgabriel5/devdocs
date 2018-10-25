"use strict";

// Node modules.
let path = require("path");

// Universal modules.
let pump = require("pump");

/**
 * Process any SASS files into their CSS equivalents.
 */
module.exports = function(refs) {
	// Get needed references.
	let debug_flist = refs.debug_flist;
	let outputpath = refs.outputpath;
	let globall = refs.globall;
	let initial = refs.initial;
	let apath = refs.apath;
	let debug = refs.debug;
	let print = refs.print;
	let gulp = refs.gulp;
	let done = refs.cb;
	let $ = refs.$;

	// Skip task logic if initial flag is not set.
	if (!initial) {
		if (debug) {
			print.gulp.warn("Skipped favicon transfer.");
		}

		return done();
	}

	return pump(
		[
			gulp.src(apath(globall("./favicon/"))),
			$.gulpif(
				debug_flist,
				$.debug({ loader: false, title: "copying favicon files..." })
			),
			gulp.dest(path.join(outputpath, "/favicon")),
			$.gulpif(
				debug_flist,
				$.debug.edit({
					loader: false,
					title: "copied favicon files..."
				})
			)
		],
		function() {
			if (debug) {
				print.gulp.info("Copied needed favicon files.");
			}
		}
	);
};
