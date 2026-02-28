#!/bin/bash

# Check if nvm is not installed
if ! command -v nvm &> /dev/null; then
  # Install nvm
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash

  # Source nvm script in the current session
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Use nvm to set the required Node.js version
nvm use v20

# Check if nvm use was successful
if [ $? -ne 0 ]; then
  echo "Error: Failed to switch to Node.js v20. Deployment aborted."
  exit 1
fi

# print contents of ui_colors.json
echo "Contents of ui_colors.json:"
cat ui_colors.json

# Run npm build
npm run build

# Check if the build was successful
if [ $? -eq 0 ]; then
  echo "Build successful. Copying files..."

  # echo current dir
  echo
  pwd

  # Specify the destination directory
  destination_dir="../../litellm/proxy/_experimental/out"
  build_output_dir="./out"

  if [ ! -d "$build_output_dir" ]; then
    echo "Build output directory not found: $build_output_dir"
    exit 1
  fi

  echo "Restructuring exported UI routes..."
  shopt -s nullglob
  for html_file in "$build_output_dir"/*.html; do
    html_name="$(basename "$html_file")"

    if [ "$html_name" = "index.html" ]; then
      continue
    fi

    route_name="${html_name%.html}"
    mkdir -p "$build_output_dir/$route_name"
    cp "$html_file" "$build_output_dir/$route_name/index.html"
  done
  shopt -u nullglob

  # Marker used by proxy_server to detect pre-restructured UI
  touch "$build_output_dir/.litellm_ui_ready"

  # Remove existing files in the destination directory (including hidden files)
  mkdir -p "$destination_dir"
  find "$destination_dir" -mindepth 1 -maxdepth 1 -exec rm -rf {} +

  # Copy the contents of the output directory to the specified destination
  cp -r "$build_output_dir"/. "$destination_dir"/

  rm -rf "$build_output_dir"

  echo "Deployment completed."
else
  echo "Build failed. Deployment aborted."
fi
