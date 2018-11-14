"use strict";

// Node modules.
let path = require("path");

module.exports = function(aliases) {
	// [https://stackoverflow.com/a/18721515]
	// [https://gist.github.com/branneman/8048520]
	// [https://github.com/ilearnio/module-alias]
	// [https://nodejs.org/api/modules.html#modules_require_resolve_request_options]

	// Get the root path.
	let root_path = aliases["@root"];

	let globals = {
		root: root_path,
		resolve: path.resolve,
		aliases: aliases,
		/**
		 * Global path resolver with prefix.
		 *
		 * @param  {string} argN - N amount of arguments to pass to path.resolve.
		 * @return {string} - The resolved file path.
		 */
		rpath: function() {
			let args = [root_path];
			let ref = this;

			// Placeholder regexp and replacement function.
			let r = /\@[a-z0-9-_]*/gi;
			let rfn = function(match) {
				return ref.aliases[match];
			};

			// Replace all path aliases in arguments.
			for (let i = 0, l = arguments.length; i < l; i++) {
				// Cache current loop item.
				let arg = arguments[i];

				// Reset regexp index to reuse it.
				// [https://siderite.blogspot.com/2011/11/careful-when-reusing-javascript-regexp.html#at3060321440]
				r.lastIndex = 0;

				// Replace all aliases in the arguments.
				while (r.test(arg)) {
					// Replace the alias.
					arg = arg.replace(r, rfn);
					// Reset the argument value.
					arguments[i] = arg;
				}

				// Store the argument.
				args.push(arg);
			}

			return path.resolve.apply(null, args);
		},
		module: function() {
			return require(this.rpath.apply(this, [].slice.call(arguments)));
		}
	};

	// Attach to the global namespace.
	global.$app = globals;

	return globals;
};
