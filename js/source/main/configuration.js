"use-strict";

// Node modules.
var path = require("path");

// Universal modules.
let mkdirp = require("mkdirp");
let get = require("object-path-get");

// Get the CLI parameters.
let argv = require("minimist")(process.argv.slice(2));
var debug = argv.debug || argv.d;
let configpath = argv.config || argv.c;
let outputpath = argv.output || argv.o;
let outputpath_filename = argv.name || argv.n;

// Load/modify configuration.
let config = require(configpath ||
	require(path.resolve(__APPROOT, "./js/source/main/get_config_path.js")));

// Add an object to store the converted Markdown to HTML content.
config.files = {
	// Add the 404 error objects to internal files object.
	// internal: Object.assign({}, require(apath(cmp("templates/404.js")))),
	internal: Object.assign(
		{},
		require(path.resolve(__APPROOT, "./js/source/main/templates/404.js"))
	),
	user: {}
};
// Add an object to store HTML structures.
config.html = {};
// Add the MacOS scrollbar styles:
// config.html.styles_macos_sb = require(apath(cmp("templates/scrollbars.js")));
config.html.styles_macos_sb = require(path.resolve(
	__APPROOT,
	"./js/source/main/templates/scrollbars.js"
));

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

// console.log(config);

// Exports.

module.exports = config;
