"use strict";

// Universal modules.
let pump = require("pump");

/**
 * Process any SASS files into their CSS equivalents.
 */
module.exports = function(refs) {
	// Get needed references.
	let debug_flist = refs.debug_flist;
	let outputpath = refs.outputpath;
	let initial = refs.initial;
	let config = refs.config;
	let format = refs.format;
	let apath = refs.apath;
	let debug = refs.debug;
	let print = refs.print;
	let gulp = refs.gulp;
	let cwd = refs.cwd;
	let done = refs.cb;
	let $ = refs.$;

	// Modify the output path.
	let __path = outputpath.replace(/^[\.\/]+|\/$/g, "");

	// Replace paths in error templates.
	var files = ["", "_version", "_missing_docs"];
	for (let i = 0, l = files.length; i < l; i++) {
		// Cache current loop item.
		var file = `_404${files[i]}`;

		// Get internal files object.
		var ifiles = config.files.internal;
		// Format file contents.
		ifiles[file] = format(ifiles[file], {
			dir_path: __path
		});
	}

	// Skip task logic if initial flag is not set.
	if (!initial) {
		if (debug) {
			print.gulp.warn("Skipped HTML bundling.");
		}

		return done();
	}

	// Get htmlmin configuration.
	let HTMLMIN = require(apath("./configs/htmlmin.json"));

	return pump(
		[
			gulp.src(apath("./index-src.html")),
			// Set the path to the favicons...
			$.replace(/\$\{dir_path\}/g, __path),
			$.gulpif(
				debug_flist,
				$.debug({ loader: false, title: "files for index.html..." })
			),
			$.htmlmin(HTMLMIN),
			$.rename("index.html"),
			gulp.dest(cwd),
			$.gulpif(
				debug_flist,
				$.debug.edit({ loader: false, title: "bundles index.html..." })
			)
		],
		function() {
			if (debug) {
				print.gulp.info("Created index.html file.");
			}
		}
	);
};
