# Troubleshooting

## CLI not responding

If the CLI hangs or returns nothing on any command, **Obsidian is probably not running**. The CLI is not standalone — it communicates with the Obsidian desktop app via IPC. Ask the user to open Obsidian on their desktop and try again.

## Windows

Requires the **Obsidian 1.12.4+ installer**. See [Installer version update](https://help.obsidian.md/updates).

Windows uses a terminal redirector (`Obsidian.com`) that connects Obsidian to stdin/stdout. This is necessary because Obsidian runs as a GUI app. When you install Obsidian 1.12.4+, the `Obsidian.com` redirector is placed alongside `Obsidian.exe`.

### Agent workaround (missing `Obsidian.com`)

If the user has not updated their installer, `obsidian read` may hang or return empty output in PowerShell. Use this workaround:

```powershell
obsidian read | Out-File -FilePath temp.txt
# then read temp.txt with view_file
```

`obsidian file` (short output) is typically reliable even without the `.com` redirector.

## macOS

The CLI adds the Obsidian binary directory to PATH via `~/.zprofile`. If needed, add manually:

```shell
export PATH="$PATH:/Applications/Obsidian.app/Contents/MacOS"
```

### Alternate shells

The CLI only modifies `~/.zprofile` (zsh). For other shells:

- **Bash:** add `export PATH="$PATH:/Applications/Obsidian.app/Contents/MacOS"` to `~/.bash_profile`
- **Fish:** run `fish_add_path /Applications/Obsidian.app/Contents/MacOS`

## Linux

Creates a symlink at `/usr/local/bin/obsidian` (requires sudo).

### AppImage

Symlink points to the `.AppImage` file. If sudo fails, falls back to `~/.local/bin/obsidian`.

Check symlink:
```shell
ls -l /usr/local/bin/obsidian
```

Create manually:
```shell
sudo ln -s /path/to/obsidian /usr/local/bin/obsidian
```

If using `~/.local/bin/`, ensure it's in PATH:
```shell
export PATH="$PATH:$HOME/.local/bin"
```

### Snap

Set `XDG_CONFIG_HOME` to the Snap config path:
```shell
export XDG_CONFIG_HOME="$HOME/snap/obsidian/current/.config"
```

### Flatpak

System install:
```shell
ln -s /var/lib/flatpak/exports/bin/md.obsidian.Obsidian ~/.local/bin/obsidian
```

User install:
```shell
ln -s ~/.local/share/flatpak/exports/bin/md.obsidian.Obsidian ~/.local/bin/obsidian
```
