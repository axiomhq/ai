import { Command } from "commander";
import { listAllVersions } from "../apex";

export const loadListCommand = (program: Command) => {
  const listCmd = new Command("list")
    .description("List all versions of an object")
    .argument(
      "<objectId>",
      "The object id to list, could be a prompt, en eval, a monitor, a dashboard, etc.",
    )
    .action(async (objectId: string) => {
      const versions = await listAllVersions(objectId);
      console.log("Object versions", versions);
    });

  program.addCommand(listCmd);
};
