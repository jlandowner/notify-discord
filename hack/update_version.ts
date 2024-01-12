/**
 * Called by `deno task update-version`
 */
const versionFile = Deno.args[0];
const version = Deno.args[1];

Deno.writeTextFileSync(
  versionFile,
  `/**
 * Auto-gen: update_version.ts
 */
export const version = "${version}";
`,
);
