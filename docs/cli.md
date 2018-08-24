### Config File Path

`devdocs` will look for a `devdocs.config.js` file in the current directory the command is ran in. The following breaks down the locations `devdocs` will look for a configuration file:
1. Look in the current root directory for `./devdocs.config.js`.
2. Else look for a sub-folder (`./config/`) `./config/devdocs.config.js`.
3. Else look for a sub-folder (`./configs/`) `./configs/devdocs.config.js`.
4. If nothing is found an error is thrown.

That being said, one's project structure might be different so a configuration file path may be passed to `devdocs` from the command line.

```
$ devdocs --config path/to/devdocs.config.js

# or use the short flag...

$ devdocs -c path/to/devdocs.config.js
```

### Flag List

The following flags can used be alongside `devdocs`:

1. `--highlighter/-h`: Use `prism.js` or `highlight.js` for syntax highlighter. Defaults to `prism.js`.
2. `--debug/-d`: Show basic level debugging. Off by default.
3. `--debugfiles/-l`: Show file level debugging. Off by default.
4. `--initial/-i`: Run `devdocs` like its the first.
5. `--filter/-f`: A comma delimited string containing versions to only run `devdocs` on.
6. `--config/-c`: Sets the configuration file path, as shown above.
7. `--output/-o`: The `devdocs` output path. Uses `./devdocs/` by default.

### Flag Examples

The following examples show some flags in use:

```shell{}{example1}
# Switch the highlighter from prism.js to highlight.js,
# show both basic and file level debugging, and only 
# make documentation for version 0.0.2.

$ devdocs -h "h" -dl -f "0.0.2"
```

```shell{}{example2}
# Use prism.js for syntax highlighting, only show basic
# level debugging, and run devdocs like it's the first
# time to remove all devdocs files and start like-new.

$ devdocs -h "p" -di
```
