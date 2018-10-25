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

// NOTE: To keep things simple, use NodeJS's global namespace to define
// a global variable that references the app's root path. This global will
// then be easily useable across all project files. However, polluting the
// global namesapce is viewed down upon, therefore, this to be the only
// global variable used. [https://stackoverflow.com/a/18721515]
global.__APPROOT = __dirname;

// App variables.
let promises = [];
let cwd = process.cwd();
// Custom module path builder.
let cmp = p => `./js/source/main/${p}`;

// Get the CLI parameters.
let argv = require("minimist")(process.argv.slice(2));
let highlighter = (argv.highlighter || argv.h || "p").toLowerCase();
var debug = argv.debug || argv.d;
var debug_flist = argv.debugfiles || argv.l || false;
var initial = argv.initial || argv.i || false;
var filter = argv.filter || argv.f;
// Prepare the version filter.
filter = filter
	? filter.split(",").map(function(item) {
			return item.trim();
		})
	: null;

// Node modules.
let fs = require("fs");
let path = require("path");

// App utils.
let autils = require(path.resolve(__dirname, cmp("utils/utils.js")));
let string_index_insert = autils.string_index_insert;
let slugify = autils.slugify;
let dehashify = autils.dehashify;
let range = autils.range;
let make_unique = autils.make_unique;
let remove_space = autils.remove_space;
let add_commas_to_num = autils.add_commas_to_num;
let apath = autils.apath;
let id = autils.id;
let regexp_index = autils.regexp_index;
let timedate = autils.timedate;

// Gulp utils.
let gutils = require(apath("./gulp/assets/utils/utils.js"));
let print = gutils.print;
let notify = gutils.notify;
let gulp = gutils.gulp;
let format = gutils.format;
let globall = gutils.globall;

// Universal modules.
let del = require("del");
let pump = require("pump");
let chalk = require("chalk");
// let mkdirp = require("mkdirp");
let fe = require("file-exists");
let findup = require("find-up");
let jsonc = require("comment-json");
let now = require("performance-now");
let get = require("object-path-get");
let sequence = require("run-sequence");
let vfsfake = require("vinyl-fs-fake");
let cheerio = require("cheerio");
let Entities = require("html-entities").XmlEntities;
let entities = new Entities();
let emoji = require("node-emoji");
let eunicode = require("emoji-unicode");
let twemoji = require("twemoji");
let timeago = require("epoch-timeago").default;
let removeHtmlComments = require("remove-html-comments");

// App variables.
// Store performance timestamp to later calculate docs render time.
let tstart = now();

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
let config = require(apath(cmp("configuration.js")));
let root = get(config, "root", "docs/");
let versions = get(config, "versions", []);
let logo = config.logo;
let modifier = config.modifier;
// let animations = config.animations;
let outputpath = config.outputpath;
let outputpath_filename = config.outputpath_filename;
let cb_orig_text = config.cb_orig_text;
let dirs = config.pdirs;
// If debug flag was not supplied via the CL, look for it in the config file.
debug = typeof debug === "boolean" ? debug : get(config, "debug", false);

// Custom modules.
let ctags = require(apath(cmp("custom_tags.js")));
let line_highlighter = require(apath(cmp("line_highlighter.js")));
let markdownit = require(apath(cmp("markdown-it.js")));
let highlight = markdownit.highlight;
let mdzero = markdownit.mdzero;
let markedjs = require(apath(cmp("marked.js")))({ outputpath });
let marked = markedjs.marked;
let renderer = markedjs.renderer;
// Generate site footer.
let footer = require(apath(cmp("footer.js")))(config);

// Pass var refs. to tasks instead of including everything over again.
var refs = {
	$,
	cmp,
	cwd,
	now,
	dirs,
	gulp,
	apath,
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
	// Processing variables.
	id,
	root,
	ctags,
	filter,
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
	cb_orig_text,
	regexp_index,
	line_highlighter,
	add_commas_to_num,
	removeHtmlComments,
	string_index_insert
};

// Process files to generate documentation.
require(apath(cmp("processor.js")))(refs);

// Create and run Gulp tasks.
require(apath(cmp("tasks.js")))(refs);
