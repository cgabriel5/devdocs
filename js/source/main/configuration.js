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

// Add GitHub information.
let github = Object.assign(
	// Default to empty values if not provided.
	{ account_username: "", project_name: "" },
	get(config, "github", {})
);
// Store GitHub information.
var github_data;
// If needed data points were provided add URLs to object.
let uname = github.account_username;
let pname = github.project_name;
if (uname && pname) {
	// Add the needed data.
	github_data = {
		account_username: uname,
		project_name: pname,
		project_url: `https://github.com/${uname}/${pname}/`,
		releases_url: `https://github.com/${uname}/${pname}/releases`,
		releases_api_url: `https://api.github.com/repos/${uname}/${pname}/releases`
	};
}

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
			// Contain the HTML content and its respective original code blocks.
			user: {},
			// Store the original code blocks' text.
			cbs: {}
		}
	},
	settings: {
		animations: config.animations,
		title: config.title,
		github: github_data
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
