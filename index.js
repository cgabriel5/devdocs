#! /usr/bin/env node

/*jshint bitwise: false*/
/*jshint browser: false*/
/*jshint esversion: 6 */
/*jshint node: true*/
/*jshint -W014 */
/*jshint -W018 */
/*jshint maxerr: 10000 */
/*jshint elision: true*/

"use strict";

// NOTE: To simplify things, specifically imports, use NodeJS's global
// namespace to define a global object that contains references to path
// info/functions relative to the main JS file. This global will then be easily
// accessible across all project files. However, since polluting the global
// namespace is looked down upon, THIS TO BE THE ONLY GLOBAL VARIABLE USED.
var mpath = "./js/server";
require(`${mpath}/modules/module.js`)({
	"@root": __dirname,
	"@main": mpath,
	"@module": "@main/modules/",
	"@tasks": "@main/tasks/",
	"@templates": "@main/templates/",
	"@autils": "@main/utils/",
	"@gutils": "./gulp/assets/utils/"
});

// App variables.
let promises = [];
let cwd = process.cwd();

// Get the CLI parameters.
let argv = require("minimist")(process.argv.slice(2));
let highlighter = (argv.highlighter || argv.h || "p").toLowerCase();
var debug = argv.debug || argv.d;
var debug_flist = argv.debugfiles || argv.l || false;
var initial = argv.initial || argv.i || false;
var process_versions = (argv.process || argv.p || "") + "";
// Prepare the versions to process.
process_versions = process_versions
	? process_versions.split(",").map(item => item.trim())
	: null;

// App utils.
let autils = $app.module("@autils/utils.js");
let string_index_insert = autils.string_index_insert;
let slugify = autils.slugify;
let dehashify = autils.dehashify;
let remove_space = autils.remove_space;
let add_commas_to_num = autils.add_commas_to_num;
let id = autils.id;
let regexp_index = autils.regexp_index;
let timedate = autils.timedate;
let timer = autils.timer;

// Gulp utils.
let gutils = $app.module("@gutils/utils.js");
let print = gutils.print;
let notify = gutils.notify;
let gulp = gutils.gulp;
let format = gutils.format;
let globall = gutils.globall;

// Universal modules.
let chalk = require("chalk");
let findup = require("find-up");
let jsonc = require("comment-json");
let get = require("object-path-get");
let sequence = require("run-sequence");
let cheerio = require("cheerio");
let Entities = require("html-entities").XmlEntities;
let entities = new Entities();
let timeago = require("epoch-timeago").default;
let remove_html_comments = require("remove-html-comments");

// App variables.
// Store performance timestamp to later calculate docs render time.
let tstart = timer();

// Lazy load Gulp plugins.
let $ = require("gulp-load-plugins")({
	rename: {
		"gulp-if": "gulpif",
		"gulp-clean-css": "clean_css",
		"gulp-prettier-plugin": "prettier"
		// "gulp-real-favicon": "real_favicon",
		// "gulp-strip-json-comments": "strip_jsonc"
	},
	postRequireTransforms: {
		json_sort: function(plugin) {
			return plugin.default;
		},
		uglify: function() {
			// By default es-uglify is used to uglify JS.
			// [https://stackoverflow.com/a/45554108]
			let uglifyjs = require("uglify-es");
			let composer = require("gulp-uglify/composer");
			return composer(uglifyjs, console);
		}
	}
});

// Load/modify configuration.
let config = $app.module("@module/configuration.js");
let root = get(config, "root", "docs/");
let versions = get(config, "versions", []);
let modifier = config.modifier;
// let animations = config.animations;
let outputpath = config.outputpath;
let outputpath_filename = config.outputpath_filename;
// If debug flag was not supplied via the CL, look for it in the config file.
debug = typeof debug === "boolean" ? debug : get(config, "debug", false);
// If process_versions flag was not supplied via the CL, look for it in the config file.
process_versions = process_versions
	? process_versions
	: get(config, "process_versions", null);

// Custom modules.
let ctags = $app.module("@module/custom_tags.js");
let line_highlighter = $app.module("@module/line_highlighter.js");
let markdownit = $app.module("@module/markdown-it.js");
let highlight = markdownit.highlight;
let mdzero = markdownit.mdzero;
let markedjs = $app.module("@module/marked.js")({ outputpath });
let marked = markedjs.marked;
let renderer = markedjs.renderer;
// Generate site footer.
let footer = $app.module("@module/footer.js")(config);
let templates = $app.module("@templates/processor.js");
let transformer = $app.module("@module/transformer.js");
let preplacements = $app.module("@module/processor_replacements.js");
let ctransforms = $app.module("@module/cheerio_transforms.js");

// Pass var refs. to tasks instead of including everything over again.
var refs = {
	$,
	cwd,
	gulp,
	chalk,
	debug,
	jsonc,
	print,
	config,
	footer,
	format,
	notify,
	tstart,
	globall,
	initial,
	timeago,
	promises,
	sequence,
	outputpath,
	debug_flist,
	highlighter,
	remove_space,
	outputpath_filename,
	templates,
	transformer,
	preplacements,
	ctransforms,
	// Processing variables.
	id,
	root,
	ctags,
	timer,
	findup,
	marked,
	mdzero,
	cheerio,
	slugify,
	entities,
	modifier,
	renderer,
	timedate,
	versions,
	dehashify,
	highlight,
	regexp_index,
	line_highlighter,
	process_versions,
	add_commas_to_num,
	string_index_insert,
	remove_html_comments
};

// Process files to generate documentation.
$app.module("@module/processor.js")(refs);

// Create and run Gulp tasks.
$app.module("@module/tasks.js")(refs);
