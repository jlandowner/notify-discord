import { parseArgs } from "https://deno.land/std@0.211.0/cli/parse_args.ts";
import * as log from "https://deno.land/std@0.211.0/log/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { version } from "./version.ts";

const VERSION_MESSAGE = `notify-discord - ${version} jlandowner 2024`;

const HELP_MESSAGE = `notify-discord - post webhook to discord webhook URL

Usage:
  Notify message from args:
    ./notify-discord <message>
  Notify message from stdin:
    echo <message> | ./notify-discord

Options:
  --output [text, json]        : Output format (default: text)
  --code-block <LANGUAGE>      : Enclose markdown code block with language (default: disabled)
  --save-config                : store webhook configurations in file. If you build your custom binary with built-in URL, this does not work.
  --webhook-url <WEBHOOK_URL>  : Discord's webhook URL (default: use built-in URL if exist or use stored url in config)
  --config <CONFIG_FILE_PATH>  : Config file path. If you build your custom binary with built-in URL, this does not work. (defualt: $HOME/.notify-discord.json)
  --debug                      : Debug mode (default: false)
  --help                       : Show help
  --version                    : Show version

Example:
  1. post plain text message
      ./notify-discord "Finished something"

  2. post plain text message with debug (set "--" between options and args)
      ./notify-discord --debug -- "Finished something"

  3. post json data
      cat something.json | ./notify-discord --code-block json

  4. post log with code block
      cat something.log | ./notify-discord --code-block ""
`;

const argsSchema = z.object({
  _: z.array(z.string()),
  output: z.enum(["text", "json"]).default("text"),
  "code-block": z.string().optional(),
  "save-config": z.boolean(),
  "webhook-url": z.string().url().optional(),
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
        return `${datetime.toISOString()} ${levelName.padEnd(7)} ${msg}`;
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

const configFilePath = args.config
  ? new URL(args.config, import.meta.url)
  : new URL(
    ".notify-discord.json",
    `file://${Deno.env.get("HOME")}/`,
  );

args["save-config"] && await (async () => {
  args["webhook-url"] || errExit("webhook-url is not set", { showHelp: true });
  await Deno.writeTextFileSync(
    configFilePath,
    JSON.stringify(
      {
        "webhook-url": args["webhook-url"],
      },
      null,
      "    ",
    ),
  );
  log.info(`Successfully saved in ${configFilePath}`);
  Deno.exit(0);
})();

function getwebhookUrlFromConfigFile(): string {
  try {
    log.debug(`loading config file: ${configFilePath}`);
    const cfg = JSON.parse(Deno.readTextFileSync(configFilePath));
    return cfg["webhook-url"];
  } catch (e) {
    log.debug(`failed to load config file: ${e.message}`);
    return "";
  }
}

async function execDiscordWebhook(content: string) {
  try {
    const webhookUrl = `${
      args["webhook-url"] || await getwebhookUrlFromConfigFile() ||
      (() => {
        throw new Error("webhook URL is not configured");
      })()
    }?wait=true`;

    if (args["code-block"] !== undefined) {
      content = `\`\`\`${args["code-block"]}\n${content}\n\`\`\``;
    }

    const formData = new FormData();
    formData.append("content", content);

    log.debug(`url: ${webhookUrl}`);
    log.debug(`content: ${content}`);

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
    log.debug(`response body: ${resBody}`);

    res.ok ||
      errExit(
        `notify failed: status=${res.status} ${res.statusText} message=${
          JSON.stringify(resBody)
        }`,
      );

    switch (args.output) {
      case "json":
        console.log(JSON.stringify(resBody, null, "  "));
        break;
      case "text":
        log.info(`notify done: ${res.statusText}`);
        break;
      default:
        log.warning(`output is not supported: ${args.output}`);
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
  errExit("no input from stdin or arguement", { showHelp: true });
}
