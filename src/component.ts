import { Construct, type IConstruct } from "constructs";
import { isObject } from "./private/utils";

// Unique symbol used to mark an object as a Component
const COMPONENT_SYMBOL = Symbol.for("github-actions-cdk.Component");

// WeakMap to track auto-generated component IDs for each construct scope
const autoIds = new WeakMap<IConstruct, number>();

/**
 * Generates a unique, incremented ID for components within a given scope.
 *
 * @param scope - The construct scope in which the component ID is generated.
 * @returns A unique component ID as a string, prefixed with `AutoId`.
 */
const generateComponentId = (scope: IConstruct): string => {
  const nextId = (autoIds.get(scope) ?? 0) + 1;
  autoIds.set(scope, nextId);
  return `AutoId${nextId}`;
};

/**
 * Abstract class representing a GitHub Actions CDK Component.
 *
 * @remarks
 * The `Component` class is a foundational construct for defining reusable elements in
 * GitHub Actions workflows. It extends the base `Construct` class, adding unique
 * identifiers, type metadata, and markers for internal component identification.
 */
export abstract class Component extends Construct {
  /**
   * Checks if an object is an instance of `Component`.
   *
   * @param x - The object to check.
   * @returns `true` if `x` is a `Component`; otherwise, `false`.
   */
  public static isComponent(x: unknown): x is Component {
    return x !== null && typeof x === "object" && COMPONENT_SYMBOL in x;
  }

  /** Holds overrides for properties, allowing deep customization of component configuration. */
  protected readonly rawOverrides: Record<string, unknown>;

  /**
   * Initializes a new `Component` instance.
   *
   * @param scope - The construct scope in which this component is defined.
   * @param id - The unique identifier for this component. If not provided, an auto-generated
   * ID based on the component name and scope will be used.
   */
  constructor(scope: IConstruct, id?: string) {
    super(scope, id || `${new.target.name}#${generateComponentId(scope)}`);

    // Mark the construct scope with COMPONENT_SYMBOL to denote it's a Component
    Object.defineProperty(this, COMPONENT_SYMBOL, { value: true });

    this.rawOverrides = {};

    // Adds metadata for internal tracking of the component's type and construct name
    this.node.addMetadata("type", "component");
    this.node.addMetadata("construct", new.target.name);
  }

  /**
   * @internal
   * Synthesizes the component configuration and merges it with any overrides.
   *
   * @returns A record representing the final configuration of the component.
   */
  public _synth(): Record<string, unknown> {
    // Get the synthesized base configuration
    const baseConfig = this._toRecord();

    // Merge the base configuration with the raw overrides
    return this._mergeRecords(baseConfig, this.rawOverrides);
  }

  /**
   * @internal
   * Internal method to return the base configuration of the component.
   *
   * Subclasses should implement this method to provide the final base configuration
   * of the component, returning a record of key-value pairs representing the component's
   * settings and properties.
   *
   * @returns A record representing the base configuration of the component.
   */
  protected abstract _toRecord(): Record<string, unknown>;

  /**
   * @internal
   * Merges two records into one, with the second record's properties
   * merging into the first in case of conflicts.
   *
   * @param base - The base record to merge from.
   * @param overrides - The record containing overrides to apply.
   * @returns The merged record.
   */
  private _mergeRecords(
    base: Record<string, unknown>,
    overrides: Record<string, unknown>,
  ): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...base };

    for (const key in overrides) {
      if (Object.prototype.hasOwnProperty.call(overrides, key)) {
        const overrideValue = overrides[key];
        const baseValue = merged[key];

        // If both values are objects, merge them recursively
        if (isObject(baseValue) && isObject(overrideValue)) {
          merged[key] = this._mergeRecords(
            baseValue as Record<string, unknown>,
            overrideValue as Record<string, unknown>,
          );
        } else {
          // Otherwise, just set the override value
          merged[key] = overrideValue;
        }
      }
    }

    return merged;
  }

  /**
   * Adds or updates an override to the component configuration at a specified path.
   *
   * @param path - Dot-separated path specifying where the override should be applied.
   * @param value - The value to set at the specified path.
   * @throws Error if the provided path is an empty or non-string value.
   */
  public addOverride(path: string, value: unknown): void {
    if (!path || typeof path !== "string") {
      throw new Error("Path must be a non-empty string");
    }

    const parts = path.split(".");
    let current = this.rawOverrides;

    // Traverse or create nested objects based on path segments
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];

      // Check if the current key holds an object; otherwise, initialize it as an object
      if (typeof current[key] === "object" && current[key] !== null) {
        current = current[key] as Record<string, unknown>;
      } else {
        const newObj: Record<string, unknown> = {};
        current[key] = newObj;
        current = newObj;
      }
    }

    // Set the final value at the last key
    const lastKey = parts[parts.length - 1];
    if (lastKey) {
      current[lastKey] = value;
    }
  }
}
