#!/bin/sh

curl https://mise.run | sh

~/.local/bin/mise --version
echo "eval \"\$(/home/swebot/.local/bin/mise activate bash)\"" >> ~/.bashrc
source ~/.bashrc
mise use deno@latest