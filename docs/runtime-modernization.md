# Runtime and toolchain maintenance

The October 22, 2026 maintenance branch uses Node 24.22.1 and npm 12.2.1.
`.nvmrc`, npm `devEngines`, CI and the Docker toolchain stage agree. The runtime
image stays on Debian Bookworm and starts Node directly. `.npmrc` fails clean
installs when a dependency script has no recorded decision. The unrs-resolver
postinstall fallback is denied: its platform-specific optional package supplies
the native binary, verified after a clean install. Review each new version before
changing the exact `allowScripts` decision.

## Application and CSS

Next 16.4.2, React/DOM 19.3.1, Sharp 0.35.5 and sanitize-html 2.18.1 contain the
reviewed security fixes. Tailwind 4.3.3 uses `@tailwindcss/postcss` and
`tailwind-merge` 3.7.0. The explicit `@config` in `app/globals.css` retains the
existing typed theme, typography sizes and class-based dark mode. The migration
keeps the former shadow, outline and gradient appearance and handles individual
transform properties in menu transitions and reduced-motion resets.

`verify:tailwind-css` compiles the real stylesheet and checks theme values,
prose, forced-colors focus, class merging and the mobile/desktop card heights.
The last check covers a defect in the automatic upgrader that moved the desktop
height outside its media query. The three ads pages share this migration.
Tailwind 4's browser baseline is Safari 16.4+, Chrome 111+ and Firefox 128+.

A scoped `postcss-selector-parser` 7.1.7 override patches typography's older
transitive dependency. Its parser calls and generated prose output were checked;
the v7 change to insertion iteration does not affect typography's call pattern.
The obsolete Sharp override and unused `@eslint/eslintrc` override are removed.
Snapshot validation now maps the validated filenames to explicitly scoped paths,
avoiding Turbopack's whole-project file tracing while retaining every hash check.
The native Node glob API replaces this project's direct fast-glob uses. Route
inventories and generated sitemaps retain the same exclusion rules.

## Lint and type checking

ESLint 10 uses supported React, import and accessibility replacements. The
contract is covered by `verify:lint-contract` with negative/positive fixtures.

| Previous check | Current owner |
| --- | --- |
| React keys, display names and JSX comment text | `@eslint-react` explicit rules |
| Children props and children with inner HTML | `@eslint-react` explicit rules |
| Deprecated DOM rendering APIs | `@eslint-react` DOM rules and React 19 types |
| Class lifecycle/state safety | Function components enforced by `no-class-component`; none existed in the application |
| Duplicate/undefined JSX props or components; string refs | TypeScript checks, including failing contract fixtures |
| JSX variable references | ESLint 10's JSX scope support |
| Unescaped JSX text | Small local rule preserving the previous check |
| Anonymous default exports | `eslint-plugin-import-x` |
| All six configured accessibility rules and Next Image alt mapping | `eslint-plugin-jsx-a11y-x`, with failing fixtures for each |
| Rules of Hooks and exhaustive dependencies | `eslint-plugin-react-hooks`, retaining prior severities |

The standard parser handles JavaScript and CommonJS. The private Next Babel
parser is no longer required. The previous disabled prop-types, legacy React
import, unknown-property and external-target checks remain outside this rule set.

`typescript` is the supported `@typescript/typescript6` 6.0.2 compatibility
wrapper, whose locked compiler API is 6.0.3. Existing transpilation verifiers and
Next's language-service/build integration keep that API. The alias
`@typescript/native` supplies TypeScript 7.0.2's `tsc`. Run both `typecheck` and
`typecheck:compat`; generated Next route types are included after a production
build. CI first runs both compilers against the checkout's source. Then
`verify:deployment-builds` runs each compiler again after each synthetic Next
build (releases A and B), in that build's isolated root. It requires nonempty
`.next/types/routes.d.ts` and `.next/types/validator.ts`; the root's `tsconfig.json`
includes these generated declarations and route/page validators. Both compiler
checks disable incremental reuse and share the build's synthetic environment,
so CI covers generated route types without CMS credentials or developer artifacts.

## Rendering experiment decisions

Cache Components and Partial Prefetching remain disabled. Their finite cache
lifetime and lack of `dynamicParams=false` do not preserve the required zero-ISR
and zero-on-demand-fallback contract. The existing sealed snapshot, static
prerender inventory and runtime-network rejection checks remain authoritative.
An architecture change must establish equivalent output and cache guarantees
before changing those invariants.

The stable React Compiler was evaluated through its current Hooks diagnostics.
Existing mount-time hydration, browser-state synchronization, a memoized renderer
and DOM scroll-lock handling produce additional diagnostics. These new checks
remain visible as 26 warnings (21 effect updates, three memoization and two DOM
mutation diagnostics); existing Hooks rules remain strict. `lint:compiler`
requires zero warnings and is the explicit gate before enabling compilation.
Neither the stable compiler nor the experimental Rust compiler is enabled.
The stable compiler package is available for a scoped trial after those findings
are resolved. No production performance benefit was demonstrated for the Rust,
disk-cache, lazy-import or worker-thread experiments, so none is enabled.

## Verification and remaining release checks

The maintenance candidate passed clean npm 12 installation, both compilers,
replacement lint fixtures, the existing synthetic verifier suites, the two-release
production fixture test and a credentialed production Turbopack build. The real
build/runtime test verified 460 routes, RSC/resource results, unknown-slug 404s,
closed inventories, retired revalidation and cold restarts without CMS access.

The remaining npm audit chain is Next's development-only lint plugin → fast-glob
→ micromatch → braces. No patched braces version is available in the reviewed
registry. Do not accept audit's suggested downgrade to the Next 14 lint plugin.
The production-only dependency audit has no reported vulnerabilities.

Deployment remains a separate action. Retain the prior complete image and its
sealed content bundle for rollback. Localhost cannot complete a production-bound
Turnstile challenge; real lead submission, analytics attribution and control-plane
changes are outside these local checks. A browser review must account for the
Tailwind browser baseline and externally loaded maps/video/CAPTCHA behavior.

References: [Tailwind upgrade guide](https://tailwindcss.com/docs/upgrade-guide),
[ESLint 10 migration](https://eslint.org/docs/latest/use/migrate-to-10.0.0),
[TypeScript coexistence](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/),
[selector parser changelog](https://github.com/postcss/postcss-selector-parser/blob/main/CHANGELOG.md),
[Next security update](https://nextjs.org/blog/nextjs-security-update-october-14-2026).
