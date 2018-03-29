/**
 * Add or remove front-end dependencies.
 *
 * • Dependencies are grabbed from ./node_modules/<name> and moved
 *   to its corresponding ./<type>/vendor/ folder.
 * • name and type options are grouped. This means when one is used
 *   they must all be provided.
 *
 * Group 1:
 * -a, --add <string> OR -r, --remove <string>
 *     The module name to add/remove.
 * -t, --type <string>
 *     Dependency type ("js" or "css"). Needed when the --add or
 *     --remove flag is used.
 *
 * Group 2:
 * -l, --list <boolean>
 *     Print all CSS/JS dependencies.
 *
 * $ gulp dependency --add "fastclick" --type "js"
 *     Copy fastclick to JS vendor directory.
 *
 * $ gulp dependency --remove "fastclick" --type "js"
 *     Remove fastclick from JS vendor directory.
 *
 * $ gulp dependency --add "font-awesome" --type "css"
 *     Add font-awesome to CSS vendor directory.
 *
 * $ gulp dependency --list
 *     Show all CSS/JS dependencies.
 */
gulp.task("dependency", function(done) {
	var table = require("text-table");
	var strip_ansi = require("strip-ansi");

	// Run yargs.
	var __flags = yargs
		.option("add", {
			alias: "a",
			type: "string"
		})
		.option("remove", {
			alias: "r",
			type: "string"
		})
		.option("type", {
			alias: "t",
			choices: ["js", "css"],
			type: "string"
		})
		.option("list", {
			alias: "l",
			type: "boolean"
		})
		.implies("add", "type")
		.implies("remove", "type").argv;

	// Get flag values.
	var add = __flags.a || __flags.add;
	var remove = __flags.r || __flags.remove;
	var name = add || remove;
	var action = add ? "add" : remove ? "remove" : null;
	var type = __flags.t || __flags.type;
	var list = __flags.l || __flags.list;

	// Get needed paths.
	var dest = type === "js" ? $paths.js_vendor : $paths.css_vendor;
	var delete_path = dest + name;
	var module_path = $paths.node_modules + name;

	// Give an error message when a name is not provided.
	if (!list && !name) {
		print.gulp.error("Provide a name via the --add/--remove flag.");
		return done();
	}

	// Note: If the --list flag is provided it takes precedence over
	// other flags. Meaning it negates all the other flags provided.
	// Once the listing of vendor dependencies has completed the task
	// is terminated.
	if (list) {
		// Get the vendor dependencies.
		var css_dependencies = BUNDLE_CSS.vendor.files;
		var js_dependencies = BUNDLE_JS.vendor.files;

		print.ln();
		print(chalk.underline("Dependencies"));

		// Printer function.
		var printer = function(dependency, index) {
			// Get the name of the folder.
			var name = dependency.match(/^(css|js)\/vendor\/(.*)\/.*$/);
			// When folder name is not present leave the name empty.
			name = name ? `${name[2]}` : "";

			// Reset the array item, in this case the dependency string
			// path with an array containing the following information.
			// This is done to be able to pass is to text-table to print
			// everything neatly and aligned.
			return [
				`   `,
				` ${chalk.green(index + 1)} `,
				`${chalk.gray(name)}`,
				` => ${chalk.magenta(dependency)}`
			];
		};

		// Get the config path for the bundles file.
		var bundles_path = get_config_file($paths.config_$bundles);
		var header = `${bundles_path} > $.vendor.files<Array>`;

		// Print the dependencies.
		print(" ", header.replace("$", "css"));
		css_dependencies = css_dependencies.map(printer);
		print(
			table(css_dependencies, {
				// Remove ansi color to get the string length.
				stringLength: function(string) {
					return strip_ansi(string).length;
				},
				hsep: ""
				// Handle column separation manually to keep consistency
				// with gulp-debug output.
			})
		);

		print.ln();

		print(" ", header.replace("$", "js"));
		js_dependencies = js_dependencies.map(printer);
		print(
			table(js_dependencies, {
				// Remove ansi color to get the string length.
				stringLength: function(string) {
					return strip_ansi(string).length;
				},
				hsep: ""
				// Handle column separation manually to keep consistency
				// with gulp-debug output.
			})
		);

		print.ln();

		return done();
	}

	// Check that the module exists.
	if (action === "add" && !de.sync(module_path)) {
		print.gulp.warn(
			"The module",
			chalk.magenta(module_path),
			"does not exist."
		);
		print.gulp.info(
			`Install the dependency by running: $ yarn add ${name} --dev. Then try again.`
		);

		return done();
	} else if (action === "remove" && !de.sync(delete_path)) {
		print.gulp.warn(
			"The module",
			chalk.magenta(delete_path),
			"does not exist."
		);

		return done();
	}

	/**
	 * Print the final steps after the dependency has been added or removed.
	 *
	 * @param  {function} done - The Gulp callback.
	 * @return {undefined} - Nothing.
	 */
	function final_steps(done) {
		// Get the configuration file.
		var config_file = get_config_file($paths.config_$bundles);

		print.gulp.info(
			`1. Update ${chalk.magenta(
				config_file
			)} with the necessary vendor path changes.`
		);
		print.gulp.info(
			`2. To complete changes run: $ gulp settings && gulp ${type.toLowerCase()}.`
		);

		done();
	}

	// Delete the old module folder.
	del([delete_path]).then(function() {
		var message =
			`Dependency (${name}) ` +
			(action === "add" ? "added" : "removed" + ".");

		// Copy module to location.
		if (action === "add") {
			pump(
				[
					gulp.src(name + $paths.delimiter + $paths.files_all, {
						dot: true,
						cwd: $paths.node_modules,
						base: $paths.dot
					}),
					$.rename(function(path) {
						// Remove the node_modules/ parent folder.
						// [https://stackoverflow.com/a/36347297]
						var regexp = new RegExp("^" + $paths.node_modules_name);
						path.dirname = path.dirname.replace(regexp, "");
					}),
					gulp.dest(dest),
					$.debug.edit()
				],
				function() {
					print.gulp.success(message);

					// Print the final steps.
					final_steps(done);
				}
			);
		} else {
			// Removing completed just print the success message.
			print.gulp.success(message);

			// Print the final steps.
			final_steps(done);
		}
	});
});
