#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/../backend"

export USE_LOCAL_DB="true"
export NODE_ENV="test"

npm test
