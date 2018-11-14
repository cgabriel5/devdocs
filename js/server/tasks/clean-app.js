"use strict";

// Universal modules.
let vfsfake = require("vinyl-fs-fake");
let pump = require("pump");

module.exports = function(refs) {
	// Get needed references.
	let debug_flist = refs.debug_flist;
	let initial = refs.initial;
	let debug = refs.debug;
	let print = refs.print;
	let gulp = refs.gulp;
	let done = refs.cb;
	let $ = refs.$;

	// Skip task logic if initial flag is not set.
	if (!initial || gulp.cleanup_skip) {
		if (debug) {
			print.gulp.warn("Skipped cleanup task.");
		}

		return done();
	}

	// The following is only needed to log the files.
	return pump(
		[
			vfsfake.src(gulp.cleanup_ffiles),
			$.gulpif(
				debug_flist,
				$.debug.edit({ loader: false, title: "removed files..." })
			)
		],
		function() {}
	);
};
