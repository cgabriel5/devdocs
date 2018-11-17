/*jshint bitwise: false*/
/*jshint browser: true*/
/*jshint esversion: 6 */
/*jshint node: false*/
/*jshint -W014 */
/*jshint -W018 */
/*jshint maxerr: 10000 */

"use strict";

app.module(
	"$$",
	function(modules, name) {
		// Cache needed vars.
		var d = document;
		var $ = id => d.getElementById(id);

		// Attach to module to "export" access to other modules.
		this[name]["$loadertop"] = $("loader-top");
		this[name]["$topbar"] = $("topbar");
		this[name]["$sidebar"] = $("sidebar");
		this[name]["$markdown"] = $("markdown");
		this[name]["$soverlay"] = $("sidebar-overlay");
		this[name]["$moverlay"] = $("main-overlay");
		this[name]["$splash"] = $("splash-overlay");
		this[name]["$splash_icon"] = $("leaf");
		this[name]["$crumbs"] = $("crumbs");
		this[name]["$crumbs_folder"] = $("crumbs-folder");
		this[name]["$crumbs_file"] = $("crumbs-file");
		this[name]["$crumbs_sep"] = $("crumbs-sep");
		this[name]["$tb_loader"] = $("tb-loader");
		this[name]["$copied_message"] = $("copied-message");
		this[name]["$search"] = $("search");
		this[name]["$sinput"] = $("sinput");
		this[name]["$versions"] = $("versions");
		this[name]["$version_options"] = $("version-options");
		this[name]["$vlist"] = $("voptions-list");
		this[name]["$version"] = $("version");
		this[name]["$releases"] = $("releases");
		this[name]["$sb_menu"] = $("sidebar-menu");
		this[name]["$sb_footer"] = $("sb-footer");
	},
	"complete",
	"Module handles getting/exporting needed elements."
);
