/**
 * Watch project for file changes.
 *
 * @internal - Set as internal to hide from default help output.
 */
gulp.task("watch", function(done) {
	// Get the ports.
	var __ports = __bs.__ports;
	// If the ports are not set in the init task then set them to a string
	// and check again after combining the config options with the defaults.
	if (!__ports) {
		__ports = ["APP", "UI"];
	}

	// Reset the variable and create browsersync server.
	__bs = browser_sync.create(get(BROWSERSYNC, "name", ""));

	// Browser-sync plugins aren't too well documented. These resources
	// are enough to get things going and understand how to write one.
	// [https://www.npmjs.com/package/browser-sync-close-hook]
	// [https://github.com/BrowserSync/browser-sync/issues/84]
	// [https://gist.github.com/shakyShane/3d5ec6685e07fd3227ba]
	// [https://gist.github.com/timthez/d1b29ea02cce7a2a59ff]
	// [https://gist.github.com/timthez]
	// [https://browsersync.io/docs/options#option-plugins]
	// [https://github.com/BrowserSync/browser-sync/issues/662]
	// [https://github.com/BrowserSync/browser-sync/issues/952]
	// [https://github.com/shakyShane/html-injector/blob/master/client.js]
	// [https://github.com/shakyShane/html-injector/blob/master/index.js]

	// Plugin: Add auto tab closing capability to browser-sync when the
	// auto close tabs flag is set. Basically, when the browser-sync server
	// closes all the tabs opened by browser-sync or the terminal will be
	// auto closed. Tabs that are created manually (i.e. copy/pasting URL
	// or typing out URL then hitting enter) cannot be auto closed due to
	// security issues as noted here: [https://stackoverflow.com/q/19761241].
	if (get(BROWSERSYNC, "auto_close_tabs", "")) {
		__bs.use({
			plugin: function() {}, // Function does nothing but is needed.
			hooks: {
				"client:js": bs_autoclose
			}
		});
	}

	// // Plugin: Hook into the browser-sync socket instance to be able to
	// // reload by checking the window's URL.
	// __bs.use({
	// 	plugin: function() {},
	// 	hooks: {
	// 		"client:js": fs.readFileSync(
	// 			"./gulp/assets/browser-sync/plugin-url-reload.js",
	// 			"utf-8"
	// 		)
	// 	}
	// });

	// The default Browser-Sync options. Overwrite any options by using
	// the ./configs/browsersync.json file. Anything in that file will
	// overwrite the defaults.
	var bs_opts = Object.assign(
		// The default options.
		{
			browser: browser,
			proxy: uri({
				appdir: APPDIR,
				filepath: INDEX,
				https: HTTPS
			}),
			port: __ports[0],
			ui: {
				port: __ports[1]
			},
			notify: false,
			open: true,
			logPrefix: "BS"
		},
		// Custom options.
		BROWSERSYNC.plugin
	);

	// Check if the settings need to be cleared to only use the config
	// file provided settings.
	if (get(BROWSERSYNC, "clear", "")) {
		// Reset the options variable to only contain the config file
		// settings.
		bs_opts = BROWSERSYNC.plugin;

		// If the options object is empty give a warning.
		if (!Object.keys(bs_opts).length) {
			print.gulp.warn("No options were supplied to BrowserSync.");
		}
	}

	// Note: If no ports are found then remove the keys from the object.
	// When they are left to be "APP", "UI" lets us know that they were
	// not set or else they would be something else. However, leaving
	// them as anything but a number will cause browser-sync to throw an
	// error. This is why they are removed below. This will leave
	// browser-sync to find ports instead.
	if (get(bs_opts, "port", "") === "APP") {
		delete bs_opts.port;
	}
	if (get(bs_opts, "ui.port", "") === "UI") {
		delete bs_opts.ui.port;
	}

	// Start browser-sync.
	__bs.init(bs_opts, function() {
		// // Tab into the browser-sync socket instance.
		// __bs.sockets.on("connection", function(socket) {
		// 	print("Server browser-sync socket.io connected.");

		// 	// Send custom event.
		// 	// __bs.sockets.emit("wapplr:get-url");

		// 	// Listen to custom event from the client.
		// 	socket.on("wapplr:url", function(data) {
		// 		console.log("got wapplr:get-url");

		// 		var url = require("url-parse");
		// 		var parsed = new url(data.url);

		// 		// print(parsed);
		// 		// Run URL checks here..
		// 		setTimeout(function() {
		// 			print("Reloading...");
		// 			__bs.reload();
		// 		}, 3000);
		// 	});
		// });

		// Gulp watcher paths.
		var watch_paths = BUNDLE_GULP.watch;

		// Watch for any changes to HTML source files.
		$.watcher.create("watcher:html", watch_paths.html, ["html"]);

		// Watch for any changes to CSS source files.
		$.watcher.create("watcher:css:app", watch_paths.css.app, ["css:app"]);

		// Watch for any changes to CSS vendor files.
		$.watcher.create("watcher:css:vendor", watch_paths.css.vendor, [
			"css:vendor"
		]);

		// Watch for any changes to JS source files.
		$.watcher.create("watcher:js:app", watch_paths.js.app, ["js:app"]);

		// Watch for any changes to JS vendor files.
		$.watcher.create("watcher:js:vendor", watch_paths.js.vendor, [
			"js:vendor"
		]);

		// Watch for any changes to IMG files.
		$.watcher.create("watcher:img", watch_paths.img, ["img"]);

		// Watch for any changes to config files.
		$.watcher.create("watcher:settings", watch_paths.config, ["settings"]);

		// Is the following watcher needed?

		// // Watch for any changes to README.md.
		// gulp.watch([$paths.readme], {
		//     cwd: $paths.basedir
		// }, function() {
		//     return sequence("tohtml", function() {
		//         __bs.reload();
		//     });
		// });

		done();
	});
});
