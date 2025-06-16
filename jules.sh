#!/bin/sh

curl https://mise.run | sh

~/.local/bin/mise --version
echo "eval \"\$(/home/swebot/.local/bin/mise activate bash)\"" >> ~/.bashrc

cat ~/.bashrc

~/.local/bin/mise use deno@latest