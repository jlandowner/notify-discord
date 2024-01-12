# notify-discord <img src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/653714c174fc6c8bbea73caf_636e0a69f118df70ad7828d4_icon_clyde_blurple_RGB.svg" alt="image" height="30">

A CLI command to post messages to Discord channels created by Deno.

# Quickstart

1. Generate your webhook URL in Discord channel settings page.
   https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks

2. Install with `deno install`

```sh
deno install --allow-env --allow-read --allow-write --allow-net --force https://raw.githubusercontent.com/jlandowner/notify-discord/main/mod.ts \
  -- --webhook-url https://discord.com/api/webhooks/YOUR_WEBHOOK_URL/SET_HERE
```

3. Post!

```sh
echo hello world | notify-discord
```

# Usage

```sh
$ ./notidy-discord --help

notify-discord - post messages to Discord channel by webhook

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
```

# Install option

## 1. For deno-installed environment

```sh
deno install --allow-env --allow-read --allow-write --allow-net --force \
  https://raw.githubusercontent.com/jlandowner/notify-discord/main/mod.ts \
  -- --webhook-url https://discord.com/api/webhooks/YOUR_WEBHOOK_URL/SET_HERE
```

> NOTE: You can pass the config options to `deno install` args next to `--`. See
> [Usage](#usage) about the config options.

## 2. For non deno-installed environment

### 2-1. Use pre-built binary with configuration file

```sh
# Choose and set variable of your environmet target
TARGET=x86_64-unknown-linux-gnu # You can choose "x86_64-unknown-linux-gnu", "x86_64-pc-windows-msvc", "x86_64-apple-darwin", "aarch64-apple-darwin"

# Download pre-built binary
curl -sLO https://github.com/jlandowner/notify-discord/releases/latest/download/notify-discord-$TARGET.tgz && tar -xf notify-discord-$TARGET.gz && rm notify-discord-$TARGET.gz

# Move binary file to executable PATH (e.g. $HOME/bin)
mv notify-discord $HOME/bin/

# Create config file
notify-discord --save-config --webhook-url https://discord.com/api/webhooks/YOUR_WEBHOOK_URL/SET_HERE
```

### 2-2. Build a binary with your Webhook URL.

Deno is required only in building environment.

Once you build it, you can distribute a pre-configured command binary to your
servers or computers.

```sh
# Build with your webhook URL
deno compile --output notify-discord --allow-env --allow-read --allow-write --allow-net https://raw.githubusercontent.com/jlandowner/notify-discord/main/mod.ts \
  --webhook-url https://discord.com/api/webhooks/YOUR_WEBHOOK_URL/SET_HERE
```

Then, a binary file named `notify-discord` is created and place it in your PATH.

> NOTE: You can pass the config options at the end of `deno compile` args. See
> [Usage](#usage) about the config options.

# Support status of Discord Webhook API parameters

https://discord.com/developers/docs/resources/webhook#execute-webhook

- `content`
- `username` and `avatar_url` overrides

TODO:

- `embed`
- `attachments`

# LICENSE

MIT
