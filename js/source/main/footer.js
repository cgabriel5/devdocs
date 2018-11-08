"use strict";

// Universal modules.
let get = require("object-path-get");

module.exports = function(config) {
	// Get needed config data.
	let footer = get(config, "footer", []);
	let title = get(config, "title", "devdocs");
	// Get GitHub account information.
	let github = Object.assign(
		{
			// Defaults.
			account_username: "",
			project_name: ""
		},
		get(config, "github", {})
	);

	// Start footer HTML.
	let footer_html = ['<div class="footer">'];

	// Build footer if links are provided.
	if (footer.length) {
		// Supported social platforms for footer links.
		let socials = {
			personal: "fas fa-globe-americas",
			facebook: "fab fa-facebook",
			messenger: "fab fa-facebook-messenger",
			twitter: "fab fa-twitter",
			youtube: "fab fa-youtube",
			vimeo: "fab fa-vimeo-v",
			google: "fab fa-google",
			google_plus: "fab fa-google-plus-g",
			google_drive: "fab fa-google-drive",
			reddit: "fab fa-reddit-alien",
			pinterest: "fab fa-pinterest-p",
			snapchat: "fab fa-snapchat-ghost",
			tumblr: "fab fa-tumblr",
			github: "fab fa-github",
			bitbucket: "fab fa-bitbucket",
			blogger: "fab fa-blogger-b",
			stumbleupon: "fab fa-stumbleupon",
			medium: "fab fa-medium-m",
			gitter: "fab fa-gitter",
			gitlab: "fab fa-gitlab",
			wordpress: "fab fa-wordpress",
			overflow: "fab fa-stack-overflow",
			slack: "fab fa-slack",
			gratipay: "fab fa-gratipay",
			location: "fas fa-map-marker-alt",
			email: "fas fa-envelope"
		};

		// Loop over the footer sections.
		footer.forEach(function(section) {
			// Get the title and links.
			let title = section.title;
			let links = section.links; // ["text", "url", "icon"]

			// Vars.
			var title_html = "";
			var content_html = "";
			var section_html = "";
			var link_content = [];

			// Start building the section HTML.

			// If a title is provided make the title HTML.
			if (title) {
				title_html = `<div class="title">${title}</div>`;
			}

			// If a links are provided make the content HTML.
			links.forEach(function(link) {
				// Get the needed information.
				let text = link[0];
				let url = link[1];
				let link_start = "";
				let link_end = "";
				let icon = link[2];

				// Reset the link start/end.
				if (url) {
					link_start = `<a href="${url}" target="_blank" class="link">`;
					link_end = "</a>";
				}

				// Check whether a social icon was provided or an actual image.
				icon = !/^\:[\w_]+/.test(icon) // :facebook-icon || ./path/to/icon
					? `<img src="${icon}" class="img">`
					: socials[icon.replace(/^\:/g, "")]
						? `<i class="${socials[icon.replace(/^\:/g, "")]}"></i>`
						: "";

				// Add the HTML to the collection.
				link_content.push(
					`${link_start}<div class="footer-link">${icon}<span>${text}</span></div>${link_end}`
				);
			});

			// If the content array is populated make the content HTML.
			if (link_content.length) {
				content_html = `<div class="content">${link_content.join(
					""
				)}</div>`;
			}

			// Finally, make the section HTML and add it to array.
			footer_html.push(
				`<div class="section">${title_html}${content_html}</div>`
			);
		});
	}

	// Close footer HTML.
	footer_html.push(`</div>`);

	// Add footer copyright information.

	// GitHub information.
	let uname = github.account_username;
	let pname = github.project_name;
	let project_url = `https://github.com/${uname}/${pname}/`;

	// Store GitHub information.
	config.data.settings.github = {
		account_username: github.account_username,
		project_name: github.project_name,
		project_url: null
	};

	// Make the link HTML if the GitHub info exists.
	if (uname && pname) {
		// Store GitHub information.
		config.data.settings.github.project_url = project_url;

		// Add copyright HTML.
		footer_html.push(
			`<div class="copyright"><a href="${project_url}" target="_blank">© ${new Date(
				Date.now()
			).getFullYear()} ${title}</a></div>`
		);
	}

	// Return footer HTML.
	return footer_html.join("");
};
