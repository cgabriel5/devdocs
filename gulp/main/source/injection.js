// HTML injection variable object.
var html_injection = {
	css_bundle_app:
		$paths.css_bundles + get(BUNDLE_CSS, "source.names.main", ""),
	css_bundle_vendor:
		$paths.css_bundles + get(BUNDLE_CSS, "vendor.names.main", ""),
	js_bundle_app: $paths.js_bundles + get(BUNDLE_JS, "source.names.main", ""),
	js_bundle_vendor:
		$paths.js_bundles + get(BUNDLE_JS, "vendor.names.main", "")
};
