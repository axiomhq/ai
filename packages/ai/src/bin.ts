#!/usr/bin/env node
import { extractOverrides } from './cli/utils/parse-flag-overrides';
import { createProgram } from './cli/program';

const { cleanedArgv, overrides } = extractOverrides(process.argv.slice(2));

const program = createProgram({ overrides });

program.parse(['node', 'axiom', ...cleanedArgv]);
