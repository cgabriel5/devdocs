# Modules

⚠ &mdash; _This only pertains to_ `webapp` _projects._

### What is a module?

A `module` is a file containing code made for a specific purpose. Modules help make the project's code _modular_ which help with project maintainability. [`./js/source/modules/`](/js/source/modules/) contains the default provided modules. Add and remove modules as needed.

### Adding/removing a module

Manually

- To **add** a module create the file and place it in [`./js/source/modules/`](/js/source/modules/). Then make sure to add the file's path to the `js.source.files` array in [`./configs/bundles.json`](/configs/bundles.json).
- To **remove** a module delete the file from [`./js/source/modules/`](/js/source/modules/) and remove the file path from the `js.source.files` array in [`./configs/bundles.json`](/configs/bundles.json).
- Whether adding or removing a module the final step would be to update the app bundle by running `$ gulp js:app`.

Terminal

- For more information/examples run: `$ gulp help --filter "module" --verbose`.
- The process via the terminal will make the module (file) and open [`./configs/bundles.json`](/configs/bundles.json). Once open, update the `js.source.files` array with the new file path. _Remember that file order is important_. When the editor is closed `$ gulp js:app` will automatically run.

```
# Add module
$ gulp module --filename "my_new_module.js"

# Remove module
$ gulp module --remove "my_new_module.js"
```

### Structure

A module has the following structure:

```js
app.module(
	"MODULE_NAME",
	function(modules, name) { // MODULE_FUNCTION
		// App logic...
	},
	"MODULE_MODE",
	"MODULE_DESCRIPTION"
);
```

- `MODULE_NAME`: The name of the module.
- `MODULE_FUNCTION`: The app's logic.
  - `modules` &mdash; List of all modules to be able to access other module's exported code.
  - `name` &mdash; Name of current module.
- `MODULE_MODE`: The mode in which the module should load (`interactive`|`complete`). More info [here](https://developer.mozilla.org/en-US/docs/Web/Events/readystatechange).
	- `interactive` &mdash; The document has loaded but sub-resources (i.e. images, stylesheets, etc.) are still loading. 
	- `complete` &mdash; The document and all its sub-resources have finished loading.
- `MODULE_DESCRIPTION`: An optional description of what the module is for.

### Example

Here is the [`./js/source/modules/main.js`](/js/source/modules/main.js) module but modified for example purposes.

**Note**: From within the function's body one is able to access other module's exports as needed.

```js
app.module(
	"main",
	function(modules, name) {
		// App logic...

		// Access other modules like so.
		var elements = modules.$$;
		var events = modules.events;

		// Or from the app global itself.
		var elements = app.$$;
		var events = app.events;

		// Now use them for whatever. Modules are simply objects so
		// they can be updated with properties, other objects, etc.
		// to be accessed from within other modules.
	},
	"complete",
	"Main app module is where the app's logic should be placed."
);
```
