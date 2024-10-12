# create-gnome-extension

`create-gnome-extension` is a community maintained scaffolding tool to build GNOME Shell extensions.

## Developing a GNOME Shell extension

To get started with developing GNOME Shell extensions, visit [gjs.guide](https://gjs.guide/extensions/). It has tutorials and guides written by the GNOME community.

If you need more help, you can use the following channels

-   [Discourse](https://discourse.gnome.org/tag/extensions)
-   [Matrix](https://matrix.to/#/#extensions:gnome.org)
-   [StackOverflow](https://stackoverflow.com/questions/tagged/gnome-shell-extensions+gjs)

## Usage

To use `create-gnome-extension` run the following command in a terminal.

```sh
npm create gnome-extension@latest
```

You will be asked some questions to determine which files to include in your project.

## Project Structure

The following file structure will be created when running `npm create gnome-extension`. Depending on the options passed to create-gnome-extension, some files may not be included in your project.

```
project-directory/
├── data/
├── po/ [missing]
├── scripts/
│   ├── build.sh
│   ├── install.sh
│   ├── new.sh
│   ├── publish.sh
│   └── save.sh
├── src/
│   ├── assets/*
│   ├── schemas/
│   │   └── org.gnome.shell.extensions.gva.gschema.xml
│   ├── extension.js
│   ├── md2pango.js
│   ├── prefs.js
|   └── stylesheet.css
├── .editorconfig
├── .gitignore
├── eslint.config.js
├── metadata.json
├── metadata.json
├── package.json
├── prettier.config.js
└── README.md
```

-   `data/` contains files that will be bundled into a [GResource](https://docs.gtk.org/gio/struct.Resource.html) file when building your extension.
-   `po/` contains files for the [translation of your project](https://gjs.guide/extensions/development/translations.html). The template file (`*.pot`) lists all translatable strings. Translators will use this template to create translation files (`*.po`).
-   `scripts/` consists of scripts to build and install your extension. The scripts have `--help` flags. They can also be called via the npm scripts in `package.json`.
-   `src/` is where the actual source code of your extension will reside. `extension.js` is the main entry point, `prefs.js` is the entry point for your preference window, `md2pango.js` is a helper script to render Markdown in Pango, and `stylesheet.css` is a CSS file for styling your extension.
-   `.editorconfig` provides configuration for editors.
-   `eslint.config.js` provides configuration for the ESLint code linter.
-   `metadata.json` provides information about your extension for GNOME Shell's extension system.
-   `package.json` contains information about your project, including dependencies and scripts.
-   `prettier.config.js` provides configuration for the Prettier code formatter.
-   `README.md` is a file that describes this project.

Other files may be included but they aren't directly related to extension development.

## License

This software is distributed under the terms of the GNU General Public License, version 2 or later. See the license file for details.
