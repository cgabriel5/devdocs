# Gulp Bundles

Gulp use the file paths found in [`./configs/bundles.json`](/configs/bundles.json) when building bundled files like `vendor.js` and `app.js`. The configuration file can be changed/updated/modified to ones liking. 

### Example

Using the `css` bundle object as an example...

```json
"css": {
    "source": {
        "files": [
            "helpers.css",
            "styles.css"
        ],
        "names": {
            "main": "app.css"
        }
    },
    "vendor": {
        "files": [
            "css/vendor/sanitize.css/sanitize.css",
            "css/vendor/font-awesome/css/font-awesome.css"
        ],
        "names": {
            "main": "vendor.css"
        }
    }
}
```

The bundle can be read in the following manner:

- `css.source` The user's source stylesheet information.
	- `css.source.files` Array containing the files that will build [`./css/bundles/app.css`](/css/bundles/app.css).
	- `css.source.names` Contains the names, in this case only one, of the concatenated files.
- `css.vendor` The vendor file information.
	- `css.vendor.files` Array containing the files that will build [`./css/bundles/vendor.css`](/css/bundles/vendor.css).
	- `css.vendor.names` Contains the names, in this case only one, of the concatenated files.

**Note**: File paths in the `files` arrays should always be ordered in the way they need to be concatenated in.
