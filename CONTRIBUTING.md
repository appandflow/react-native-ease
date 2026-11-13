# Contributing

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## Development workflow

This project is a monorepo managed using [Yarn workspaces](https://yarnpkg.com/features/workspaces). It contains the following packages:

- The library package in the root directory.
- An example app in the `example/` directory.

To get started with the project, make sure you have the correct version of [Node.js](https://nodejs.org/) installed. See the [`.nvmrc`](./.nvmrc) file for the version used in this project.

Run `yarn` in the root directory to install the required dependencies for each package:

```sh
yarn
```

> Since the project relies on Yarn workspaces, you cannot use [`npm`](https://github.com/npm/cli) for development without manually migrating.

The [example app](/example/) demonstrates usage of the library. You need to run it to test any changes you make.

It is configured to use the local version of the library, so any changes you make to the library's source code will be reflected in the example app. Changes to the library's JavaScript code will be reflected in the example app without a rebuild, but native code changes will require a rebuild of the example app.

If you want to use Android Studio or Xcode to edit the native code, you can open the `example/android` or `example/ios` directories respectively in those editors. To edit the Objective-C or Swift files, open `example/ios/EaseExample.xcworkspace` in Xcode and find the source files at `Pods > Development Pods > react-native-ease`.

To edit the Java or Kotlin files, open `example/android` in Android studio and find the source files at `react-native-ease` under `Android`.

You can use various commands from the root directory to work with the project.

To start the example app packager:

```sh
yarn example start
```

To run the example app on Android:

```sh
yarn example android
```

To run the example app on iOS:

```sh
yarn example ios
```

To run linting and type checks:

```sh
yarn lint
```

To check formatting:

```sh
yarn format:check
```

#### clang-format on Linux arm64

The `clang-format` npm package only bundles binaries for macOS, Linux x64 and Windows. `scripts/clang-format.mjs` (used by `yarn format:*`) runs the bundled binary when there is one, and otherwise falls back to a native binary:

1. the binary at `CLANG_FORMAT_BINARY`, if that variable is set (it takes priority on every platform), otherwise
2. the bundled binary for your platform, otherwise
3. the first native `clang-format` executable on your `PATH`.

Install version 13.0.1, which matches the bundled binaries (other versions format differently, and a warning is printed if the version of a non-bundled binary does not match):

```sh
pip install clang-format==13.0.1
```

### Scripts

The root `package.json` contains these common scripts:

- `yarn`: install dependencies for the workspace.
- `yarn format:check`: check Prettier and clang-format.
- `yarn format:write`: write Prettier and clang-format fixes.
- `yarn lint`: run ESLint and TypeScript checks for the library and example app.
- `yarn test`: run the Jest test suite.
- `yarn prepare`: build the library with `react-native-builder-bob`.
- `yarn example start`: start the Metro server for the example app.
- `yarn example ios`: run the example app on iOS.
- `yarn example android`: run the example app on Android.

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that formatting, linting, tests, and any relevant example app checks are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.
