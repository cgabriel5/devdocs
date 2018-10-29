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
	let debug = refs.debug;
	let print = refs.print;
	let gulp = refs.gulp;
	let done = refs.cb;
	let $ = refs.$;

	return pump(
		[
			gulp.src($app.module(globall("./css/assets/fonts/"))),
			$.gulpif(debug_flist, $.debug({ loader: false })),
			gulp.dest(path.join(outputpath, "/fonts")),
			$.gulpif(debug_flist, $.debug.edit({ loader: false }))
		],
		function() {
			if (debug) {
				print.gulp.info("Copied needed font files.");
			}

			done();
		}
	);
};
