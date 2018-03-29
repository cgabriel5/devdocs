/**
 * Create or remove a module.
 *
 * --filename <string> OR --remove <string>
 *     The file name of the module to add/remove.
 *
 * --modname [string]
 *     The name of the module within the app. Defaults to the
 *     filename without the extension.
 *
 * --description [string]
 *     Optional description of the module.
 *
 * --mode [string]
 *     The mode the module should load via (interactive/complete).
 *
 * --same [boolean]
 *     Flag indicating whether to use the same filename for the
 *     modname.
 *
 * $ gulp module --filename "my_module" --same --mode "complete"
 *     Make a module "new_module.js". The extension will be added if not
 *     provided. The same file name will be used for the modname. It will
 *     also load when the document readyState hits "complete".
 *
 * $ gulp module --filename "test" --same --description "My cool module."
 *     Make a module "test.js" with a description of "My cool module.".
 *
 * $ gulp module --filename "my_cool_module"
 *     Simplest way to make a module. This will make a module with the name
 *     "my_cool_module.js", have the name of "my_cool_module", load on
 *     "complete", and have an empty description.
 *
 * $ gulp module --filename "my_cool_module" --modname "coolModule"
 *     This will make a module with the name "my_cool_module.js", have the
 *     name of "coolModule", load on "complete", and have an empty
 *     description.
 *
 * $ gulp module --remove "my_cool_module.js"
 *     This will remove the module "my_cool_module.js".
 */
gulp.task("module", function(done) {
	var linenumber = require("linenumber");

	// Variables.
	var __flags;
	var file;
	var ext;

	// Run yargs.
	__flags = yargs.option("remove", {
		type: "string"
	}).argv;

	// Get flag values.
	var remove = __flags.remove;

	// Get the configuration file.
	var config_file = get_config_file($paths.config_$bundles);

	// Remove the module when the remove flag is provided.
	if (remove) {
		// Check for a file extension.
		ext = extension({ path: remove });

		// If no extension make sure to add the extension.
		if (!ext) {
			remove += ".js";
		}

		// Path to the config file.
		file = path.join($paths.js_source_modules, remove);

		// Before anything is done make sure to check that the name
		// is not already taken by another file. We don't want to
		// overwrite an existing file.
		if (!fe.sync(file)) {
			print.gulp.warn(
				"The module",
				chalk.magenta(remove),
				"does not exist."
			);
			return done();
		}

		pump(
			[gulp.src(file, opts_remove), $.debug.clean(), $.clean()],
			function() {
				// Get the line number where the configuration array exists.
				// Looking for the js.source.files array.
				var line = (linenumber(
					config_file,
					/\s"js":\s+\{\n\s+"source":\s+\{\n\s+"files":\s+\[/gim
				) || [{ line: 0 }])[0].line;

				cmd.get(
					`${GULPCLI} open -e ${config_file} --line ${line} --wait`,
					function(err) {
						if (err) {
							throw err;
						}

						// Update the js:app bundle.
						return sequence("js:app", function() {
							done();
						});
					}
				);
			}
		);
	} else {
		// Run yargs.
		__flags = yargs
			.option("filename", {
				type: "string",
				demandOption: true
			})
			.option("modname", {
				type: "string"
			})
			.option("description", {
				default: "",
				type: "string"
			})
			.option("mode", {
				choices: ["interactive", "complete"],
				default: "complete",
				type: "string",
				demandOption: true
			})
			.option("same", {
				type: "boolean"
			}).argv;

		// Get the command line arguments from yargs.
		var filename = __flags.filename;
		var modname = __flags.modname;
		var description = __flags.description;
		var mode = __flags.mode;
		var same = __flags.same;

		// Get the basename from the filename.
		ext = path.extname(filename);

		// When no extension is found reset it and the file name.
		if (!ext) {
			ext = ".js";
			filename = filename + ext;
		}

		// If the same flag is provided this means to use the same filename
		// for the name flag as well. Also, if no name is provided use the
		// filename without the extension as the name.
		if (same || !modname) {
			// Get the filename without the extension.
			modname = path.basename(filename, ext);
		}

		// The content template string for a module.
		var content = `app.module(
	"${modname}",
	function(modules, name) {
		// App logic...
	},
	"${mode}",
	"${description}"
);`;

		// Path to the config file.
		file = path.join($paths.js_source_modules, filename);

		// Before anything is done make sure to check that the name
		// is not already taken by another file. We don't want to
		// overwrite an existing file.
		if (fe.sync(file)) {
			print.gulp.warn("The module", chalk.magenta(modname), "exists.");
			print.gulp.info("Use another file name.");
			return done();
		}

		pump(
			[
				// Create the file via gulp-file and use is at the Gulp.src.
				$.file(file, content, {
					src: true
				}),
				$.debug.edit(),
				gulp.dest($paths.basedir)
			],
			function() {
				// Get the line number where the config array exists.
				// Looking for the js.source.files array.
				var line = (linenumber(
					config_file,
					/\s"js":\s+\{\n\s+"source":\s+\{\n\s+"files":\s+\[/gim
				) || [{ line: 0 }])[0].line;

				cmd.get(
					`${GULPCLI} open -e ${config_file} --line ${line} --wait`,
					function(err) {
						if (err) {
							throw err;
						}

						// Update the js:app bundle.
						return sequence("js:app", function() {
							done();
						});
					}
				);
			}
		);
	}
});
