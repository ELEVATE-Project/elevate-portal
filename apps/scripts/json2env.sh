#!/bin/sh
jq -r 'to_entries | .[] | "\(.key)=\(.value | tojson)"'