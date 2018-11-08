"use strict";

// Node modules.
let path = require("path");
let fs = require("fs");

// Universal modules.
let chalk = require("chalk");
let de = require("directory-exists");
let del = require("del");

module.exports = function(refs) {
	// Get needed references.
	let outputpath = refs.outputpath;
	let initial = refs.initial;
	let config = refs.config;
	let debug = refs.debug;
	let print = refs.print;
	let timer = refs.timer;
	let gulp = refs.gulp;
	let cwd = refs.cwd;
	let done = refs.cb;

	// Create start time.
	let startt = timer();

	// Skip task logic if initial flag is not set.
	if (!initial) {
		return done();
	}

	// Get the devdocs path.
	var dd_path = path.join("./", outputpath);

	// All the path path globs.
	var pglobs = [
		// [https://github.com/gulpjs/gulp/issues/165#issuecomment-32611271]
		// [https://medium.com/@jack.yin/exclude-directory-pattern-in-gulp-with-glob-in-gulp-src-9cc981f32116]
		`${dd_path}**/**.*`,
		`!${dd_path}zdata/`,
		`!${dd_path}zdata/**`,
		`!${dd_path}zdata/**.*`,
		// `${dd_path}zdata/data-VERSION.json`,
		path.join("./index.html")
	];

	// Build the zdata path.
	var zdata_path = path.join(dd_path, "zdata/");

	// NOTE: Attach the created fake vinyl Gulp files to the Gulp
	// object to access it later in the clean:app task.
	gulp.cleanup_ffiles = [];
	gulp.cleanup_skip = false;

	// Only delete files if the zdata folder exists.
	if (!de.sync(zdata_path)) {
		if (debug) {
			print.gulp.warn(
				"Data folder,",
				chalk.magenta(zdata_path) + ",",
				"not found."
			);
		}

		// Set flag.
		gulp.cleanup_skip = true;

		return done();
	}

	// Remove all versions of data files where the version is not
	// in the versions array.
	var vfiles = fs
		.readdirSync(zdata_path)
		.filter(function(item) {
			// Remove all text but the version.
			var ver = item.replace(/^data-|.json$/g, "");

			// Check whether the version is in the versions array.
			return !config.data.versions.processed.includes(ver);
		})
		.map(function(item) {
			return `${dd_path}zdata/${item}`;
		});

	return del(pglobs.concat(vfiles), {
		/* dryRun: false */
	}).then(function(paths) {
		// Get the fake files array.
		var ffiles = gulp.cleanup_ffiles;

		// Modify the paths.
		paths = paths.map(function(item) {
			// Push the fake file vinyl object.
			ffiles.push({
				path: path.relative(cwd, item),
				contents: new Buffer("")
			});

			// Reset path to relative path.
			return path.relative(cwd, item);
		});

		//
		if (debug) {
			print.gulp.info(
				"Removed old devdocs files.",
				chalk.green(timer(startt))
			);
		}
	});
};
