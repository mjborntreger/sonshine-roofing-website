import assert from 'node:assert/strict';
import path from 'node:path';
import { ESLint } from 'eslint';
import ts from 'typescript';

const eslint = new ESLint();
const fixtures = [
  ['@eslint-react/no-missing-key', 'export default function Example(){return [1,2].map(n => <span>{n}</span>)}'],
  ['@eslint-react/no-missing-component-display-name', 'import {memo} from "react"; export const Example=memo(() => <div />)'],
  ['@eslint-react/jsx-no-comment-textnodes', 'export default function Example(){return <div>// comment</div>}'],
  ['@eslint-react/jsx-no-children-prop', 'export default function Example(){return <div children="text" />}'],
  ['@eslint-react/dom-no-dangerously-set-innerhtml-with-children', 'export default function Example(){return <div dangerouslySetInnerHTML={{__html:"x"}}>text</div>}'],
  ['sonshine/no-unescaped-entities', 'export default function Example(){return <div>isn\'t</div>}'],
  ['import-x/no-anonymous-default-export', 'export default {}'],
  ['jsx-a11y-x/alt-text', 'import Image from "next/image"; export default function Example(){return <Image src="/test.png" width={20} height={20} />}'],
  ['jsx-a11y-x/aria-props', 'export default function Example(){return <div aria-unknown="x" />}'],
  ['jsx-a11y-x/aria-proptypes', 'export default function Example(){return <div aria-hidden="invalid" />}'],
  ['jsx-a11y-x/aria-unsupported-elements', 'export default function Example(){return <meta aria-label="test" />}'],
  ['jsx-a11y-x/role-has-required-aria-props', 'export default function Example(){return <div role="checkbox" />}'],
  ['jsx-a11y-x/role-supports-aria-props', 'export default function Example(){return <div role="button" aria-checked="true" />}'],
  ['react-hooks/rules-of-hooks', 'import {useState} from "react"; export default function Example({show}){if(show)useState(0);return null}'],
];
for (const [rule, source] of fixtures) {
  const [result] = await eslint.lintText(source, { filePath: 'components/lint-contract-fixture.tsx' });
  assert.ok(result.messages.some(message => message.ruleId === rule), `${rule} did not reject its negative fixture`);
}
const [valid] = await eslint.lintText('import Image from "next/image"; export default function Example(){return <><Image src="/test.png" alt="Test" width={20} height={20} />{[1,2].map(n => <span key={n}>{n}</span>)}<button aria-pressed={false}>Toggle</button><p>isn&apos;t</p></>}', { filePath: 'components/lint-contract-fixture.tsx' });
assert.deepEqual(valid.messages, [], 'Valid typed React/accessibility fixture must pass');

// TypeScript owns duplicate/undefined props and refs after the React plugin move.
const filename = path.resolve('components/lint-contract-types.tsx');
const source = 'const a = <div id="a" id="b" />; const b = <MissingComponent />; const c = <div ref="legacy" />;';
const options = { noEmit: true, strict: true, skipLibCheck: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, types: ['node', 'react'] };
const host = ts.createCompilerHost(options);
const original = host.getSourceFile.bind(host);
host.getSourceFile = (file, ...args) => file === filename ? ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX) : original(file, ...args);
const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([filename], options, host));
for (const code of [17001, 2304, 2322]) assert.ok(diagnostics.some(diagnostic => diagnostic.code === code), `TypeScript diagnostic ${code} must remain active`);
for (const filename of ['scripts/prebuild.mjs', 'scripts/codex-fetch-proxy.cjs', 'components/ui/button.tsx']) {
  const config = await eslint.calculateConfigForFile(filename);
  assert.ok(config.rules['@next/next/no-html-link-for-pages'], `${filename}: Next rules missing`);
  if (filename.endsWith('.cjs')) assert.equal(config.languageOptions.sourceType, 'commonjs');
}
console.log(`Verified ${fixtures.length} negative lint fixtures, positive JSX, three TypeScript contracts and representative file configs.`);
