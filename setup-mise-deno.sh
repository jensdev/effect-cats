# !/usr/bin/env bash
# This script is for a one-time setup of `mise` (a dev environment manager).
# It installs `mise` and attempts to add `mise activate` to the shell's rc file (~/.bashrc).
# Users should verify the change to their shell rc file or configure it manually
# for their specific shell (e.g., .zshrc for zsh, config.fish for fish).
# For users of other shells (e.g., zsh, fish), please consult the official mise
# documentation for instructions on how to integrate mise with your specific shell:
# https://mise.jdx.dev/getting-started.html#shell-setup
#
# The project uses a .mise.toml file to define the Deno version,
# which `mise` will use automatically when navigating into the project directory
# (assuming `mise` is correctly hooked into the shell).

set -e # Exit immediately if a command exits with a non-zero status.

echo "Installing mise..."
curl https://mise.run | sh

echo "Verifying mise installation..."
~/.local/bin/mise --version

# Attempt to add mise to .bashrc for automatic activation.
# IMPORTANT: This script includes a step to add the activation command to ~/.bashrc.
# This line is specifically for bash users.
# If you use a different shell (e.g., zsh, fish), you MUST manually add the
# equivalent activation command to your shell's configuration file.
# For example, for zsh, you would typically add it to ~/.zshrc.
# For fish, you would add it to ~/.config/fish/config.fish.
# Please consult the mise documentation (https://mise.jdx.dev/getting-started.html#shell-setup)
# for the correct command and file for your shell, and verify this change
# or configure your shell manually.
echo "Attempting to update ~/.bashrc for bash users..."
echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc

~/.local/bin/mise mise reshim
~/.local/bin/mise mise trust
# No need to run `mise activate` here as it's sourced via .bashrc or equivalent later,
# or when the user opens a new terminal.
# `mise use -g deno@latest` is removed as project-specific versions should be managed by .mise.toml

echo "Installation and setup script finished."
echo "Please close and reopen your terminal or source your shell configuration file (e.g., source ~/.bashrc) for changes to take effect."
echo "After that, 'mise' should automatically manage the Deno version when you are in this project's directory."
# The following line is intended for users who source this script directly.
# If you run this script directly (e.g., `./setup-mise-deno.sh`),
# closing and reopening your terminal or manually sourcing your rc file (e.g., `source ~/.bashrc`)
# is necessary for the changes to `~/.bashrc` to take effect.
source ~/.bashrc