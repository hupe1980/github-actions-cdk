import type { IConstruct } from "constructs";
import { Annotations } from "./annotations";
import type { IAspect } from "./aspect";

/**
 * Base class for configurable check aspects.
 */
export abstract class Check implements IAspect {
  /**
   * Default error level.
   */
  protected readonly level: "error" | "warning" | "info";

  constructor(level: "error" | "warning" | "info" = "error") {
    this.level = level;
  }

  /**
   * Abstract visit method to be implemented by subclasses, providing the node to check.
   */
  abstract visit(node: IConstruct): void;

  /**
   * Adds a message with the configured level to the node's annotations.
   *
   * @param node - The construct node to annotate.
   * @param message - The message to add.
   */
  protected annotate(node: IConstruct, message: string): void {
    const annotations = Annotations.of(node);
    if (this.level === "error") {
      annotations.addError(message);
    } else if (this.level === "warning") {
      annotations.addWarning(message);
    } else if (this.level === "info") {
      annotations.addInfo(message);
    }
  }
}
