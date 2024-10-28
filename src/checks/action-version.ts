import type { IConstruct } from "constructs";
import { Check } from "../check";
import { RegularStep, parseExternalActionName } from "../step";

export class ExternalActionVersionCheck extends Check {
  constructor(level: "error" | "warning" | "info" = "error") {
    super(level);
  }

  visit(node: IConstruct): void {
    if (RegularStep.isRegularStep(node) && node.isExternalAction()) {
      const parsed = parseExternalActionName(node.uses);

      // Check for missing version reference
      if (!parsed.ref) {
        this.annotate(
          node,
          `External action "${node.uses}" does not specify a version. Please specify a version for the action.`,
        );
      }

      // Validate version format (40-character SHA-1 hash)
      if (parsed.ref && !/^[a-f0-9]{40}$/i.test(parsed.ref)) {
        this.annotate(
          node,
          `External action "${node.uses}" specifies an invalid version. The version must be a 40-character SHA-1 hash.`,
        );
      }
    }
  }
}
