module.exports = {
    // (optional, default: false)
    // Debugging is turned off, by default. Setting this flag to true
    // outputs basic level debugging.
    debug: false,

    // (optional, default: false)
    // This flag indicates whether the website should use animations or not.
    // By default animations are not used.
    animations: true,

    // (optional, default: "devdocs")
    // The document title, i.e. <title></title>, to use (should be the
    // app/project name).
    title: "devdocs",

    // (optional, default: "docs/")
    // The supplied path should lead to the project's Markdown files.
    root: "docs/",

    // (optional, default: object as shown below)
    // Object containing the devdocs out information.
    output: {
        // The path to where devdocs should output its files. By default it
        // creates a devdocs folder at the root of the project.
        path: "devdocs/"
    },

    // A logo can be supplied to show in the sidebar and topbar. Preferably,
    // a square logo should be used due to space constraints. However a square,
    // portrait, or landscape PNG/JPG may by supplied. Alternatively, an SVG
    // object may be supplied in lieu of a PNG/JPG. The following two methods
    // are shown below:

    // To supply a PNG/JPG simply provide the image path like so:
    logo: "docs/branding/leaf-216.png",
    // To use a SVG, supply an object containing the following information:
    // logo: {
    //     type: "portrait", // The image type (square, portrait, or landscape).
    //     data: `<svg...</svg>` // The SVG contents.
    // },

    // (optional, default: function() {})
    // A modifier function can be used to change/modify the directory/file
    // names if/as needed.
    modifier: function(basename, string, type) {
        if (basename === ".") {
            return "DevDocs";
        } else if (basename === "cli") {
            return basename.toUpperCase();
        } else if (basename === "main") {
            return "Home";
        } else {
            var fchar = basename.charAt(0).toUpperCase();
            return fchar + basename.toLowerCase().slice(1);
        }
    },

    // (required, default: [])
    // The versions array containing objects that denote the manner in which
    // files and their parent directories should be displayed in the sidebar
    // menu. Objects have a single key that represent the directory. The key's
    // value is an array that contains the markdown file names which make the
    // project documentation. These files also represent the sidebar menu.
    //
    // Say we have the following project structure:
    // .docs/
    // ├── cli.md
    // ├── configuration.md
    // ├── diff.md
    // ├── extendables.md
    // └── main.md
    // The following shows a simple two version implementation:
    versions: [
        {
            "0.0.1": [
                {
                    ".": [
                        "main",
                        "configuration",
                        "cli",
                        "extendables",
                        "diff"
                    ]
                }
            ]
        }
    ],

    // (required)
    // The version to initially load.
    latest: "0.0.1",

    // (optional, default: [])
    // Versions provided in this array will only be processed. All other
    // versions will be skipped.
    // process_versions: ["0.0.1"],

    // (optional, default: [])
    // Optional site footer.
    footer: [
        {
            title: "Social",
            links: [
                // Supported websites:
                ["GitHub", "https://github.com/cgabriel5/devdocs", ":github"]
                // ["user", "<url/to/page>"], // (documentation editor's personal website)
                // ["facebook", "<url/to/page>"],
                // ["twitter", "<url/to/page>"],
                // ["youtube", "<url/to/page>"],
                // ["vimeo", "<url/to/page>"],
                // ["google_plus", "<url/to/page>"],
                // ["reddit", "<url/to/page>"],
                // ["pinterest", "<url/to/page>"],
                // ["snapchat", "<url/to/page>"],
                // ["tumblr", "<url/to/page>"],
                // ["github", "<url/to/page>"],
                // ["bitbucket", "<url/to/page>"],
                // ["blogger", "<url/to/page>"],
                // ["stumbleupon", "<url/to/page>"]
            ]
        }
    ],

    // (optional, default: {})
    // Should be provided to properly link GitHub resources.
    github: {
        // Used to fill in the following:
        // [https://github.com/${account_username}/${project_name}/blob/master/]
        account_username: "cgabriel5",
        project_name: "devdocs"
    }
};
