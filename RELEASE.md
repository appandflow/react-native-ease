# Release process

This repository publishes one npm package, `react-native-ease`. The example and
documentation site are not published to npm. Keep this document aligned with
[the Release workflow](.github/workflows/release.yml).

## One-time trusted-publisher setup

Configure a GitHub Actions trusted publisher in the npm package settings:

| Field             | Value                                |
| ----------------- | ------------------------------------ |
| Organization      | `appandflow`                         |
| Repository        | `react-native-ease`                  |
| Workflow filename | `release.yml`                        |
| Environment       | `release`                            |
| Allowed action    | Direct publishing with `npm publish` |

The workflow uses npm's OpenID Connect integration and does not need an npm
write token. It publishes with Node 24 and npm provenance. See
[npm's trusted publishing guide](https://docs.npmjs.com/trusted-publishers/).

Create the GitHub `release` environment, require a maintainer review, and limit
deployment tags to `v*`. Declaring the environment in the workflow does not
create its protection rules, and the npm trust relationship must also be
configured separately.

## Prepare and verify a candidate

Start from reviewed, current `main`. Check npm before choosing a version; a Git
tag or GitHub release does not prove that a package was published.

```sh
git fetch origin --tags
npm view react-native-ease dist-tags --json
npm view react-native-ease versions --json
```

Use semantic versions. Prereleases such as `X.Y.Z-beta.N` publish to `next`;
stable versions publish to `latest`.

Run the package checks before starting `release-it`:

```sh
yarn install --immutable
yarn format:write
yarn lint
yarn test
yarn build
rm -rf artifacts
mkdir artifacts
npm pack --pack-destination artifacts
node scripts/check-package.mjs artifacts/react-native-ease-X.Y.Z.tgz
node scripts/check-release.mjs vX.Y.Z
```

CI also builds the Android, iOS, and tvOS examples. Device behavior affected by
the release still needs device validation.

## Tag and publish

1. Run `yarn release X.Y.Z` from current `main`. `release-it` creates the release
   commit and immutable `vX.Y.Z` tag, pushes them, and creates the GitHub release.
   It does not publish to npm locally.
2. The tag starts the Release workflow. It reruns the complete CI suite for the
   exact tag, builds and validates the npm tarball, and rejects a tag that differs
   from `package.json` or is not contained in `origin/main`.
3. Review the checks and approve the protected `release` environment. The
   publish job downloads and publishes the exact tarball verified by the package
   job with npm provenance.
4. Confirm the package version, integrity, and dist-tag:

   ```sh
   npm view react-native-ease@X.Y.Z version dist.integrity --json
   npm view react-native-ease dist-tags --json
   ```

The workflow safely skips an already-published version only when the registry's
integrity matches the candidate tarball. A rerun for an older version does not
move a newer dist-tag backward.

## Recovery

- If authentication fails, verify the npm publisher's organization, repository,
  workflow filename, and environment. Do not add a long-lived npm token as a
  workaround.
- Retry a failed publish with `gh run rerun RUN_ID --failed`. This reuses the
  inspected tarball, retained for seven days, without repeating native CI.
- npm processing can take several minutes. The workflow allows approximately
  ten minutes for verification after acceptance. If verification times out,
  inspect the exact npm version before retrying with the same artifact.
- If the artifact has expired, rerun all jobs. A rerun uses the original workflow
  revision, including its checkout and scripts. Merging a workflow fix does not
  update an existing run.
- Never move an already-published tag. npm versions cannot be overwritten;
  publish a new version for corrections to a published package.
- An existing version is skipped only when its integrity matches the saved
  tarball. This does not change `latest` or `next`.

Adding this workflow does not publish anything. Publication requires a matching
`v*` tag push, successful CI, and approval of the protected release environment.
