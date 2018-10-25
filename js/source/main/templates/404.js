"use strict";

// Node modules.
let fs = require("fs");
let path = require("path");

// App utils.
let autils = require(path.resolve(
	__APPROOT,
	"./js/source/main/utils/utils.js"
));
let remove_space = autils.remove_space;

// Gulp utils.
let gutils = require(path.resolve(__APPROOT, "./gulp/assets/utils/utils.js"));
let format = gutils.format;

// The 404 error HTML template.
var template = remove_space(`<div class="markdown-body animate-fadein">
	<div class="error">
		<div class="error-logo none"><img alt="logo-leaf" class="img" src="{{#dir_path}}/img/leaf-216.png"> devdocs</div>
		<div class="title">{{#title}}</div>
		<div class="message">{{#message}}</div>
		{{#content}}
	</div>
</div>`);

// The errors object.
var errors = {
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
		content: null
	})
};

// Exports.

module.exports = errors;
