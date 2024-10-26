#!/bin/bash
set -euo pipefail

###
#
# Publishes all *.whl files in "dist/python" to PyPI
#
# TWINE_USERNAME (required)
# TWINE_PASSWORD (required)
#
###

cd "dist/python"

[ -z "${TWINE_USERNAME:-}" ] && {
  echo "Missing TWINE_USERNAME"
  exit 1
}

[ -z "${TWINE_PASSWORD:-}" ] && {
  echo "Missing TWINE_PASSWORD"
  exit 1
}

if [ -z "$(ls *.whl)" ]; then
  echo "cannot find any .whl files in $PWD"
  exit 1
fi

twine upload --verbose --skip-existing *