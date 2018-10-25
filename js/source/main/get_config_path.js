"use-strict";

// Node modules.
var path = require("path");

// Universal modules.
let fe = require("file-exists");

// Vars.
let configpath;
let cwd = process.cwd();

// Configuration file lookup explanation steps:
// 1. Look for a config file in the cwd.
// 2. Look for a file in the cwd inside the sub folder configs/FILE or config/FILE.
// 3. If nothing is found throw an error.
// 4. Provide the path from the CLI (CLI path will trump looking for a config file).

// Look for a config in the current working directory.
let root_config = path.join(cwd, "devdocs.config.js");
if (fe.sync(root_config)) {
	// Reset the config path.
	configpath = root_config;
} else {
	// Look for a config file in a config folder.
	let subconfig_config = path.join(cwd, "/config", "devdocs.config.js");
	if (fe.sync(subconfig_config)) {
		// Reset the config path.
		configpath = subconfig_config;
	} else {
		// Try a final time and look for a sub folder /configs
		let subconfig_config = path.join(cwd, "/configs", "devdocs.config.js");
		if (fe.sync(subconfig_config)) {
			// Reset the config path.
			configpath = subconfig_config;
		} else {
			// If nothing is found return and give an error message.
			return print.gulp.error(
				"A config (devdocs.config.js) file was not found."
			);
		}
	}
}

// Export found configuration file path.
module.exports = configpath;
