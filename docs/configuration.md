### Configuration

`devdocs` requires a configuration file. This file tells `devdocs` where to output files, how to transform directory/file names, set the table of contents, etc.

The following is a complete `devdocs.config.js` configuration file. Required and optional settings are noted.

```js
module.exports = {
    // (optional, default: false)
    // This flag indicates whether the website should use animations or not. By default animations
    // are not used.
	animations: true,

    // (optional, default: "devdocs")
    // The document title, i.e. <title></title>, to use (should be the app/project name).
    title: "devdocs",

    // (optional, default: "docs/")
    // The supplied path should lead to the project's Markdown files.
	root: "docs/",

    // (optional, default: object as shown below)
    // Object containing the devdocs out information.
    output: {
        // The path to where devdocs should output its files. By default it creates a devdocs folder
        // at the root of the project.
        path: "./devdocs/",
        // The file name of the devdocs output data file.
        filename: "devdocs.data.json"
    },

    // (optional, default: function() {})
    // A modifier function can be used to change/modify the directory/file names if needed.
    modifier: function(string, type) {
        if (string === ".") { // Change the root name from "." to "DevDocs".
            return "DevDocs";
        } else {
            // Everything else should simply be capitalized.
            var fchar = string.charAt(0).toUpperCase();
            return fchar + string.toLowerCase().slice(1);
        }
    },

    // (required, default: [])
    // The table of contents is an array containing objects that denote the manner in which files
    // and their parent directories should be displayed in the sidebar menu. Objects have a single
    // key that represent the directory. The key's value is an array that contains the markdown 
    // file names which make the project documentation. These files also represent the sidebar menu.
    //
    // Say we have the following project structure:
    // .docs/
    // ├── setup
    // │   ├── configuration.md
    // │   └── installation.md
    // └── main.md
    // 
    // The table of contents could be something like this:
    toc: [
        {
            ".": ["main"]
        },
        {
            "setup": ["configuration", "installation"]
        }
    ]
};
```


### Important Notes

- When `devdocs` is ran the existing `index.html` file, if one exists, will get overwritten. Therefore, it is very important to run the `devdocs` command in another branch, i.e. a `gh-pages` branch.
- By default `devdocs` will create a `./devdocs/` folder. All files needed by `devdocs` will be placed here. The folder can be renamed to whatever one likes via the `outout.path` key in your configuration file. Nonetheless, to keep things simple it might be best to leave this as default.
- At this time `devdocs` can only go up to 1 level. For example, this will not work: `./docs/subdir1/subdir2/file1.md`. Only files 1 sub-directory in will be looked at, i.e. `./docs/subdir1/file1.md`.
