### Extendables

`devdocs` comes with custom Markdown syntax (`extendables`).

### Note Extendable

The `note` extendable can be used to easily include alerts, tips, warnings, etc. Basically, use it to bring attention to specific areas of your documentation.

### Note Syntax

<pre lang="html">
&lt;dd-note title="Note" color="$COLOR" icon="$ICON"&gt;
The message/text.
&lt;/dd-note&gt;
</pre>

### Note Icons/Colors

| Icons | Colors |
|---|---|
| Default `icon=""` | Default `color=""` | 
| <i class="fas fa-check-circle"></i> `icon="check"` | `color="grapefruit"`  <span style="background: #ed5565;" class="color-square"><span>
| <i class="fas fa-check-double"></i> `icon="check-double"` | `color="bittersweet"` <span style="background: #fc6e51;" class="color-square"><span>
| <i class="fas fa-info-circle"></i> `icon="info"` | `color="honeybutter"` <span style="background: #fee450;" class="color-square"><span>
| <i class="fas fa-question-circle"></i> `icon="question"` | `color="sunflower"` <span style="background: #ffce54;" class="color-square"><span>
| <i class="fas fa-times-circle"></i> `icon="error"` | `color="grass"` <span style="background: #a0d468;" class="color-square"><span>
| <i class="fas fa-exclamation-circle"></i> `icon="warning"` | `color="mint"` <span style="background: #48cfad;" class="color-square"><span>
| <i class="fas fa-plus-circle"></i> `icon="update"` | `color="sky"` <span style="background: #4fc1e9;" class="color-square"><span>
| <i class="fas fa-code"></i> `icon="code"` | `color="bluejeans"` <span style="background: #5d9cec;" class="color-square"><span>
| <i class="fas fa-file-code"></i> `icon="file"` | `color="aqua"` <span style="background: #4894f6;" class="color-square"><span>
| <i class="fas fa-external-link-square-alt"></i> `icon="link"` | `color="lavender"` <span style="background: #ac92ec;" class="color-square"><span>
| <i class="fas fa-fire"></i> `icon="fire"` | `color="pinkrose"` <span style="background: #ec87c0;" class="color-square"><span>
| <i class="fas fa-database"></i> `icon="db"` | `color="lightgray"` <span style="background: #e3e3e4;" class="color-square"><span>
| <i class="fas fa-clock"></i> `icon="clock"` | `color="mediumgray"` <span style="background: #ccd1d9;" class="color-square"><span>
| <i class="fas fa-bug"></i> `icon="bug"` | `color="darkgray"` <span style="background: #656d78;" class="color-square"><span>
| <i class="fas fa-list-ul"></i> `icon="list"` | `color="spacegray"` <span style="background: #5d687b;" class="color-square"><span>
| <i class="fas fa-list-ol"></i> `icon="list-num"` | 
| <i class="fas fa-pen"></i> `icon="pen"` | 
| <i class="fas fa-thumbtack"></i> `icon="pin"` | 
| <i class="fas fa-flask"></i> `icon="experimental"` | 
| <i class="fas fa-lock"></i> `icon="lock"` | 

<dd-expand title="Show note examples">
    <dd-note title="Title" icon="info">
    This is an example of the default coloring for the note extendable (no coloring) with the `info` icon.
    </dd-note>
    <dd-note title="Title" color="grapefruit" icon="check">This is an example note extendable using the `grapefruit` color and `check` icon.</dd-note>
    <dd-note title="Title" color="bittersweet">This is an example note extendable using the `bittersweet` color and no icon.</dd-note>
    <dd-note title="" color="honeybutter" icon="check">Not providing a title disregards the icon.</dd-note>
</dd-expand>

### Code Groups

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
