import { Construct, type IConstruct } from "constructs";

// Unique symbol used to mark an object as a Component
const COMPONENT_SYMBOL = Symbol.for("github-actions-cdk.Component");

// WeakMap to track auto-generated component IDs for each construct scope
const autoIds = new WeakMap<IConstruct, number>();

/**
 * Generates a unique, incremented ID for components within a given scope.
 *
 * This function uses a WeakMap to track the latest ID for each scope and increments
 * it each time a new ID is generated within that scope.
 *
 * @param scope - The construct scope in which the component ID is generated.
 * @returns A unique component ID as a string.
 */
const generateComponentId = (scope: IConstruct): string => {
  const nextId = (autoIds.get(scope) ?? 0) + 1;
  autoIds.set(scope, nextId);
  return `AutoId${nextId}`;
};

/**
 * Represents a GitHub Actions CDK Component, extending the base `Construct` class.
 *
 * The `Component` class serves as a foundational construct within GitHub Actions workflows
 * and adds unique identifiers, type metadata, and markers for internal component
 * identification.
 */
export class Component extends Construct {
  /**
   * Checks if an object is an instance of `Component`.
   *
   * This static method uses a unique symbol to verify if the input object has
   * been marked as a `Component`.
   *
   * @param x - The object to check.
   * @returns `true` if `x` is a `Component`; otherwise, `false`.
   */
  public static isComponent(x: unknown): x is Component {
    return x !== null && typeof x === "object" && COMPONENT_SYMBOL in x;
  }

  /**
   * Initializes a new `Component` instance.
   *
   * @param scope - The scope in which this component is defined.
   * @param id - The unique identifier for this component. If not provided, an auto-generated
   * ID is used based on the component name and scope.
   */
  constructor(scope: IConstruct, id?: string) {
    super(scope, id || `${new.target.name}#${generateComponentId(scope)}`);

    // Marks the construct scope with the COMPONENT_SYMBOL to indicate it's a Component
    Object.defineProperty(scope, COMPONENT_SYMBOL, { value: true });

    // Adds metadata for internal tracking of the component type and construct name
    this.node.addMetadata("type", "component");
    this.node.addMetadata("construct", new.target.name);
  }
}
