### Extendables

`devdocs` comes with custom Markdown syntax (`extendables`).

### Message Extendable

The `note` extendable can be used to easily include alerts, tips, warnings, etc. Basically, to bring attention to specific areas of your documentation.

### Message Syntax

<pre lang="html">
&lt;dd-note title="Note" color="$COLOR" icon="$ICON"&gt;The message/text.&lt;/dd-note&gt;

Or...

&lt;dd-note title="Note" color="$COLOR" icon="$ICON"&gt;
The message/text.
&lt;/dd-note&gt;
</pre>

### Message Colors

Default coloring:

<dd-note title="Example" icon="info">
This is an example of the default coloring for the message extendable (no coloring) with the `info` icon.
</dd-note>

<dd-expand title="Show colored examples">
<dd-note title="Example" color="grapefruit" icon="check">This is an example message extendable using the `grapefruit` color and `check` icon.</dd-note>
<dd-note title="Example" color="bittersweet" icon="info">This is an example message extendable using the `bittersweet` color and `info` icon.</dd-note>
<dd-note title="Example" color="honeybutter" icon="question">This is an example message extendable using the `honeybutter` color and `question` icon.</dd-note>
<dd-note title="Example" color="sunflower" icon="error">This is an example message extendable using the `sunflower` color and `error` icon.</dd-note>
<dd-note title="Example" color="grass" icon="warning">This is an example message extendable using the `grass` color and `warning` icon.</dd-note>
<dd-note title="Example" color="mint" icon="update">This is an example message extendable using the `mint` color and `update` icon.</dd-note>
<dd-note title="Example" color="sky" icon="code">This is an example message extendable using the `sky` color and `code` icon.</dd-note>
<dd-note title="Example" color="bluejeans" icon="file">This is an example message extendable using the `bluejeans` color and `file` icon.</dd-note>
<dd-note title="Example" color="aqua" icon="link">This is an example message extendable using the `aqua` color and `link` icon.</dd-note>
<dd-note title="Example" color="lavender">This is an example message extendable using the `lavender` color and no icon.</dd-note>
<dd-note title="Example" color="pinkrose">This is an example message extendable using the `pinkrose` color and no icon.</dd-note>
<dd-note title="Example" color="lightgray">This is an example message extendable using the `lightgray` color and no icon.</dd-note>
<dd-note title="Example" color="mediumgray">This is an example message extendable using the `mediumgray` color and no icon.</dd-note>
<dd-note title="Example" color="darkgray">This is an example message extendable using the `darkgray` color and no icon.</dd-note>
<dd-note title="Example" color="spacegray">This is an example message extendable using the `spacegray` color and no icon.</dd-note>
<dd-note title="" color="grapefruit" icon="check">Not providing a title disregards the icon.</dd-note>
<dd-note title="" color="grass" icon="info">Not providing a title disregards the icon.</dd-note>
</dd-expand>


### Code groups

Code blocks can be grouped together then toggled via tabs.

<dd-codegroup tabs="Syntax;HTML;JS;CSS">
<pre lang="md">
&lt;dd-codegroup tabs="1stTabName;NthTabName"&gt;
&#96;&#96;&#96;
Code block 1.
&#96;&#96;&#96;

&#96;&#96;&#96;
Code block 2.
&#96;&#96;&#96;
&lt;/dd-codegroup&gt;
</pre>

```html{5-9}{example.html}
<!DOCTYPE html>
<html>
<head>
    <title>Test</title>
</head>
<body>
    <div id="message">Hello World.</div>
</body>
</html>
```

```js
// Get the element.
var $element = document.getElementById("message");
// Change the text.
$element.textContent = "Hello World!";
```

```css
body {
    background: #ffffff;
}
```
</dd-codegroup>

<dd-note title="Line highlighting/Naming" icon="info" color="aqua">
Lines in code blocks can be highlighted. The code block itself can also be named as shown below.

<pre lang="md">
&#96;&#96;&#96;LANG{LINES}{CODE_BLOCK_NAME}
CODE...
&#96;&#96;&#96;

&#96;&#96;&#96;js{1,2-7,!5}{example.js}
// This will highlight lines 1 through 7 but not 5.
&#96;&#96;&#96;

&#96;&#96;&#96;js{}{example.js}
// Only naming a code block.
&#96;&#96;&#96;

&#96;&#96;&#96;js{2,7}
// Only line highlighting.
&#96;&#96;&#96;
</pre>

<dd-codegroup tabs="JS Example;CSS Example">
```js{4}{example.js}
// Get the element.
var $element = document.getElementById("message");
// Change the text.
$element.textContent = "Hello World!";
```

```css{1-3,!2}{example.css}
body {
    background: #ffffff;
}
```
</dd-codegroup>
</dd-note>
