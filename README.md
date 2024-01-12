# notify-discord <img src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/653714c174fc6c8bbea73caf_636e0a69f118df70ad7828d4_icon_clyde_blurple_RGB.svg" alt="image" height="30">

A CLI command to post messages to Discord channels made by Deno.

# Quickstart

1. Generate your webhook URL in Discord channel settings page. Only support text
   channel.
   https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks

2. Install with
   [`deno` CLI](https://docs.deno.com/runtime/manual/getting_started/installation)

```sh
deno compile --output notify-discord --allow-env --allow-read --allow-write --allow-net https://raw.githubusercontent.com/jlandowner/notify-discord/main/mod.ts \
  --webhook-url https://discord.com/api/webhooks/YOUR_WEBHOOK_URL/SET_HERE
```

> You can see
> [installation option for non-deno environment](#for-non-deno-environment)

3. Post!

```sh
echo hello world | ./notify-discord
```

<img width="223" alt="s1" src="https://github.com/jlandowner/notify-discord/assets/48989258/f4d0e0a1-6346-4547-95c7-ba38d66b4aa8">

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

# Example

### post plain text message

```sh
echo "Finished something" | notify-discord
```

<img width="271" alt="s2" src="https://github.com/jlandowner/notify-discord/assets/48989258/84cf20c3-2c9d-4615-a32c-218c96871681">

### post text message and upload some file

```sh
date > /tmp/date.log && echo "finished" | notify-discord --file /tmp/date.log
```

<img width="370" alt="s3" src="https://github.com/jlandowner/notify-discord/assets/48989258/0be47abb-dfd0-446c-b424-97e51e69b0e8">

### post a command output as file named "long-run.log"

```sh
(for i in $(seq 1 5); do echo $i; sleep 1; done) | notify-discord --as-file --file "long-run.log"
```

<img width="315" alt="s4" src="https://github.com/jlandowner/notify-discord/assets/48989258/4287f8af-24d9-4dc8-813a-4ec6f9c3c2fd">

### override username and avatar url

```sh
echo This is Macbook 💻 | notify-discord --username Macbook --avatar-url https://github.com/apple.png
```

<img width="269" alt="s5" src="https://github.com/jlandowner/notify-discord/assets/48989258/6aab7e17-f041-435c-85dd-e6fff7866d9f">

> You can store the options as the default behabior.
> 
> ```sh
> notify-discord --save-config --username Macbook --avatar-url https://github.com/apple.png
> echo This is Macbook 💻 | notify-discord
> ```

# Installation options

## For non-deno environment

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

## For deno-installed environment

For deno-install environment, you can configure the command at compile or
install time. Therefore initialization and config file are not required.

### 1. Build with `deno compile`

```sh
# Build with your webhook URL
deno compile --output notify-discord --allow-env --allow-read --allow-write --allow-net https://raw.githubusercontent.com/jlandowner/notify-discord/main/mod.ts \
  --webhook-url https://discord.com/api/webhooks/YOUR_WEBHOOK_URL/SET_HERE

# Move binary file to executable PATH (e.g. $HOME/bin)
mv notify-discord $HOME/bin/
```

You can pass the options at the end of `deno compile` args to change default
behavior. Once you pass them at compile time, these options are embeded in the
command and initialization is not required.

> e.g.
>
> - --webhook-url <YOUR_WEBHOOK_URL> : configure webhook url embeded
> - --config <YOUR_CONFIG_PATH> : change default config file path (default:
  > $HOME/.notify-discord.json)

### 2. Install with `deno install`

```sh
# Install with your webhook URL
deno install --name notify-discord --allow-env --allow-read --allow-write --allow-net --force https://raw.githubusercontent.com/jlandowner/notify-discord/main/mod.ts \
  -- --webhook-url https://discord.com/api/webhooks/YOUR_WEBHOOK_URL/SET_HERE
```

If this is the first time of `deno install`, you have to set installed direcotry
in `PATH`. You can see the details about it in the output of `deno install`.

Like `deno compile`, you can pass the options to `deno install` positional args
(next to `--`) to change default behavior.

# Support status of Discord Webhook API parameters

https://discord.com/developers/docs/resources/webhook#execute-webhook

- `content`
- `file[n]` and `attachments` for uploading a file
- `username` and `avatar_url` overrides

Not supported, currently:

- `embed`

# LICENSE

MIT
