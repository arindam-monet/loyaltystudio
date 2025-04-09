#!/bin/bash
# Simple script to run tests with Vitest

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Run the tests
npx vitest run "$@"
