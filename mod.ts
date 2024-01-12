import { log, parseArgs, z } from "./deps.ts";
import * as cfg from "./config.ts";
import { version } from "./version.ts";
import { iso8601 } from "./iso8601.ts";

const VERSION_MESSAGE = `notify-discord - ${version} jlandowner 2024`;

const HELP_MESSAGE =
  `notify-discord - post messages to Discord channel by webhook

Usage:
  notify-discord <message>
  echo <message> | notify-discord

Options:
  --code-block <LANGUAGE>      : Enclose markdown code block with language (default: disabled)
  --save-config                : Save config options in a config file
  --config <CONFIG_FILE_PATH>  : Config file path (defualt: $HOME/.notify-discord.json)
  --debug                      : Debug mode (default: false)
  --help                       : Show help
  --version                    : Show version

Config options:
  --webhook-url <WEBHOOK_URL>  : Discord's webhook URL
  --output      [text, json]   : Output format (default: text)
  --username    <USERNAME>     : Override Discord's webhook username (default: configured in Discord webhook setting page)
  --avatar-url  <AVATER_URL>   : Override Discord's webhook avator icon URL (default: configured in Discord webhook setting page)

Configuration file:
  You can save the config options in a config file to change the default behavior.
    notify-discord --save-config --output json --username GitHub --avatar-url https://github.com/github.png
  
  When the config options are found in args and file, args values are used.

  NOTE:
    When you installed this command by "deno install" or "deno compile" with args of config options,
    the options specified at install or compile time are ALWAYS used even if you pass no options in execution time.
    If so, you can override the option by args but values in config file are never used.

Example:
  1. post plain text message
      echo "Finished something" | notify-discord

  2. post json data as a json code block
      cat something.json | notify-discord --code-block json

  3. post log as a plain code block
      cat something.log | notify-discord --code-block ""
`;

const argsSchema = z.object({
  _: z.array(z.string()),
  "code-block": z.string().optional(),
  "save-config": z.boolean(),
  config: z.string().optional(),
  debug: z.boolean(),
  help: z.boolean(),
  version: z.boolean(),
});
const args = argsSchema.parse(
  parseArgs(Deno.args, {
    boolean: ["save-config", "debug", "help", "version"],
  }),
);

args.version && (() => {
  console.log(VERSION_MESSAGE);
  Deno.exit(0);
})();

function helpExit(exitCode: number) {
  console.log(HELP_MESSAGE);
  Deno.exit(exitCode);
}
args.help && helpExit(0);

log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: (logRecord) => {
        const { datetime, levelName, msg } = logRecord;
        return `${iso8601(datetime)} ${levelName.padEnd(7)} ${msg}`;
      },
    }),
  },
  loggers: {
    default: {
      level: args.debug ? "DEBUG" : "INFO",
      handlers: ["console"],
    },
  },
});
log.debug(`args: ${JSON.stringify(args)}`);

interface ErrExitOption {
  showHelp?: boolean;
  exitCode?: number;
}
function errExit(msg: string, options: ErrExitOption = {}) {
  log.error(msg);
  const exitCode = options.exitCode || 1;
  options.showHelp && helpExit(exitCode) || Deno.exit(exitCode);
}

const configFileURL = args.config
  ? new URL(args.config, import.meta.url)
  : cfg.DEFAULT_FILE_URL;

const config = cfg.merge({
  args: cfg.schema.parse(parseArgs(Deno.args)),
  file: cfg.loadFromFile(configFileURL),
});

args["save-config"] && (() => {
  cfg.saveAsFile(configFileURL, config);
  Deno.exit(0);
})();

async function execDiscordWebhook(content: string) {
  try {
    const webhookUrl = `${
      config["webhook-url"] ||
      (() => {
        throw new Error("webhook URL is not configured");
      })()
    }?wait=true`;

    if (args["code-block"] !== undefined) {
      content = `\`\`\`${args["code-block"]}\n${content}\n\`\`\``;
    }

    const formData = new FormData();
    formData.append("content", content);
    config.username && formData.append("username", config.username);
    config["avatar-url"] && formData.append("avatar_url", config["avatar-url"]);

    log.debug(`url: ${webhookUrl}`);
    log.debug(
      `formData: ${JSON.stringify(Object.fromEntries(formData.entries()))}`,
    );

    const res = await fetch(webhookUrl, {
      method: "POST",
      body: formData,
    });

    log.debug(`response status: ${res.status} ${res.statusText}`);
    log.debug(
      `response headers: ${
        JSON.stringify(Object.fromEntries(res.headers.entries()))
      }`,
    );

    const resBody = await res.json();
    const resBodyStr = JSON.stringify(resBody);
    log.debug(`response body: ${resBodyStr}`);

    res.ok ||
      errExit(
        `notify failed: status=${res.status} ${res.statusText} message=${resBodyStr}`,
      );

    switch (config.output) {
      case "json":
        console.log(JSON.stringify(resBody, null, "  "));
        break;
      default:
        log.info(`notify done: ${res.statusText}`);
        break;
    }
  } catch (e) {
    log.error(`failed to exec webhook: ${e.message}`);
  }
}

if (!Deno.isatty(Deno.stdin.rid)) {
  const contentStream = Deno.stdin.readable.pipeThrough(
    new TextDecoderStream(),
  );

  for await (const line of contentStream) {
    execDiscordWebhook(line);
  }
} else if (args._.length > 0) {
  execDiscordWebhook(args._.join(" "));
} else {
  errExit("No input from stdin or arguement", { showHelp: true });
}
