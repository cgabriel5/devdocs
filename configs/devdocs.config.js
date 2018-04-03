module.exports = {
	title: "devdocs",
	animations: true,
	modifier: function(string, type) {
		if (string === ".") {
			return "DevDocs";
		} else if (string === "cli") {
			return string.toUpperCase();
		} else if (string === "main") {
			return "Home";
		} else {
			var fchar = string.charAt(0).toUpperCase();
			return fchar + string.toLowerCase().slice(1);
		}
	},
	toc: [
		{
			".": ["main", "configuration", "cli"]
		}
	],
	links: [["github", "https://github.com/cgabriel5/devdocs"]]
};
