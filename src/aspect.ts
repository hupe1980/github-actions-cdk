import type { IConstruct } from "constructs";

const ASPECTS_SYMBOL = Symbol("github-actions-cdk.Aspects");

/**
 * Represents an aspect that can visit constructs in the CDK tree.
 */
export interface IAspect {
  /**
   * Visit a specific construct node.
   * @param node The construct to visit.
   */
  visit(node: IConstruct): void;
}

/**
 * Manages aspects applied to CDK construct scopes.
 * Aspects can modify constructs before they are synthesized.
 */
export class Aspects {
  private readonly _aspects: IAspect[] = [];

  private constructor() {}

  /**
   * Retrieves the `Aspects` instance associated with a given construct scope.
   * If no instance exists, it creates one.
   *
   * @param scope The construct scope for which aspects will be managed.
   * @returns The `Aspects` instance for the specified scope.
   */
  public static of(scope: IConstruct): Aspects {
    if (!Reflect.has(scope, ASPECTS_SYMBOL)) {
      Object.defineProperty(scope, ASPECTS_SYMBOL, {
        value: new Aspects(),
        configurable: false,
        enumerable: false,
      });
    }
    return Reflect.get(scope, ASPECTS_SYMBOL);
  }

  /**
   * Adds an aspect to be applied to this scope before synthesis.
   *
   * @param aspect The aspect to add.
   */
  public add(aspect: IAspect): void {
    this._aspects.push(aspect);
  }

  /**
   * Retrieves all aspects directly applied to this scope.
   *
   * @returns An array of all aspects applied.
   */
  public get all(): IAspect[] {
    return [...this._aspects];
  }
}
