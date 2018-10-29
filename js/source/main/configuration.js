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

// Add an object to store the converted Markdown to HTML content.
config.files = {
	// Add the 404 error objects to internal files object.
	internal: Object.assign({}, $app.module("@main/templates/404.js")),
	user: {}
};
// Add an object to store HTML structures.
config.html = {};
// Add the MacOS scrollbar styles:
config.html.styles_macos_sb = $app.module("@main/templates/scrollbars.js");

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
// Store the versions.
config.pversions = []; // Processed versions.
config.sversions = []; // Skipped versions.
// All processed directory data will be contained in this array.
config.pdirs = [];
// Store the original code blocks' text.
config.cb_orig_text = {};

// Make the output folder structure.
mkdirp.sync(outputpath);

// Exports.

module.exports = config;
