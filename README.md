[![Release](https://img.shields.io/npm/v/eslint-plugin-postcss-modules.svg)](https://www.npmjs.com/package/eslint-plugin-postcss-modules)
[![Build Status](https://travis-ci.com/bmatcuk/eslint-plugin-postcss-modules.svg?branch=master)](https://travis-ci.com/bmatcuk/eslint-plugin-postcss-modules)
[![codecov.io](https://img.shields.io/codecov/c/github/bmatcuk/eslint-plugin-postcss-modules.svg?branch=master)](https://codecov.io/github/bmatcuk/eslint-plugin-postcss-modules?branch=master)

# eslint-plugin-postcss-modules
Like [eslint-plugin-css-modules], this plugin helps you lint your css modules.
It adds a new eslint rule that detects if you are trying to use a class that is
not exported by your css module.

The major difference between this plugin and the aforementioned plugin is that
this plugin uses [postcss] to parse the css files and determine what classes
are exported. There are a couple of benefits to this:

1. Under the hood, [css-loader] is also using postcss with a few plugins to
   determine which classes are exported. This plugin uses the same group of
   plugins to guarantee that the classes that are linted are the same as the
   classes css-loader exports.
2. Through plugins, postcss can handle a variety of complex input css files.
   While eslint-plugin-css-modules has excellent support for most major css
   grammars (such as sass), it does not support all of the inputs that postcss
   can handle and probably never will. If you are using postcss for your
   project, chances are good that eslint-plugin-css-modules will choke on your
   files.

The downside is that, while postcss is very battle-tested and fast for
_building_ css, it _may_ be slower than eslint-plugin-css-modules for linting
purposes. I don't have benchmarks, but welcome them.

## Installation
```bash
yarn add -D eslint-plugin-postcss-modules
npm install -D eslint-plugin-postcss-modules
```

## Usage
In your eslint config:
```json
{
  "extends": [
    "plugin:postcss-modules/recommended"
  ],
}
```

The recommended configuration will set `no-undef-class` to errors and
`no-unused-class` to warnings. The recommended configuration is equivalent to:
```json
{
  "plugins": ["postcss-modules"],
  "rules": {
    "postcss-modules/no-undef-class": "error",
    "postcss-modules/no-unused-class": "warn"
  }
}
```

### Settings
There are a couple settings you can tweak in your eslint config. Below are
examples of the options and their default values:
```json
{
  "settings": {
    "postcss-modules": {
      "postcssConfigDir": "cwd",
      "baseDir": "cwd",
      "camelCase": false,
      "defaultScope": "local",
      "include": "**/*.css",
      "exclude": "**/node_modules/**/*"
    }
  }
}
```

* **postcssConfigDir** _(default: cwd)_
  > _postcssConfigDir_ sets the starting point to search for the postcss config
  > file, as determined by [postcss-load-config]. Searching will start with
  > this directory and work its way up recursively until it finds a config file
  > or hits your home directory. See [cosmiconfig] for more info.
  >
  > I recommend that you create a pared down version of your postcss config
  > that only includes plugins that could affect the structure of the file and
  > the class names that might be exported in order to reduce the amount of
  > time linting takes. For example, postcss-preset-env is really a collection
  > of plugins under the hood. The only plugins that affect the structure and
  > classes that would be exported are probably postcss-custom-selectors and
  > postcss-nesting.

* **baseDir** _(default: cwd)_
  > _baseDir_ is used to resolve imports to your css files. If the import is
  > relative (ie, starts with `./`), the path of the current file will be used
  > to resolve the import. However, if the import is not relative, this
  > _baseDir_ will be used to resolve the path.

* **camelCase** _(default: `false`)_
  > The _camelCase_ option should match the [camelCase option] or
  > [localsConvention option] that you have set for css-loader, depending on
  > which version you are using. Here's a description of the options and what
  > they do:

  | option                        | description                                                              |
  | ----------------------------- | ------------------------------------------------------------------------ |
  | `false` or `"asIs"`           | Do not camelCase exported classes                                        |
  | `true` or `"camelCase"`       | Export both the original class name and the camelCased version           |
  | `"camelCaseOnly"` or `"only"` | Export only the camelCased class names                                   |
  | `"dashes"`                    | Convert dashed-names to camelCase and export both                        |
  | `"dashesOnly"`                | Convert dashed-names to camelCase and only export the camelCased version |

* **defaultScope** _(default: `"local"`)_
  > The _defaultScope_ option determines scope (global or local) of any css
  > classes which are not explicitly declared as being global or local using
  > `:global` or `:local`. The default is `"local"`.

* **include** _(default: `"**/*.css"`)_
  > An [anymatch] matcher to determine what files should be parsed for
  > css-module exports. Any file which matches _include_ but does not match
  > _exclude_ will be parsed. Note that due to the way eslint combines
  > settings, you cannot use a regex here.

* **exclude** _(default: `"**/node_modules/**/*"`)_
  > An [anymatch] matcher to determine what files should _not_ be parsed for
  > css-module exports. Any file which matches _include_ but does not match
  > _exclude_ will be parsed. Note that due to the way eslint combines
  > settings, you cannot use a regex here.

[anymatch]: https://github.com/micromatch/anymatch
[camelCase option]: https://github.com/webpack-contrib/css-loader/tree/v2.1.1#camelcase
[cosmiconfig]: https://github.com/davidtheclark/cosmiconfig
[css-loader]: https://github.com/webpack-contrib/css-loader
[eslint-plugin-css-modules]: https://github.com/atfzl/eslint-plugin-css-modules
[localsConvention option]: https://github.com/webpack-contrib/css-loader/tree/v3.0.0#localsconvention
[postcss]: https://postcss.org/
[postcss-load-config]: https://github.com/michael-ciniawsky/postcss-load-config
