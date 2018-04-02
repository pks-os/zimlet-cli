[![CircleCI](https://circleci.com/gh/Zimbra/zimlet-cli.svg?style=shield&circle-token=770fdb94c5adb3ca436855b59c752a77fc4e7fed)](https://circleci.com/gh/Zimbra/zimlet-cli)
[![NPM Downloads](https://img.shields.io/npm/dm/@zimbra/zimlet-cli.svg?style=flat)](https://www.npmjs.com/package/@zimbra/zimlet-cli) [![NPM Version](https://img.shields.io/npm/v/@zimbra/zimlet-cli.svg?style=flat)](https://www.npmjs.com/package/@zimbra/zimlet-cli)

# Zimlet CLI

A command-line build tool for next generation Zimlets, powered by Webpack.

### Install

```sh
npm install -g @zimbra/zimlet-cli
```

### Usage

```sh
zimlet
```

Run the `zimlet` command by itself to see all available options. ZimletCLI makes it easy to get help with the `--help` option available for all commands.

### Documentation
See the [full documentation on the github wiki](https://github.com/Zimbra/zimlet-cli/wiki). Topics include documentation for [commands options](https://github.com/Zimbra/zimlet-cli/wiki/CLI-Commands), [getting started guides](https://github.com/Zimbra/zimlet-cli/wiki/Setup-A-Development-Environment), and more.

> :warning: Make sure to accept any self signed certificates generated by the `zimlet watch` command.

> :warning: The Zimlet is evaluated in a seperate window with a clean environment. This means common global values like `window.location` will not be available. Instead, many global values are available in the Redux store.

---

## Hacking on the CLI

Want to work on the CLI? It's easy:

```
# get into this directory:
cd zimlet-cli

# install the dependencies:
npm install

# now any time you change src/ in the CLI package,
# (re-)link your build of the CLI globally:
npm link
```

Doing the above (and repeating the last step for any change to the CLI's source) will introduce a `zimlet` command globally.

## Custom Configuration

#### Webpack

To customize webpack create a `zimlet.config.js` file in the root of your Zimlet which exports a function that will change webpack's config. To use a file other than `zimlet.config.js`, set a custom path as `env.config`.

```js
/**
 * Function that mutates original webpack config.
 *
 * @param {object} config - original webpack config.
 * @param {object} env - options passed to CLI.
 **/
export default function (config, env) {
  /** you can change config here **/
}
```
