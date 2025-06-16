#!/usr/bin/env bash
# This script is for a one-time setup of `mise` (a dev environment manager).
# It installs `mise` and attempts to add `mise activate` to the shell's rc file (~/.bashrc).
# Users should verify the change to their shell rc file or configure it manually
# for their specific shell (e.g., .zshrc for zsh, config.fish for fish).
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
# IMPORTANT: This script specifically targets bash and ~/.bashrc.
# If you use a different shell (e.g., zsh, fish), you will need to
# manually add the equivalent activation command to your shell's configuration file.
# For example, for zsh, you would add it to ~/.zshrc.
# For fish, you would add it to ~/.config/fish/config.fish.
# Please verify this change or configure your shell manually.
echo "Attempting to update ~/.bashrc for bash..."
echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc

echo "Installation and setup script finished."
echo "Please close and reopen your terminal or source your shell configuration file (e.g., source ~/.bashrc) for changes to take effect."
echo "After that, 'mise' should automatically manage the Deno version when you are in this project's directory."