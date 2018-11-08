"use-strict";

// Universal modules.
let mkdirp = require("mkdirp");
let get = require("object-path-get");

// Get the CLI parameters.
let argv = require("minimist")(process.argv.slice(2));
let configpath = argv.config || argv.c;
let outputpath = argv.output || argv.o;
let outputpath_filename = argv.name || argv.n;

// Load/modify configuration.
let config = require(configpath || $app.module("@main/get_config_path.js"));

// Honor the CLI outputpath parameter but if nothing is provided reset the
// value to the config given value. If nothing is found in the config file
// then default to the default devdocs folder.
if (!outputpath) {
	outputpath = get(config, "output.path", "devdocs/");
}
if (!outputpath_filename) {
	outputpath_filename = get(config, "output.filename", "data.json");
}

// Set the output path/file information.
config.outputpath = outputpath;
config.outputpath_filename = outputpath_filename;

// JSON data structure.
config.data = {
	versions: {
		first_file: "",
		latest: config.latest,
		skipped: [], // Skipped versions.
		processed: [], // Processed versions.
		dirs: [],
		files: {
			// Add the 404 error objects to internal files object.
			internal: Object.assign({}, $app.module("@main/templates/404.js")),
			user: {
				// Contain the HTML content and its respective original code blocks.
			},
			// Store the original code blocks' text.
			cbs: {}
		}
	},
	settings: {
		animations: config.animations,
		title: config.title
		// github: ""
	},
	components: {
		scrollbars: {
			// Add the MacOS scrollbar styles:
			macos: $app.module("@main/templates/scrollbars.js")
		},
		footer: null,
		logo: config.logo
	}
};

// Make the output folder structure.
mkdirp.sync(outputpath);

// Exports.

module.exports = config;
