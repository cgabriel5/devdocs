"use strict";

// App utils.
let autils = $app.module("@autils/utils.js");
let remove_space = autils.remove_space;

// Gulp utils.
let gutils = $app.module("@gutils/utils.js");
let format = gutils.format;

// The 404 error HTML template.
let template = remove_space(`<div class="markdown-body animate-fadein">
	<div class="error">
		<div class="error-logo none"><img alt="logo-leaf" class="img" src="{{#dir_path}}/img/leaf-216.png"> devdocs</div>
		<div class="title">{{#title}}</div>
		<div class="message">{{#message}}</div>
		{{#content}}
	</div>
</div>`);

// Templates.
module.exports = {
	// Add needed 404 errors.
	_404: format(template, {
		title: "Page Not Found",
		message: "The page trying to be viewed does not exist.",
		content: `<div class="content"><span class="btn btn-home" id="btn-home"><i class="fas fa-home mr2"></i> Go home</span></div>`
	}),
	_404_version: format(template, {
		title: "Version Not Found",
		message: "{{#version}} doesn't exist.",
		content: `<div class="content none" id="error-content">{{#versions}}</div>`
	}),
	_404_missing_docs: format(template, {
		title: "Docs Not Found",
		message: "No docs exist.",
		// Supply a space to keep the entry blank.
		content: ""
	})
};
