const versionFile = Deno.args[0];
const version = Deno.args[1];

Deno.writeTextFileSync(versionFile, `export const version = "${version}";\n`);
