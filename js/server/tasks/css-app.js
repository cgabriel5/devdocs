"use strict";

// Node modules.
let path = require("path");

// Universal modules.
let chalk = require("chalk");
let pump = require("pump");

/**
 * Process any SASS files into their CSS equivalents.
 */
module.exports = function(refs) {
	// Get needed references.
	let debug_flist = refs.debug_flist;
	let highlighter = refs.highlighter;
	let outputpath = refs.outputpath;
	let initial = refs.initial;
	let debug = refs.debug;
	let print = refs.print;
	let timer = refs.timer;
	let gulp = refs.gulp;
	let done = refs.cb;
	let $ = refs.$;

	// Create start time.
	let startt = timer();

	// Skip task logic if initial flag is not set.
	if (!initial) {
		if (debug) {
			print.gulp.warn("Skipped CSS bundling.");
		}

		return done();
	}

	let unprefix = require("postcss-unprefix");
	let autoprefixer = require("autoprefixer");
	let perfectionist = require("perfectionist");
	let shorthand = require("postcss-merge-longhand");
	// let csssorter = require("postcss-sorting");

	// The CSS file source path.
	var css_path_source = "css/source/css/";
	var css_path_source_libs = `${css_path_source}libs/`;

	// The default CSS style sheets.
	let css_source_files = [
		"css/vendor/sanitize.css/sanitize.css",
		`${css_path_source_libs}github-markdown.css`
		// "css/vendor/font-awesome/font-awesome.css"
	];

	// Add needed syntax highlight CSS file depending on what was provided
	// via the CLI.

	// Get the first char of the passed in highlighter name.
	let highlighter_fchar = highlighter.charAt(0);

	// If a highlighter name was passed determine whether it is prismjs or
	// highlighterjs.
	if (highlighter_fchar !== "n") {
		// Default to prismjs.
		css_source_files.push(
			`${css_path_source_libs}${
				highlighter_fchar === "h" ? "highlightjs" : "prism-github"
			}.css`
		);
	}

	// Add the app styles.
	css_source_files.push(`${css_path_source}styles.css`);
	// // Add CSS animations if wanted.
	// if (animations) {
	// 	css_source_files.push(`${css_path_source}animations.css`);
	// }

	// Make the paths absolute to the devdocs module. Not the user's dir.
	css_source_files = css_source_files.map(path => $app.rpath(path));

	// Get the postcss plugins' configurations.
	let AUTOPREFIXER = $app.module("./configs/autoprefixer.json");
	let PERFECTIONIST = $app.module("./configs/perfectionist.json");

	return pump(
		[
			gulp.src(css_source_files),
			$.gulpif(
				debug_flist,
				$.debug({ loader: false, title: "files for bundle.min.css..." })
			),
			$.concat("bundle.min.css"),
			// Replace the default output path with the provided one.
			$.replace(
				/\.\.\/assets\//g,
				// `${path.join(outputpath).replace(cwd + "/", "")}`
				"../"
			),
			$.postcss([
				unprefix(),
				shorthand(),
				autoprefixer(AUTOPREFIXER),
				perfectionist(PERFECTIONIST)
			]),
			// CSS style must be prefixed for it to work at the moment.
			$.replace(/overflow\-scrolling/g, "-webkit-overflow-scrolling"),
			$.replace(/font\-smoothing/g, "-webkit-font-smoothing"),
			$.clean_css(),
			gulp.dest(path.join(outputpath, "/css")),
			$.gulpif(
				debug_flist,
				$.debug.edit({
					loader: false,
					title: "bundled bundle.min.css..."
				})
			)
		],
		function() {
			if (debug) {
				print.gulp.info(
					"Bundled CSS file.",
					chalk.green(timer(startt))
				);
			}
		}
	);
};
