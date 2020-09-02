#!/bin/bash

if [[ ! command -v nx &>/dev/null ]]
then
    yarn global add @nrwl/cli
fi

if [[ "$INPUT_ALL" == "true" ]] || [[ "$INPUT_AFFECTED" == "false" ]]
then
    for target in $(echo $INPUT_TARGETS | sed "s/,/ /g")
    do
        nx run-many --target=$target --all $
    done
else
    if [[ $GITHUB_BASE_REF ]]
    then
        export NX_BASE=${{ github.event.pull_request.base.sha }}
        export NX_HEAD=${{ github.event.pull_request.head.sha }}
    else
        export NX_BASE=$(git rev-parse HEAD~1)
        export NX_HEAD=$(git rev-parse HEAD)
    fi

    for target in $(echo $INPUT_TARGETS | sed "s/,/ /g")
    do
        nx affected --target=$target --base=$NX_BASE --head=$NX_HEAD $INPUT_ARGS
    done
fi
