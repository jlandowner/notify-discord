import { log, z } from "./deps.ts";

export const DEFAULT_FILE_URL = new URL(
  ".notify-discord.json",
  `file://${Deno.env.get("HOME")}/`,
);

interface Config {
  "webhook-url"?: string | undefined;
  username?: string | undefined;
  "avatar-url"?: string | undefined;
}
export const schema = z.object({
  "webhook-url": z.string().url().optional(),
  username: z.string().optional(),
  "avatar-url": z.string().url().optional(),
});

interface PickConfigValueOptions {
  name: string;
  argValue?: string;
  fileValue?: string;
  default?: string;
}

function pickConfigValue(options: PickConfigValueOptions): string | undefined {
  (options.argValue && options.fileValue) &&
    log.warning(
      `${options.name} is specified in both args and config file. args value is used: ${options.argValue}`,
    );
  return options.argValue || options.fileValue || options.default;
}

interface MergeOptions {
  args: Config;
  file: Config;
}

export function merge(options: MergeOptions): Config {
  return schema.parse(
    {
      "webhook-url": pickConfigValue({
        name: "webhook-url",
        argValue: options.args["webhook-url"],
        fileValue: options.file["webhook-url"],
      }),
      username: pickConfigValue({
        name: "username",
        argValue: options.args.username,
        fileValue: options.file.username,
      }),
      "avatar-url": pickConfigValue({
        name: "avatar-url",
        argValue: options.args["avatar-url"],
        fileValue: options.file["avatar-url"],
      }),
    },
  );
}

export function loadFromFile(fileURL: URL): Config {
  const content = Deno.readTextFileSync(fileURL);
  log.debug(`config file content: ${content}`);
  return schema.parse(JSON.parse(content));
}

export function saveAsFile(fileURL: URL, config: Config) {
  Deno.writeTextFileSync(fileURL, JSON.stringify(config, null, "    "));
  log.info(`Successfully saved in ${fileURL}`);
}
