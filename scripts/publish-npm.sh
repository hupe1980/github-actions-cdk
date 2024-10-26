#!/bin/bash
set -eu

###
#
# Publishes all *.tgz files in "dist/js" to npm
#
#
###

dir="dist/js"

npm adduser

log=$(mktemp -d)/npmlog.txt

for file in ${dir}/**.tgz; do
  npm publish ${file} 2>&1 | tee ${log}
  exit_code="${PIPESTATUS[0]}"

  if [ ${exit_code} -ne 0 ]; then

    # error returned from npmjs
    if cat ${log} | grep -q "You cannot publish over the previously published versions"; then
      echo "SKIPPING: already published"
      continue
    fi

    # error returned from github packages
    if cat ${log} | grep -q "Cannot publish over existing version"; then
      echo "SKIPPING: already published"
      continue
    fi

    echo "ERROR"
    exit 1
  fi
done

echo "SUCCESS"