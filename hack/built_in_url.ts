/**
 * Called by `deno task built-in-url`
 */
const urlFile = Deno.args[0];
const url = Deno.args[1] || "BUILTIN_URL_UNDEFINIED";

Deno.writeTextFileSync(
  urlFile,
  `/**
 * Auto-gen: built_in_url.ts
 */
export const builtInWebhookUrl = "${url}";
`,
);
