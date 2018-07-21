### Diff Code Blocks

Diff highlight is possible with code blocks.

<pre lang="md">
&#96;&#96;&#96;diff
Code diff block...
&#96;&#96;&#96;
</pre>

```diff
diff --git css/styles.css
index a112c82..366060a 100644
--- a/css/source/github-markdown.css
+++ b/css/source/github-markdown.css
@@ -609,8 +609,16 @@
 .markdown-body img {
	box-sizing: content-box;
	max-width: 100%;
-       /*background-color: #ffffff;*/
-       background-color: transparent;
+       background-color: #ffffff;
+       /*background-color: transparent;*/
+}
```
