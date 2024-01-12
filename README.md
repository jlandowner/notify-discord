# notify-discord

notidy-discord - post webhook to discord webhook URL

# Quickstart

1. Generate your webhook URL in Discord channel settings page.
   https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks

2. Deno install

```sh
deno install --allow-env --allow-write --allow-read --allow-net \
  https://raw.githubusercontent.com/jlandowner/notify-discord/main/mod.ts \
  -- --webhook-url https://discord.com/api/webhooks/YOUR/WEBHOOK_URL
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
```

# Install option

## 1. For deno-installed environment

```sh
deno install --allow-env --allow-write --allow-read --allow-net \
  https://raw.githubusercontent.com/jlandowner/notify-discord/main/mod.ts \
  -- --webhook-url https://discord.com/api/webhooks/YOUR/WEBHOOK_URL
```

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
notify-discord --save-config --webhook-url --webhook-url https://discord.com/api/webhooks/YOUR/WEBHOOK_URL
```

### 2-2. Build your binary with your Webhook URL.

Once you build it, you can distribute a pre-configured binary to your servers or
computers.

deno is only required in building environment.

```sh
# Build with your webhook URL
deno task build --webhook-url --webhook-url https://discord.com/api/webhooks/YOUR/WEBHOOK_URL
```

Then, a binary file named `notify-discord` is created and place it in your PATH.

# LICENSE

MIT
