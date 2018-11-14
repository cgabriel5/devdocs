/*jshint bitwise: false*/
/*jshint browser: true*/
/*jshint esversion: 6 */
/*jshint node: false*/
/*jshint -W014 */
/*jshint -W018 */
/*jshint maxerr: 10000 */

"use strict";

app.module(
	"libs",
	function(modules, name) {
		// Init FastClickJS.
		if ("addEventListener" in document) {
			FastClick.attach(document.body);
		}
	},
	"interactive",
	"Module handles initiating/setting-up any vendor/third-party libraries."
);
