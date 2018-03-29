# Setup

Run the following command to start project setup:

```
$ yarn install && gulp -f gulpfile-setup.js init
```

**Note**: Setup question answers will be used to ready project files (i.e. fill template placeholders). Although two Gulpfiles initially exist ([`gulpfile-main.js`](/gulpfile-main.js) & [`gulpfile-setup.js`](/gulpfile-setup.js)) once project setup is completed only one file called `gulpfile.js` will exist. Therefore, setup will remove all unneeded setup files.

Once complete run the following command and start developing!

```
$ gulp
```

Project Gulp commands and their documentation can be found [here](/docs/commands.md).
