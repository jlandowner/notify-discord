# notify-discord

notidy-discord - post webhook to discord webhook URL

# Quickstart

1. Generate your webhook URL in Discord channel settings page.
   https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks

2. Download `notify-discord` command in PATH

3. Initialize

```sh
notify-discord --init --webhook-url https://discord.com/api/webhooks/YOUR/WEBHOOK_URL
```

4. Post!

```sh
echo hello world | notify-discord
```

# Usage

```sh
$ ./notidy-discord --help

notify-discord - post webhook to discord webhook URL

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
```

# Build

```sh
deno task build
```

# LICENSE

MIT
