# Third-party notices

This is an unofficial source-based frontend adaptation, not an official T3 Code distribution. No complete T3 application or original ASAR is included.

## T3 Code and telemetry sources

- [pingdotgg/t3code](https://github.com/pingdotgg/t3code), native reference `59651c1761f6`, Copyright (c) 2026 T3 Tools Inc., MIT. [Full license](<licenses/T3-Code-MIT.txt>).
- [nanami-0713/t3code](https://github.com/nanami-0713/t3code), telemetry commit `d1bb533d9b69165ce94f1add52f9dcb53dd15684`, Copyright (c) 2026 T3 Tools Inc., MIT. [Preserved upstream license](<vendor/nanami-telemetry-d1bb533/LICENSE>).
- [Leobai03/t3code-quota-ui](https://github.com/Leobai03/t3code-quota-ui), reference v1.4.6 / `bc64236511ee61dae9b75beef3ea0275eb71b2dd`, Copyright (c) 2026 Leobai03, MIT. [Preserved license and upstream attributions](<licenses/Leobai03-MIT.txt>). The previously obtained license snapshot is retained; the upstream public repository/raw license URLs returned HTTP 404 when this release was prepared. This is not presented as a successful fresh upstream download.

Source excerpts, generated frontend payload and adapted template code retain their respective upstream rights. Component names/provider brands remain their owners' marks; no affiliation is implied.

## Build and bundled UI dependencies

[Dependency inventory](<licenses/dependency-inventory.json>) records the resolved packages and copied license/notice files. The [license directory](<licenses/dependencies/>) includes Base UI, Floating UI, lucide-react, class-variance-authority, clsx, tailwind-merge, Tailwind, TypeScript, esbuild and transitive dependencies available in the locked build. Icon attributions in lucide-react's license are retained. Some dependencies are build-only rather than bundled.

`@esbuild/win32-x64` is the esbuild project's platform binary (MIT); its package omits a separate license text. See the preserved [esbuild MIT license](<licenses/dependencies/esbuild/LICENSE.md>). It is not included in Git or the downloadable ZIP.

React, ReactDOM and native network/DateTime imports resolve to the user's existing T3 runtime, not a second bundled React installation. The application remains responsible for licenses of its unchanged native runtime. No original native frontend bundle is shipped as a standalone build input; developers supply their own exact original ASAR.
