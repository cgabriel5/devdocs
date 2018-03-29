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
