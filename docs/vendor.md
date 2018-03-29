# Vendor Dependencies

##### Table of Contents

- [Add](#add)
	- [JavaScript Library](#library-add-js)
	- [CSS Library](#library-add-css)
- [Remove](#remove)
	- [JavaScript Library](#library-remove-js)
	- [CSS Library](#library-remove-css)

<a name="add"></a>
## Add Library

<a name="library-add-js"></a>
### JavaScript

The following steps show how to add a `JavaScript` third-party library. Although already added to project by default but for the sake of an example, say we want to add [jQuery](https://jquery.com/).

#### Goal

- The _goal_ is to add the library into [`./js/vendor/LIBRARY/`](/js/vendor/) and link the library to [`./configs/bundles.json`](/configs/bundles.json).

#### How-To

1. The project provides a handy Gulp helper task to make this move easy. Simply run the following command:
	- `$ yarn add jquery`
	- `$ gulp dependency --add jquery --type js`
2. Once moved, you have to then properly link things together.
	- This includes finding the path of the library and updating [`./configs/bundles.json`](/configs/bundles.json).
	- Inside [`./configs/bundles.json`](/configs/bundles.json) the library path needs to be added to the `js.vendor.files` array.
	- It is important to note that the array order is very important as it tells Gulp the order in which [`./js/bundles/vendor.js`](/js/bundles/vendor.js) needs to be built.
3. Run `$ gulp js:vendor` to re-build [`./js/bundles/vendor.js`](/js/bundles/vendor.js).

**Note**: For `library` projects [`./js/vendor/__init.js`](/js/vendor/__init.js) should always be last in the array as it is meant to help initialize any third-party library. In other words, any code needed to help initialize the used libraries must go in this file.

<a name="library-add-css"></a>
### CSS

The following steps show how to add a `CSS` third-party library. Although already added to project by default but for the sake of an example, say we want to add [Font-Awesome](http://fontawesome.io/).

#### Goal

- The _goal_ is to add the library into [`./css/vendor/LIBRARY/`](/css/vendor/) and link the library to [`./configs/bundles.json`](/configs/bundles.json).

#### How-To

1. The project provides a handy Gulp helper task to make this move easy. Simply run the following command:
	- `$ yarn add font-awesome`
	- `$ gulp dependency --add font-awesome --type css`
2. Once moved, you have to then properly link things together.
	- This includes finding the path of the library and updating [`./configs/bundles.json`](/configs/bundles.json).
	- Inside [`./configs/bundles.json`](/configs/bundles.json) the library path needs to be added to the `css.vendor.files` array.
	- It is important to note that the array order is very important as it tells Gulp the order in which [`./css/bundles/vendor.css`](/css/bundles/vendor.css) needs to be built.
	- **Note**: [`font-awesome`](http://fontawesome.io/) requires fonts assets. Any library assets need to be added into [`./css/assets/`](/css/assets/) and also need to be properly linked.
3. Run `$ gulp css:vendor` to re-build [`./css/bundles/vendor.css`](/css/bundles/vendor.css).

<a name="remove"></a>
## Remove Library

<a name="library-remove-js"></a>
### JavaScript

The following steps show how to remove a `JavaScript` third-party library. For the sake of an example, say we want to remove [jQuery](https://jquery.com/).

#### Goal

- The _goal_ is to remove the library from [`./js/vendor/LIBRARY/`](/js/vendor) and unlink the library from [`./configs/bundles.json`](/configs/bundles.json).

#### How-To

1. The project provides a handy Gulp helper task to make this move easy. Simply run the following command:
	- `$ yarn remove jquery`
	- `$ gulp dependency --remove jquery --type js`
2. Once removed, you have to then properly unlink the library.
	- Simply remove the file the `js.vendor.files` array in [`./configs/bundles.json`](/configs/bundles.json).
	- It is important to note that the array order is very important as it tells Gulp the order in which [`./js/bundles/vendor.js`](/js/bundles/vendor.js) needs to be built so leave other library file paths alone.
3. Run `$ gulp js:vendor` to re-build [`./js/bundles/vendor.js`](/js/bundles/vendor.js).

**Note**: For `library` projects [`./js/vendor/__init.js`](/js/vendor/__init.js) should always be last in the array as it is meant to help initialize any third-party library. In other words, any code needed to help initialize the used libraries must go in this file.

<a name="library-remove-css"></a>
### CSS

The following steps show how to remove a `CSS` third-party library. For the sake of an example, say we want to remove [sanitize.css](https://jonathantneal.github.io/sanitize.css/).

#### Goal

- The _goal_ is to remove the library from [`./css/vendor/LIBRARY/`](/css/vendor) and unlink the library from [`./configs/bundles.json`](/configs/bundles.json).

#### How-To

1. The project provides a handy Gulp helper task to make this move easy. Simply run the following command:
	- `$ yarn remove sanitize.css`
	- `$ gulp dependency --remove sanitize.css --type css`
2. Once removed, you have to then properly unlink the library.
	- Simply remove the file the `css.vendor.files` array in [`./configs/bundles.json`](/configs/bundles.json).
	- It is important to note that the array order is very important as it tells Gulp the order in which [`./css/bundles/vendor.css`](/css/bundles/vendor.css) needs to be built so leave other library file paths alone.
3. Run `$ gulp css:vendor` to re-build [`./css/bundles/vendor.css`](/css/bundles/vendor.css).
