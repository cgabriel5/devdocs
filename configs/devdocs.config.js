module.exports = {
	title: "devdocs",
	animations: true,
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
	latest: "0.0.1",
	versions: [
		{
			"0.0.1": [
				{
					".": ["main", "configuration", "cli", "extendables", "diff"]
				}
			]
		}
	],
	links: [["github", "https://github.com/cgabriel5/devdocs"]],
	logo: "docs/branding/leaf-216.png",
	github: {
		account_username: "cgabriel5",
		project_name: "devdocs"
	}
};
