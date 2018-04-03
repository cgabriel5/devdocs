### CLI Usage

`devdocs` will programmatically look for a `devdocs.config.js` file in the current directory the command is ran in. The following breaks down the locations `devdocs` will look for a configuration file:
1. Look in the current root directory for `./devdocs.config.js`.
2. Else look for a sub-folder `./config/devdocs.config.js`.
3. Else look for a sub-folder `./configs/devdocs.config.js`.
4. If nothing is found an error is thrown.

That being said, one's project structure might be different, so a configuration file path may be passed to `devdocs`.

```
$ devdocs --config path/to/devdocs.config.js

# or use the short flag...

$ devdocs -c path/to/devdocs.config.js
```
