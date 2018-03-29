# Project Structure

**Note**: Directory structure can be modified to ones liking. Files can be broken up and modularized in any way or not at all. Whatever changes are made the paths in [`./configs/bundles.json`](/configs/bundles.json) _must_ also match the new file structure.

##### Table of Contents

- [html/](#html-directory)
- [css/](#css-directory)
- [js/](#js-directory)
- [img/](#img-directory)
- [gulp/](#gulp-directory)
- [configs/](#configs-directory)
- [markdown/](#markdown-directory)
- [favicon/](#favicon-directory)
- [./ (root)](#root-directory)

<a name="html-directory"></a>
## HTML Directory

<a name="html-default-tree"></a>
### Default Tree

```
./html/
├── injection/
│   └── hello_world.txt
└── source/
    ├── body/
    │   ├── close.ig.html
    │   ├── content.html
    │   ├── js.html
    │   └── open.ig.html
    ├── head/
    │   ├── close.ig.html
    │   ├── css.html
    │   ├── favicon.html
    │   ├── js.html
    │   ├── meta.html
    │   └── open.ig.html
    └── index/
        ├── close.ig.html
        └── open.ig.html
```

<a name="html-break-down"></a>
### Break-Down

- [`./html/injection/`](/html/injection/) where HTML injection files should go.
	- More information on HTML content injection can be found [here](./injection.md).
- [`./html/source/`](/html/source/) where source HTML files should go.
	- Files will build [`./index.html`](/index.html).

<a name="css-directory"></a>
## CSS Directory

<a name="css-default-tree"></a>
### Default Tree

```
./css/
├── assets/
│   └── fonts/
│       └── font-awesome/ (...font-awesome files)
├── bundles/
│   ├── app.css
│   └── vendor.css
├── source/
│   ├── helpers.css
│   └── styles.css
└── vendor/
    ├── font-awesome/
    │   └── font-awesome.css
    ├── normalize.css/
    │   └── normalize.css
    └── sanitize.css/
        └── sanitize.css
```

<a name="css-break-down"></a>
### Break-Down

- [`./css/assets/`](/css/assets/) where all vendor and vendor specific assets go. 
- [`./css/bundles/`](/css/bundles/) where Gulp made bundled files will be placed.
	- [`app.css`](css/bundles/app.css) source bundled CSS file.
	- [`vendor.css`](css/bundles/vendor.css) vendor bundled CSS file.
- [`./css/source/`](/css/source/) where your project CSS files should go.
	- [`helpers.css`](/css/source/helpers.css) helper CSS file.
	- [`styles.css`](/css/source/styles.css) app specific CSS file.
	- Files will build [`./css/bundles/app.css`](/css/bundles/app.css).
- [`./css/vendor/`](/css/vendor/) where vendor CSS files should go.
	- Files will build [`./css/bundles/vendor.css`](/css/bundles/vendor.css).
	- Uses [`sanitize.css`](http://jonathantneal.github.io/sanitize.css/) by default. Can be switched to [`normalize.css`](https://necolas.github.io/normalize.css/).

<a name="js-directory"></a>
## JS Directory

<a name="javascript-default-tree"></a>
### Default Tree

```
./js/
├── assets/
├── bundles/
│   ├── app.js
│   └── vendor.js
├── source/
│   ├── app/
│   │   ├── iife/
│   │   │   ├── close.ig.js
│   │   │   └── open.ig.js
│   │   └── __init.js
│   └── modules/
│       ├── core.js
│       ├── events.js
│       ├── globals.js
│       ├── $$.js
│       ├── libs.js
│       ├── main.js
│       └── utils.js
└── vendor/
    ├── fastclick/
    │   └── fastclick.js
    ├── jquery/
    │   ├── core.js
    │   ├── jquery.js
    │   ├── jquery.min.js
    │   ├── jquery.slim.js
    │   └── jquery.slim.min.js
    └── modernizr/
        └── modernizr.js
```

<a name="javascript-break-down"></a>
### Break-Down

- [`./js/assets/`](/js/assets/) where all vendor specific assets go. 
- [`./js/bundles/`](/js/bundles/) where Gulp made bundled files will be placed.
	- [`app.js`](/js/bundles/app.js) source bundled JS file.
	- [`vendor.js`](/js/bundles/vendor.js) vendor bundled JS file.
- [`./js/source/`](/js/source/) where your project JS files should go.
	- Files will build [`./js/bundles/app.js`](/js/bundles/app.js).
	- [`modules/`](/js/source/modules/) are explained [here](/docs/modules.md)
- [`./js/vendor/`](/js/vendor/) where vendor JS files should go.
	- Files will build [`./js/bundles/vendor.js`](/js/bundles/vendor.js).

<a name="img-directory"></a>
## Img Directory

<a name="img-default-tree"></a>
### Default Tree

```
./img/
```

<a name="img-break-down"></a>
### Break-Down

- [`img/`](/img/) directory contains a [`README.md`](/img/README.md) placeholder and is otherwise empty.

<a name="gulp-directory"></a>
## Gulp Directory

<a name="gulp-default-tree"></a>
### Default Tree

```
./gulp/
├── assets/
│   ├── node-notifier/
│   └── utils/
│       └── utils.js
└── main/
    └── source/
        ├── configs.js
        ├── functions.js
        ├── helpers/
        │   ├── dependency.js
        │   ├── eol.js
        │   ├── favicon.js
        │   ├── files.js
        │   ├── help.js
        │   ├── indent.js
        │   ├── instance.js
        │   ├── lintcss.js
        │   ├── linthtml.js
        │   ├── lintjs.js
        │   ├── make.js
        │   ├── modernizr.js
        │   ├── module.js
        │   ├── open.js
        │   ├── pretty.js
        │   ├── settings.js
        │   ├── stats.js
        │   └── tohtml.js
        ├── injection.js
        ├── paths.js
        ├── preconfig.js
        ├── requires.js
        ├── tasks/
        │   ├── css.js
        │   ├── dist.js
        │   ├── html.js
        │   ├── img.js
        │   ├── init.js
        │   ├── js.js
        │   ├── lib.js
        │   └── watch.js
        └── vars.js
```

<a name="gulp-break-down"></a>
### Break-Down

- [`./gulp/assets/`](/gulp/assets/) any assets needed for [`./gulpfile.js`](/gulpfile.js).
- [`./gulp/main/source/`](/gulp/main/source/) source files that build [`./gulpfile.js`](/gulpfile.js).

<a name="configs-directory"></a>
## Configs Directory

<a name="configs-default-tree"></a>
### Default Tree

```
./configs/
├── app.cm.json
├── autoprefixer.json
├── browsersync.json
├── bundles.json
├── csscomb.json
├── csslint.cm.json
├── eslint.json
├── favicondata.json
├── findfreeport.json
├── htmllint.cm.json
├── jsbeautify.json
├── jshint.cm.json
├── modernizr.json
├── paths.cm.json
├── perfectionist.json
├── prettier.json
├── realfavicongen.json
├── .__internal.json
└── .__settings.json
```

<a name="configs-break-down"></a>
### Break-Down

- [`./configs/`](/configs/) project configuration files.
- [`./configs/._settings.json`](/configs/._settings.json) generated on project setup and should really not be modified.
- [`./configs/._internal.json`](/configs/._internal.json) generated on project setup and should **not** be modified.

<a name="markdown-directory"></a>
## Markdown Directory

<a name="markdown-default-tree"></a>
### Default Tree

```
./markdown/
├── assets/
│   └── css/
│       ├── github-markdown.css
│       └── prism-github.css
└── previews/
```

<a name="markdown-break-down"></a>
### Break-Down

- [`./markdown/assets/`](/markdown/assets/) assets needed for the Gulp `tohtml` task which converts `.md` files to `.html`.
- [`./markdown/previews/`](/markdown/previews/) `tohtml` file conversions will get placed here. File can be opened in your browser using the project's Gulp `open` command or right clicking opening/dragging file into your browser.

<a name="favicon-directory"></a>
## Favicon Directory

<a name="favicon-default-tree"></a>
### Default Tree

```
./favicon/
```

<a name="favicon-break-down"></a>
### Break-Down

- [`./favicon/`](/favicon/) generated favicons using the Gulp task `favicon` are placed here.
- [`./favicon/`](/favicon/) favicons are generated via [`gulp-real-favicon`](https://github.com/RealFaviconGenerator/gulp-real-favicon) and placed in this folder.

<a name="root-directory"></a>
## Root Directory

<a name="root-default-tree"></a>
### Default Tree

```
./
├── apple-touch-icon.png
├── browserconfig.xml
├── CONTRIBUTING.md
├── .editorconfig
├── favicon.ico
├── .gitattributes
├── .gitignore
├── gulpfile-main.js
├── gulpfile-setup.js
├── index.html
├── LICENSE.txt
├── package.json
├── README.md
├── site.webmanifest
└── yarn.lock
```

<a name="root-break-down"></a>
### Break-Down

- [`./`](/../../) list of `root` files.
- [`./`](/../../) root files are self explanatory.
