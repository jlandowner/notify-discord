import { parseArgs } from "https://deno.land/std@0.211.0/cli/parse_args.ts";
import * as log from "https://deno.land/std@0.211.0/log/mod.ts";
import { version } from "./version.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const versionMessage = `notify-discord - ${version} jlandowner 2024`;

const helpMessage = `notify-discord - post webhook to discord webhook URL

Usage:
  Initialize:
  ./notify-discord --init --webhook-url <Discord webhook URL>

  Notify message from args:
    ./notify-discord <message>
  Notify message from stdin:
    echo <message> | ./notify-discord

Options:
  --init                       : Initialize notify-discord and store webhook configurations in $HOME/.notify-discord.json
  --webhook-url <WEBHOOK_URL>  : Discord's webhook URL (default: use stored url by --init)
  --output [text, json]        : Output format (default: text)
  --code-block <LANGUAGE>      : Enclose markdown code block with language (default: disabled)
  --config <CONFIG_FILE_PATH>  : Config file path (defualt: $HOME/.notify-discord.json)
  --debug                      : Debug mode (default: false)
  --help                       : Show help
  --version                    : Show version

Example:
  1. initialize
      ./notify-discord --init --webhook-url https://discord.com/api/webhooks/YOUR/WEBHOOK_URL

  2. post plain text message
      ./notify-discord "Finished something"

  3. post plain text message with debug (set "--" between options and args)
      ./notify-discord --debug -- "Finished something"

  4. post json data
      cat something.json | ./notify-discord --code-block json

  5. post log with code block
      cat something.log | ./notify-discord --code-block ""
`;

const argsSchema = z.object({
  _: z.array(z.string()),
  init: z.boolean(),
  "webhook-url": z.string().url().optional(),
  output: z.enum(["text", "json"]).default("text"),
  "code-block": z.string().optional(),
  config: z.string().optional(),
  debug: z.boolean(),
  help: z.boolean(),
  version: z.boolean(),
});
const args = argsSchema.parse(
  parseArgs(Deno.args, { boolean: ["init", "debug", "help", "version"] }),
);

const versionExit = () => {
  console.log(versionMessage);
  Deno.exit(0);
};
args.version && versionExit();

const helpExit = (exitCode: number) => {
  console.log(helpMessage);
  Deno.exit(exitCode);
};
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

const errExit = (msg: string, help?: boolean) => {
  log.error(msg);
  help && helpExit(1);
  Deno.exit(1);
};

const configFile = args.config
  ? new URL(args.config, import.meta.url)
  : new URL(
    ".notify-discord.json",
    `file://${Deno.env.get("HOME")}/`,
  );

const initialize = async () => {
  args["webhook-url"] || errExit("webhook-url is not set", true);
  await Deno.writeTextFileSync(
    configFile,
    JSON.stringify(
      {
        "webhook-url": args["webhook-url"],
      },
      null,
      "    ",
    ),
  );
  log.info(`Successfully initirized, saved in ${configFile}`);
  Deno.exit(0);
};
args.init && await initialize();

let webhookURL: string;
try {
  const loadConfig = async (): Promise<string> => {
    const cfg = JSON.parse(await Deno.readTextFileSync(configFile));
    return cfg["webhook-url"];
  };
  webhookURL = `${args["webhook-url"] || await loadConfig()}?wait=true`;
} catch (e) {
  errExit(`Not initialized: ${e}`);
}

const execDiscordWebhook = async (content: string) => {
  if (args["code-block"] !== undefined) {
    content = `\`\`\`${args["code-block"]}\n${content}\n\`\`\``;
  }

  const formData = new FormData();
  formData.append("content", content);

  log.debug(`url: ${webhookURL}`);
  log.debug(`content: ${content}`);

  const res = await fetch(webhookURL, {
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
};

if (!Deno.isatty(Deno.stdin.rid)) {
  // content from stdin
  const contentStream = Deno.stdin.readable.pipeThrough(
    new TextDecoderStream(),
  );
  for await (const line of contentStream) {
    execDiscordWebhook(line);
  }
} else if (args._.length > 0) {
  // content from args
  execDiscordWebhook(args._.join(" "));
} else {
  log.error("no input from stdin or arguement");
  helpExit(1);
}
