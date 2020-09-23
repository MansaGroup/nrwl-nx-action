#!/bin/bash

set -euxo pipefail

NX="nx"

if ! command -v nx &>/dev/null
then
    yarn global add @nrwl/cli
    NX="$(yarn global bin)/nx"
    echo "::add-path::$(yarn global bin)"
fi

NX_ARGS="$INPUT_ARGS"

if [[ "$INPUT_PARALLEL" == "true" ]]
then
    NX_ARGS="--parallel $NX_ARGS"
fi

if [[ "$INPUT_PROJECTS" != "" ]]
then
    for project in $(echo $INPUT_PROJECTS | sed "s/,/ /g")
    do
        for target in $(echo $INPUT_TARGETS | sed "s/,/ /g")
        do
            $NX $target $project $NX_ARGS
        done
    done
elif [[ "$INPUT_ALL" == "true" ]] || [[ "$INPUT_AFFECTED" == "false" ]]
then
    for target in $(echo $INPUT_TARGETS | sed "s/,/ /g")
    do
        $NX run-many --target=$target --all $NX_ARGS
    done
else
    if [[ $GITHUB_BASE_REF ]]
    then
        export NX_BASE=$GITHUB_BASE_REF
        export NX_HEAD=$GITHUB_HEAD_REF
    else
        export NX_BASE=$(git rev-parse HEAD~1)
        export NX_HEAD=$(git rev-parse HEAD)
    fi

    for target in $(echo $INPUT_TARGETS | sed "s/,/ /g")
    do
        $NX affected --target=$target --base=$NX_BASE --head=$NX_HEAD $NX_ARGS
    done
fi
