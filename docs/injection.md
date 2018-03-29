# HTML Content Injection

If needed, the project can inject contents from a `file` or a Javascript `object` to where ever specified from within your `HTML` files. The goal is to inject unmodified text into your `HTML` files. This is achieved by using the custom project Gulp plugin, [`gulp-inject-content`](https://github.com/cgabriel5/gulp-inject-content).

##### Table of Contents

- [Placeholder Syntax](#placeholder-syntax)
- [Methods](#methods)
- [Options](#options)
- [File Injection](#file-injection)
- [Variable Injection](#variable-injection)

<a name="placeholder-syntax"></a>
### Placeholder Syntax

```
$:pre{<file_name>}        # Pre file-content injection.
$:pre{$<variable_name>}   # Pre variable-injection.

$:post{<file_name>}       # Post file-content injection.
$:post{$<variable_name>}  # Post variable-injection.

${<file_name>}            # Any time file-content injection.
${$<variable_name>}       # Any time variable-injection.
```

<a name="methods"></a>
### Methods

```js
var injection = require("gulp-inject-content");
```

- `injection.pre(options)` &mdash; Perform an injection before any file processing.
- `injection.post(options)` &mdash; Perform an injection after any file processing.
- `injection(options)` &mdash; Main function performs an any injection on a file.

<a name="options"></a>
### Options

Each method, `pre` and `post`, can take in an options object. These are the following options with their defaults.

```js
var options = {
	// The location of the injectable files.
	directory: "html/injection/",

	replacements: {}, // The variable replacements.

	// Match file name exactly as provided (take extension into consideration).
	// For example, when $:post{hello_world.txt} is provided a file with the
	// name of "hello_world.txt" will be looked for. When an extension-less
	// file name needs to be used set this flag to false. Therefore, when
	// $:post{hello_world} is provided the first file found with the name
	// "hello_world" will be used regardless of the file extension.
	exact: true,

	// Cache file contents to speed up performance when the same placeholder
	// is found throughout the file's contents. Set this flag to false if this
	// behavior is not needed.
	cache: true
};
```

<a name="file-injection"></a>
### File Injection

Say we have some content that should maintain its structural integrity and should not be modified (prettified, minified, etc..) for example.

`my_html_file.html`

```html
<div>
    <textarea>$:post{injection_content}</textarea>
</div>
```

`injection_content.text` (content file)

```css
body {
	color: black;
}

div {
	background: green;
}
```

`gulpfile.js`

```js
var gulp = require("gulp");
var pump = require("pump");
var beautify = require("gulp-jsbeautifier");
var injection = require("gulp-inject-content");

// Since the options object is empty it is not really needed and
// is only shown for the purpose of example.
var options = {}; // Use defaults.

gulp.task("my_task", function(done) {
	pump(
		[
			gulp.src("my_html_file.html"),
			injection.pre(options), // Any pre content injection.
			beautify(),
			injection.post(options), // Any post content injection.
			gulp.dest("./")
		],
		done
	);
});
```

**Note**: The project will look for a file under [`./html/injection/`](/html/injection/). In this case for `./html/injection/injection_example.text`. If found, it will inject the contents of the file into its injection placeholder. When a file is not found it will injection `undefined`.

After, `my_html_file.html` will look like this:

```html
<div>
    <textarea>body {
	color: black;
}

div {
	background: green;
}</textarea>
</div>
```

<a name="variable-injection"></a>
### Variable Injection

Say we need to dynamically make paths for an `HTML` file. This can also be handled with [`gulp-inject-content`](https://github.com/cgabriel5/gulp-inject-content). This time via `variable` injection.

`my_html_file.html`

```html
<script src="$:post{$js_bundle_vendor}"></script>
<script src="$:post{$js_bundle_app}"></script>
```

`gulpfile.js`

```js
var gulp = require("gulp");
var pump = require("pump");
var injection = require("gulp-inject-content");

gulp.task("my_task", function(done) {
	var replacements = {
		js_bundle_vendor: "some/path/to/js/vendor.js",
		js_bundle_app: "some/path/to/js/app.js"
	};

	var options = { replacements: replacements };

	pump(
		[
			gulp.src("my_html_file.html"),
			injection.post(options), // Variable injection.
			gulp.dest("./")
		],
		done
	);
});
```

**Note**: At the moment, `Objects` can only go `1` level deep. When a variable is not found injection will default to `undefined`.

After, `my_html_file.html` will look like this:

```html
<script src="some/path/to/js/vendor.js"></script>
<script src="some/path/to/js/app.js"></script>
```
