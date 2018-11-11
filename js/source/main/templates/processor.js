"use strict";

// Node modules.
let fs = require("fs");
let path = require("path");

// App utils.
let autils = $app.module("@autils/utils.js");
let remove_space = autils.remove_space;

// The errors object.
var templates = {
	sb_menu_item: remove_space(`<div id="parent-menu-file-{{#d1}}">
	<li class="l-2" id="menu-file-{{#d1}}" data-dir="{{#d2}}" data-title="{{#d3}}">
	<i class="fas fa-caret-right menu-arrow" data-file="{{#d4}}"></i>
	<div class="l-2-link">
		<a class="link" href="#" data-file="{{#d4}}">{{#d3}}</a>
		<span class="link-headings-count">\$0</span>
	</div>
</li></div>`),
	headers_count: remove_space(
		`<ul class="file-headers headings-cont" id="menu-headers-{{#d1}}" data-dir="{{#d2}}">`
	),
	timeago: `<div id="footer-content-ddwrap">
	<div class="mtime">
		<div>
			<span class="label"><i class="fas fa-edit"></i> Last update:</span>
			<span class="mtime-ts animate-fadein none" data-ts="{{#d1}}"></span>
			<span class="long">({{#d2}})</span>
			<span class="clock-icon">— <i class="far fa-clock"></i></span>
		</div>
	</div>
</div>`,
	block: remove_space(`<pre>
	<code class="lang-{{#d1}}" data-highlight-lines="" data-block-name="">{{#d2}}</code>
	</pre>`),
	// The SVG was lifted from GitHub.
	octicon: `<svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewBox="0 0 16 16" width="16">
		<path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z">
		</path>
	</svg>`,
	anchor_link: `<div>{{#d1}}</div><a href="#{{#d2}}" aria-hidden="true" class="anchor" name="{{#d2}}" id="{{#d2}}"><i class="fas fa-link"></i></a>`,
	l_3: `<li class="l-3" data-title="{{#d1}}"><a class="link link-heading" href="#{{#d2}}" data-file="{{#d3}}">{{#d4}}</a></li>`,
	cb_group: remove_space(`<div class="cb-group" singleton="true">
	<div class="cb-top-ui animate-fadein" data-tabs=""></div>
	<div class="cb-blocks">{{#d1}}</div>
</div>`),
	tab: `<span class="tab{{#d1}}{{#d2}}" data-tab-index="{{#d3}}" data-gid="{{#d4}}">{{#d5}}</span>`,
	tabs: `<div class="tabs" id="cb-tabs-{{#d1}}">{{#d2}}</div>`,
	actions_right: remove_space(`<div class="actions-right">
	<span class="btn action collapse none" data-gid="{{#d1}}">
		<i class="fas fa-minus-square"></i><span>collapse</span>
	</span>
	<span class="btn action copy" data-gid="{{#d1}}">
		<i class="fas fa-clipboard"></i><span>copy</span>
	</span>
</div>`),
	cb_placeholder: remove_space(`<div class="codeblock-placeholder animate-fadein none" data-block-index="{{#d1}}" data-gid="{{#d2}}">
			<div class="template">
				<div class="row">
					<div class="block size-40"></div>
					<div class="block size-100"></div>
				</div>
				<div class="indent row">
					<div class="block size-40"></div>
					<div class="block size-130"></div>
				</div>
				<div class="indent row">
					<div class="block size-40"></div>
					<div class="block size-80"></div>
					<div class="block size-70"></div>
				</div>
				<div class="row">
					<div class="block size-40"></div>
					<div class="block size-50"></div>
				</div>
			</div>
			<div class="info">
				<div>
					<span class="label">Show block{{#d3}}</span>
					<div class="details">
						<i class="fas fa-code"></i> — {{#d4}} lines, {{#d5}} characters
					</div>
				</div>
			</div>
		</div>`),
	line_highlight_1: `<div class="line"><span{{#d1}}>{{#d2}}</span></div>`,
	line_highlight_2: `<div class="line{{#d1}}"> </div>`,
	cb_name: `<div class="codeblock-name">{{#d1}}</div>`,
	line_nums: remove_space(`<div class="line-nums hidden-clone">{{#d1}}</div>
	<div class="line-nums lines">{{#d2}}</div>
	<div class="line-nums numbers">{{#d3}}</div>`)
};

// Exports.

module.exports = templates;
