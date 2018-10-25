"use strict";

// Node modules.
let path = require("path");

// Universal modules.
let chalk = require("chalk");

// Gulp utils.
let gutils = require(path.resolve(__APPROOT, "./gulp/assets/utils/utils.js"));
let print = gutils.print;

/**
 * This function abstracts the linter printer logic. It prints the
 *     issues in a consistent manner between different HTML, CSS,
 *     and JS linters.
 *
 * @param  {array} issues - Array containing issues as object.
 * @param  {string} filepath - The path of the linted file.
 * @return {undefined} - Nothing.
 */
module.exports = function(issues, filepath) {
	var table = require("text-table");
	var strip_ansi = require("strip-ansi");

	// Get the file name.
	var filename = path.relative(__APPROOT, filepath);

	// Print the file name header.
	print.ln();
	print(chalk.underline(filename));

	// No issues found.
	if (!issues.length) {
		print.ln();
		print(`  ${chalk.yellow("⚠")}  0 issues`);
		print.ln();

		return;
	}

	// Else issues exist so print them.

	// Loop over issues to add custom reporter format/styling.
	issues = issues.map(function(issue) {
		// Replace the array item with the new styled/highlighted parts.
		return [
			"", // Empty space for spacing purposes.
			// Highlight parts.
			chalk.gray(`line ${issue[0]}`),
			chalk.gray(`char ${issue[1]}`),
			chalk.blue(`(${issue[2]})`),
			chalk.yellow(`${issue[3]}.`)
		];
	});

	// Print issues.
	print(
		table(issues, {
			// Remove ansi color to get the string length.
			stringLength: function(string) {
				return strip_ansi(string).length;
			}
		})
	);

	print.ln();

	// Make the issue plural if needed.
	var issue = "issue" + (issues.length > 1 ? "s" : "");

	// Print the issue count.
	print(`  ${chalk.yellow("⚠")}  ${issues.length} ${issue}`);
	print.ln();
};
