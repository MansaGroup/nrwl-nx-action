#!/bin/bash

set -euxo pipefail

env

if ! command -v nx &>/dev/null
then
    yarn global add @nrwl/cli
fi

if [[ "$INPUT_PARALLEL" == "true" ]]
then
    INPUT_AFFECTED="--parallel $INPUT_AFFECTED"
fi

if [[ "$INPUT_PROJECTS" != "" ]]
then
    for project in $(echo $INPUT_PROJECTS | sed "s/,/ /g")
    do
        for target in $(echo $INPUT_TARGETS | sed "s/,/ /g")
        do
            nx $target $project $INPUT_ARGS
        done
    done
elif [[ "$INPUT_ALL" == "true" ]] || [[ "$INPUT_AFFECTED" == "false" ]]
then
    for target in $(echo $INPUT_TARGETS | sed "s/,/ /g")
    do
        nx run-many --target=$target --all $INPUT_ARGS
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
        nx affected --target=$target --base=$NX_BASE --head=$NX_HEAD $INPUT_ARGS
    done
fi
