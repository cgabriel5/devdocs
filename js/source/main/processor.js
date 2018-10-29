"use strict";

// Node modules.
let path = require("path");

module.exports = function(refs) {
	// Get needed refs.
	let dirs = refs.dirs;
	let root = refs.root;
	let chalk = refs.chalk;
	let debug = refs.debug;
	let print = refs.print;
	let config = refs.config;
	let findup = refs.findup;
	let format = refs.format;
	let modifier = refs.modifier;
	let promises = refs.promises;
	let versions = refs.versions;
	let templates = refs.templates;
	let transformer = refs.transformer;
	let process_versions = refs.process_versions;
	let cb_orig_text = refs.cb_orig_text;

	// Loop over version objects to generate the HTML files from Markdown.
	versions.forEach(function(vdata) {
		// Get version and directories.
		let version = Object.keys(vdata)[0];
		let directories = vdata[version];

		// When the process_versions flag is provided only generate docs for
		// the versions contained within the flag. Otherwise, skip it and
		// print a warning for debugging purposes.
		if (debug) {
			if (process_versions && !process_versions.includes(version)) {
				print.gulp.warn(
					chalk(
						`SKIPPING → ${chalk.magenta(
							version
						)}. (via 'process_versions' option)`
					)
				);
				// Store skipped version.
				config.sversions.push(version);
				return;
			} else {
				// Show currently processing version.
				print.gulp.info(
					chalk(`PROCESSING → ${chalk.magenta(version)}`)
				);
			}
		}

		// Store the version.
		config.pversions.push(version);

		var gdir = [];
		gdir.version = version;
		dirs.push(gdir);

		directories.forEach(function(directory, index) {
			// Create an object to store all directory information.
			let __dir = {};
			// Add object to the config object.
			gdir.push(__dir);

			// Get the directory name
			let dirname = Object.keys(directory)[0];

			// Apply the modifier to the file name if provided.
			let alias_dir = dirname;
			if (modifier) {
				alias_dir = modifier(
					path.basename(dirname),
					dirname,
					"directory"
				);
			}

			// Setup a counter to use as the id for the files.
			let counter_dir = index + 1;

			// Store the directory information.
			__dir.name = dirname;
			__dir.alias = alias_dir;
			__dir.odata = directory; // Original data.
			__dir.html = `<li class="l-1" id="menu-dir-${counter_dir}">${alias_dir}</li>`;
			// All processed files' information will be contained here.
			__dir.files = [];
			__dir.first_file = false;
			__dir.version = version;
			__dir.contents = {};

			// Loop over every file in the directory.
			directory[dirname].forEach(function(file, index) {
				// Setup a counter to use as the id for the files.
				let counter_file = index + 1;

				// Create an object to store all file information.
				let __file = {};
				// Add object to its respective parent directory object.
				__dir.files.push(__file);

				// Remove the .md from the file name if provided.
				file = file.replace(/\.md$/i, "");

				// Apply the modifier to the file name if provided.
				let alias_file = path.basename(file);
				if (modifier) {
					alias_file = modifier(alias_file, file, "file");
				}

				// Build the file path.
				let fpath = `${dirname}/${file}`;

				// Store file path in object.
				if (!cb_orig_text[fpath]) {
					// If the file path does not exist, add it. Object will
					// contain all original code block text.
					cb_orig_text[fpath] = {};
				}

				// Store the file information.
				__file.dirname = fpath;
				__file.name = file;
				__file.alias = alias_file;
				__file.html = format(templates.sb_menu_item, {
					d1: `${counter_dir}.${counter_file}`,
					d2: counter_dir,
					d3: alias_file,
					d4: fpath
				});

				// All processed file headings will be contained here.
				__file.headings = [];

				// Build the file path.
				let __path = path.join("./", root, `${dirname}/`, `${file}.md`);
				// Get the absolute path for the file.
				__path = findup.sync(__path);

				// If the file was not found give a warning and skip it.
				if (!__path) {
					if (debug) {
						print.gulp.warn(
							"Skipped",
							chalk.magenta(`${fpath}`),
							"(file not found)"
						);
					}
					// Remove the item from the __dir.files array.
					__dir.files.pop();
					return;
				}

				// Store the first file.
				if (!__dir.first_file) {
					__dir.first_file = `${fpath}`;
				}

				// Placehold the eventual file before parsed/modified/worked on contents. Once the
				// promise is resolved the -1 will be replaced with the actual worked on file contents.
				// This is done do maintain the file's array order. As promises end once they are
				// resolved, smaller files end quicker. This sometimes causes for the files to be added
				// in the wrong order.
				__dir.contents[`${fpath}`] = -1;

				// Create a Promise for each file. Store to invoke later.
				promises.push(
					new Promise(
						transformer(
							Object.assign(refs, {
								fpath,
								__dir,
								__file,
								__path,
								version,
								templates,
								counter_dir,
								counter_file
							})
						)
					)
				);
			});
		});
	});
};
