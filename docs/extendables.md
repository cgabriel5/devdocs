### Extendables

`devdocs` comes with custom Markdown syntax (`extendables`).

### Message Extendable

The `note` extendable can be used to easily include alerts, tips, warnings, etc. Basically, to bring attention to specific areas of your documentation.

### Message Syntax

<pre lang="md">
&lbrack;note title="Note" color="$COLOR" icon="$ICON"&rbrack;
The message/text.
[/note]

Or...

&lbrack;note title="Note" color="$COLOR" icon="$ICON"&rbrack;The message/text.[/note]
</pre>

### Message Colors

Default coloring:

[note title="Example" icon="info"]This is an example of the default coloring for the message extendable (no coloring) with the `info` icon.[/note]

[expand title="Show colored examples"]
[note title="Example" color="grapefruit" icon="check"]This is an example message extendable using the `grapefruit` color and `check` icon.[/note]
[note title="Example" color="bittersweet" icon="info"]This is an example message extendable using the `bittersweet` color and `info` icon.[/note]
[note title="Example" color="honeybutter" icon="question"]This is an example message extendable using the `honeybutter` color and `question` icon.[/note]
[note title="Example" color="sunflower" icon="error"]This is an example message extendable using the `sunflower` color and `error` icon.[/note]
[note title="Example" color="grass" icon="warning"]This is an example message extendable using the `grass` color and `warning` icon.[/note]
[note title="Example" color="mint" icon="update"]This is an example message extendable using the `mint` color and `update` icon.[/note]
[note title="Example" color="sky" icon="code"]This is an example message extendable using the `sky` color and `code` icon.[/note]
[note title="Example" color="bluejeans" icon="file"]This is an example message extendable using the `bluejeans` color and `file` icon.[/note]
[note title="Example" color="aqua" icon="link"]This is an example message extendable using the `aqua` color and `link` icon.[/note]
[note title="Example" color="lavender"]This is an example message extendable using the `lavender` color and no icon.[/note]
[note title="Example" color="pinkrose"]This is an example message extendable using the `pinkrose` color and no icon.[/note]
[note title="Example" color="lightgray"]This is an example message extendable using the `lightgray` color and no icon.[/note]
[note title="Example" color="mediumgray"]This is an example message extendable using the `mediumgray` color and no icon.[/note]
[note title="Example" color="darkgray"]This is an example message extendable using the `darkgray` color and no icon.[/note]
[note title="Example" color="spacegray"]This is an example message extendable using the `spacegray` color and no icon.[/note]
[note title="" color="grapefruit" icon="check"]Not providing a title disregards the icon.[/note]
[note title="" color="grass" icon="info"]Not providing a title disregards the icon.[/note]
[/expand]

### Code groups

Code blocks can be grouped together then toggled via tabs.

[codegroup tabs="Syntax;HTML;JS;CSS"]
<pre lang="md">
&lbrack;codegroup tabs="1stTabName;NthTabName"&rbrack;
&grave;&grave;&grave;&InvisibleComma;
Code block 1.
&grave;&grave;&grave;&InvisibleComma;

&grave;&grave;&grave;&InvisibleComma;
Code block 2.
&grave;&grave;&grave;&InvisibleComma;
&lbrack;/codegroup&rbrack;
</pre>

```html{9}{example.html}
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
[/codegroup]

[note title="Line highlighting/Naming" icon="info" color="aqua"]
Lines in code blocks can be highlighted. The code block itself can also be named as shown below.

<pre lang="md">
&grave;&grave;&grave;js{1,2-7,!5}{example.js}
// This will highlight lines 1 through 7 but not 5.
&grave;&grave;&grave;&InvisibleComma;

&grave;&grave;&grave;js{}{example.js}
// Only naming a code block.
&grave;&grave;&grave;&InvisibleComma;

&grave;&grave;&grave;js{2,7}
// Only line highlighting.
&grave;&grave;&grave;&InvisibleComma;
</pre>

[codegroup tabs="JS Example;CSS Example"]
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
[/codegroup]
[/note]
