/*jshint bitwise: false*/
/*jshint browser: true*/
/*jshint esversion: 6 */
/*jshint node: false*/
/*jshint -W014 */
/*jshint -W018 */
/*jshint maxerr: 10000 */

"use strict";

app.module(
	"globals",
	function(modules, name) {
		// The request filepath.
		var REQUEST_PATH = "./devdocs/data.json";
		// Attach to module to "export" access to other modules.
		this[name]["REQUEST_PATH"] = REQUEST_PATH;

		// Contain all the sidebar submenu heights.
		this[name]["heights"] = {};
		// Contain all content headers.
		this[name]["headers"] = {};

		// Store the currently displayed file.
		this[name]["current_file"] = null;
		this[name]["menu_anim_timer"] = null;
		this[name]["sb_animation"] = null;
		this[name]["$sb_animation_header"] = null;
		this[name]["sb_active_el_loader"] = null;
		this[name]["clipboardjs_instance"] = null;
		this[name]["codeblock_scroll"] = null;
		this[name]["sidebar_menu_scroll"] = null;
		this[name]["timeago_timer"] = null;

		this[name]["$moused_el2"];
		this[name]["prevent_mousemove_expanders"];
		// this[name]["$moused_el3"];
		this[name]["$moused_el2_inserts"] = [];
		// this[name]["moused_el3_inserts"] = [];

		// Function that sets adds a global flag.
		this[name]["GETGLOBAL"] = function(flag) {
			// Return the value.
			return modules["globals"][flag];
		};

		// Function that sets adds a global flag.
		this[name]["SETGLOBAL"] = function(flag, val) {
			// Store the flag.
			modules[name][flag] = val;
			// Return the value.
			return val;
		};
	},
	"complete",
	"Module handles getting/exporting global app variables."
);
