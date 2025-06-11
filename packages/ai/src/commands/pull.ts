import { Command } from "commander";

export const loadPullCommand = (program: Command) => {
  const pull = new Command("pull")
    .description("Pull a version of an object")
    .argument(
      "<slug>",
      "The object to pull, could be a prompt, en eval, a monitor, a dashboard, etc.",
    )
    .option(
      "--version <version>",
      "The version to pull, default: latest",
      "latest",
    )
    .action(async () => {
      console.log("Pulling a version of an object");
    });

  program.addCommand(pull);
};
