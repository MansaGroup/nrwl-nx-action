#!/bin/bash

set -euxo pipefail

echo "::group::Ensuring @nrwl/cli is installed"
NX="$(yarn bin)/nx"

if [[ ! -x "$NX" ]]
then
    echo "::error::Could not found nx, have you ran npm/yarn before?"
    exit 1
fi
echo "::endgroup::"

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
            echo "::group::Running target '$target' for project '$project'"
            $NX $target $project $NX_ARGS
            echo "::endgroup::"
        done
    done
elif [[ "$INPUT_ALL" == "true" ]] || [[ "$INPUT_AFFECTED" == "false" ]]
then
    for target in $(echo $INPUT_TARGETS | sed "s/,/ /g")
    do
        echo "::group::Running target '$target' for all projects"
        $NX run-many --target=$target --all $NX_ARGS
        echo "::endgroup::"
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
        echo "::group::Running target '$target' for all affected projects"
        $NX affected --target=$target --base=$NX_BASE --head=$NX_HEAD $NX_ARGS
        echo "::endgroup::"
    done
fi
