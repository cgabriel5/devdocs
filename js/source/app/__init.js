/**
 * This IIFE is used to initialize all the project modules found in
 * ./js/source/modules. Essentially, it will loop over all modules and
 * invoke them based on the mode (complete|interactive) provided. When
 * a mode is not provided it will default to "complete". For information
 * about what mode to use see below.
 */
(function() {
	// Add to global scope for ease of use. Use global app var or
	// create it if not present.
	var app = window.app || (window.app = {}),
		counter = {
			complete: 0,
			interactive: 0
		},
		queue = {
			complete: [],
			interactive: []
		};

	// Add a module to load.
	app.module = function(module_name, fn, mode) {
		// Determine what array the module needs to be added to.
		// Default to complete when nothing is provided.
		var type = !mode || mode === "complete" ? "complete" : "interactive";

		// Add the module to the queue.
		queue[type].push([module_name, fn]);
	};

	// App module invoker.
	var invoke = function(mode) {
		// Get the queued array.
		var modules = queue[mode];

		// If no modules, return.
		if (!modules.length) return;

		// Run the modules one after another.
		load(modules, counter[mode], mode);
	};

	var load = function(modules, count, mode) {
		// Get the current module + its information.
		var module = modules[count];

		// If no module exists all modules have loaded.
		if (!module) return;

		// Get the module information.
		var module_name = module[0],
			fn = module[1];

		// Run the module and the load() function.
		(function() {
			// Add the module name to the app.
			app[module_name] = app[module_name] || {};

			// Call the module and run it.
			fn.call(app, app, module_name);

			// Increase the counter.
			counter[mode]++;

			// Run the load function again.
			load(modules, counter[mode], mode);
		})();
	};

	// Cleanup the app variable.
	var cleanup = function() {
		// Remove unneeded properties once the app has loaded.
		delete app.module;
		delete app.invoke;
	};

	// The readystatechange event is fired when the readyState attribute of a
	// document has changed.
	// [https://developer.mozilla.org/en-US/docs/Web/Events/readystatechange]
	document.onreadystatechange = function() {
		// [https://developer.mozilla.org/en-US/docs/Web/API/Document/readyState]

		// Loading: The document still loading.

		// Complete: The document and all sub-resources have finished loading
		//  (same as the window.onload event).
		//
		// Essentially the following:
		// window.addEventListener("load", function() {...
		// [https://developer.mozilla.org/en-US/docs/Web/Events/load]

		// Interactive: The document has finished loading & parsed but
		// sub-resources such as images, stylesheets, and frames are still
		// loading.
		//
		// Essentially the following:
		// document.addEventListener("DOMContentLoaded",...
		// [https://developer.mozilla.org/en-US/docs/Web/Events/DOMContentLoaded]

		// Document loaded and parsed but still loading sub-resources. User
		// is able to interact with page, however.
		if (document.readyState === "interactive") {
			// Invoke the modules set to mode interactive.
			invoke("interactive");
		}

		// All resources have loaded (document + subresources).
		if (document.readyState === "complete") {
			// Invoke the modules set to mode complete.
			invoke("complete");
			// Cleanup app var once everything is loaded.
			cleanup();
		}

		// Explanation with images:
		// [https://varvy.com/performance/document-ready-state.html]
	};
})();
