import { basename, log, parseArgs, TextLineStream, z } from "./deps.ts";
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
  --file <UPLOAD_FILE_PATH>    : Upload file
  --as-file                    : Input as file. default file name is "notify-discord.txt" and you can change it by --file flag (default: false)
  --code-block <LANGUAGE>      : Enclose markdown code block with language (default: disabled)
  --save-config                : Save config options in a config file
  --webhook-url <WEBHOOK_URL>  : Discord's webhook URL
  --username    <USERNAME>     : Override Discord's webhook username (default: configured in Discord webhook setting page)
  --avatar-url  <AVATER_URL>   : Override Discord's webhook avator icon URL (default: configured in Discord webhook setting page)
  --config <CONFIG_FILE_PATH>  : Config file path (defualt: $HOME/.notify-discord.json)
  --debug                      : Debug mode (default: false)
  --help                       : Show help
  --version                    : Show version

Configuration file:
  You can save some options in a config file to change the default behavior.
    notify-discord --save-config --username GitHub --avatar-url https://github.com/github.png

  Config file schema:
  {
    "webhook-url": "Discord's webhook URL (Attention: see NOTES)",
    "username":    "Override Discord's webhook username (default: configured in Discord webhook setting page)",
    "avatar-url":  "Override Discord's webhook avator icon URL (default: configured in Discord webhook setting page)",
  }
  
  When the options are found in both args and file, args values are always used.

  NOTES:
    When you installed this command by "deno install" or "deno compile" with args of config options,
    the options specified at install or compile time by args are ALWAYS used even if you pass no options at execution time.
    If so, you can override the option by args at execution time but config file values are never used.

Example:
  1. post plain text message
      echo "Finished something" | notify-discord

  2. post text message and upload some file
      date > /tmp/date.log && echo "finished" | notify-discord --file /tmp/date.log

  3. post a command output as file named "long-run.log"
      (for i in $(seq 1 5); do echo $i; sleep 1; done) | notify-discord --as-file --file "long-run.log"

  4. post json data as a json code block
      cat deno.json | notify-discord --code-block json

  5. post log as a plain code block
      tail /var/log/messages 2>&1 | notify-discord --code-block ""
`;

const argsSchema = z.object({
  _: z.array(z.string()),
  file: z.string().optional(),
  "as-file": z.boolean(),
  "code-block": z.string().optional(),
  "save-config": z.boolean(),
  config: z.string().optional(),
  debug: z.boolean(),
  help: z.boolean(),
  version: z.boolean(),
});
const args = argsSchema.parse(
  parseArgs(Deno.args, {
    boolean: ["as-file", "save-config", "debug", "help", "version"],
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
    if (args["as-file"]) {
      // args.file is file name of input as file
      const filename = args.file || "notify-discord.txt";
      formData.append(
        "file0",
        new Blob([content], { type: "text/plain" }),
        basename(filename),
      );
    } else {
      formData.append("content", content);

      // args.file is extra file path to upload
      if (args.file) {
        formData.append(
          "file1",
          new Blob([await Deno.readFile(args.file)]),
          basename(args.file),
        );
      }
    }
    config.username && formData.append("username", config.username);
    config["avatar-url"] && formData.append("avatar_url", config["avatar-url"]);

    log.debug(`url: ${webhookUrl}`);
    log.debug(
      `formData: ${JSON.stringify(Object.fromEntries(formData.entries()))}`,
    );

    let attempt = 0;
    while (true) {
      attempt++;
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

      if (res.ok) {
        break;
      } else if (res.status == 429 && attempt <= 3) {
        await setTimeout(() => {
          log.warning(`rate limited: retry attempt ${attempt}`);
        }, Number(resBody.retry_after) * attempt);
        continue;
      } else {
        errExit(
          `notify failed: status=${res.status} ${res.statusText} message=${resBodyStr}`,
        );
      }
    }
  } catch (e) {
    log.error(`failed to exec webhook: ${e.message}`);
  }
}

if (!Deno.isatty(Deno.stdin.rid)) {
  const buffer = [];
  const contentStream = Deno.stdin.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());

  for await (const line of contentStream) {
    buffer.push(line);
  }
  buffer.length == 0 && errExit("No input from stdin");
  await execDiscordWebhook(buffer.join("\n"));
} else if (args._.length > 0 || args.file) {
  await execDiscordWebhook(args._.join(" "));
} else {
  errExit("No input from stdin or arguement", { showHelp: true });
}
log.info(`Notify done!`);
