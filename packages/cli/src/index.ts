#!/usr/bin/env node
import { Command } from "commander";
import { loadPushCommand } from "./commands/push";
import { loadPullCommand } from "./commands/pull";
import { loadDeleteCommand } from "./commands/delete";
import { loadListCommand } from "./commands/list";

const program = new Command();

program
  .name("axiom")
  .description("Axiom's CLI to manage your objects and run evals")
  .version("1.0.0");

loadListCommand(program);
loadPushCommand(program);
loadPullCommand(program);
loadDeleteCommand(program);

program.parse();
