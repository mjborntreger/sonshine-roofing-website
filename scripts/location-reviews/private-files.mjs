export { PRIVATE_ROOT, readPrivate as readPrivateJson, writePrivate as writePrivateJson } from '../location-migration/io.mjs';
export function argumentsFor(argv) {
  if (argv.length % 2) throw new Error('Arguments must be --name value pairs');
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    if (!argv[index].startsWith('--') || result[argv[index].slice(2)] !== undefined) throw new Error('Invalid or duplicate argument');
    result[argv[index].slice(2)] = argv[index + 1];
  }
  return result;
}
