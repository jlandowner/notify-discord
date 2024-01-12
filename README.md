# notify-discord <img src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/653714c174fc6c8bbea73caf_636e0a69f118df70ad7828d4_icon_clyde_blurple_RGB.svg" alt="image" height="30">

A CLI command to post messages to Discord channels made by Deno.

# Quickstart

1. Generate your webhook URL in Discord channel settings page. Only support text
   channel.
   https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks

2. Install with `deno`

```sh
deno compile --output notify-discord --allow-env --allow-read --allow-write --allow-net https://raw.githubusercontent.com/jlandowner/notify-discord/main/mod.ts \
  --webhook-url https://discord.com/api/webhooks/YOUR_WEBHOOK_URL/SET_HERE
```

3. Post!

```sh
echo hello world | ./notify-discord
```

> For the quickstart, `deno` cli is required first.
>
> ```sh
> # Install deno: https://docs.deno.com/runtime/manual/getting_started/installation
> curl -fsSL https://deno.land/install.sh | sh
> ```
>
> Or see
> [installation option for non-deno environment](#for-non-deno-environment)

# Usage

```sh
$ ./notidy-discord --help

notify-discord - post messages to Discord channel by webhook

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
```

# Installation options

## 1. For deno-installed environment

### 1-1. Build a binary with your Webhook URL

```sh
# Build with your webhook URL
deno compile --output notify-discord --allow-env --allow-read --allow-write --allow-net https://raw.githubusercontent.com/jlandowner/notify-discord/main/mod.ts \
  --webhook-url https://discord.com/api/webhooks/YOUR_WEBHOOK_URL/SET_HERE

# Move binary file to executable PATH (e.g. $HOME/bin)
mv notify-discord $HOME/bin/
```

> NOTE: You can pass the options at the end of `deno compile` args to change
> default behavior. Once you pass them at compile time, these options are
> embeded in the command and initialization is not required.
>
> e.g.
>
> - --webhook-url <YOUR_WEBHOOK_URL> : configure webhook url embeded
> - --config <YOUR_CONFIG_PATH> : change default config file path (default:
  > $HOME/.notify-discord.json)

### 1-2. Install with `deno install`

```sh
# Install
deno install --output notify-discord --allow-env --allow-read --allow-write --allow-net https://raw.githubusercontent.com/jlandowner/notify-discord/main/mod.ts

# Initialize the command
notify-discord --save-config --webhook-url https://discord.com/api/webhooks/YOUR_WEBHOOK_URL/SET_HERE
```

## 2. For non-deno environment

Download pre-built binary and initialize.

```sh
# Choose and set variable of your environment target
TARGET=x86_64-unknown-linux-gnu # You can choose "x86_64-unknown-linux-gnu", "x86_64-pc-windows-msvc", "x86_64-apple-darwin", "aarch64-apple-darwin"

# Download pre-built binary
curl -sLO https://github.com/jlandowner/notify-discord/releases/latest/download/notify-discord-$TARGET.tgz && tar -xf notify-discord-$TARGET.tgz && rm notify-discord-$TARGET.tgz

# Move binary file to executable PATH (e.g. $HOME/bin)
mv notify-discord $HOME/bin/

# Initialize the command
notify-discord --save-config --webhook-url https://discord.com/api/webhooks/YOUR_WEBHOOK_URL/SET_HERE
```

# Support status of Discord Webhook API parameters

https://discord.com/developers/docs/resources/webhook#execute-webhook

- `content`
- `file[n]` and `attachments` for uploading a file
- `username` and `avatar_url` overrides

Not supported, currently:

- `embed`

# LICENSE

MIT
