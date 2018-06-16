### Extendables

`devdocs` comes with custom Markdown syntax (`extendables`).

### Message Extendable

The `msg` extendable can be used to easily include alerts, tips, warnings, etc. Basically, to bring attention to specific areas of your documentation.

### Message Syntax

<pre lang="md">
&lbrack;msg title="Note" color="$COLOR" icon="$ICON"&rbrack;
The message/text.
[/msg]

Or...

&lbrack;msg title="Note" color="$COLOR" icon="$ICON"&rbrack;The message/text.[/msg]
</pre>

### Message Colors

Default coloring:

[msg title="Example" icon="info"]This is an example of the default coloring for the message extendable (no coloring) with the `info` icon.[/msg]

Colored:

[msg title="Example" color="grapefruit" icon="check"]This is an example message extendable using the `grapefruit` color and `check` icon.[/msg]
[msg title="Example" color="bittersweet" icon="info"]This is an example message extendable using the `bittersweet` color and `info` icon.[/msg]
[msg title="Example" color="honeybutter" icon="question"]This is an example message extendable using the `honeybutter` color and `question` icon.[/msg]
[msg title="Example" color="sunflower" icon="error"]This is an example message extendable using the `sunflower` color and `error` icon.[/msg]
[msg title="Example" color="grass" icon="warning"]This is an example message extendable using the `grass` color and `warning` icon.[/msg]
[msg title="Example" color="mint" icon="update"]This is an example message extendable using the `mint` color and `update` icon.[/msg]
[msg title="Example" color="sky" icon="code"]This is an example message extendable using the `sky` color and `code` icon.[/msg]
[msg title="Example" color="bluejeans" icon="file"]This is an example message extendable using the `bluejeans` color and `file` icon.[/msg]
[msg title="Example" color="aqua" icon="link"]This is an example message extendable using the `aqua` color and `link` icon.[/msg]
[msg title="Example" color="lavender"]This is an example message extendable using the `lavender` color and no icon.[/msg]
[msg title="Example" color="pinkrose"]This is an example message extendable using the `pinkrose` color and no icon.[/msg]
[msg title="Example" color="lightgray"]This is an example message extendable using the `lightgray` color and no icon.[/msg]
[msg title="Example" color="mediumgray"]This is an example message extendable using the `mediumgray` color and no icon.[/msg]
[msg title="Example" color="darkgray"]This is an example message extendable using the `darkgray` color and no icon.[/msg]
[msg title="Example" color="spacegray"]This is an example message extendable using the `spacegray` color and no icon.[/msg]
[msg title="" color="grapefruit" icon="check"]Not providing a title disregards the icon.[/msg]
[msg title="" color="grass" icon="info"]Not providing a title disregards the icon.[/msg]
