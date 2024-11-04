import * as fs from "node:fs";
import * as path from "node:path";
import type { StackAsset } from "aws-cdk-lib/pipelines";

// Constants
/**
 * The prefix used for asset hash names in the generated script.
 */
const ASSET_HASH_NAME = "asset-hash";

/**
 * Converts a given path to POSIX format (using forward slashes).
 *
 * @param p - The input path.
 * @returns The path in POSIX format.
 */
const posixPath = (p: string) => p.split(path.sep).join(path.posix.sep);

/**
 * A helper class that generates a single script file required to publish assets.
 */
export class PublishAssetScriptGenerator {
  /**
   * A map that stores unique asset IDs and their corresponding output variable names.
   */
  public readonly assetIdMap: Map<string, string>;

  /**
   * The complete script content that will be written to a file.
   */
  public readonly content: string;

  /**
   * Constructs a new instance of the `PublishAssetScriptGenerator` class.
   *
   * @param cdkoutDir - The output directory for CDK assets.
   * @param assets - A list of `StackAsset` objects to be published.
   * @param addOnlyTemplatesToOutput - If `true`, only assets marked as templates will be added to the output map.
   */
  constructor(
    private readonly cdkoutDir: string,
    private readonly assets: StackAsset[],
    private readonly addOnlyTemplatesToOutput: boolean = true,
  ) {
    this.assetIdMap = new Map();
    this.content = this.generatePublishScripts();
  }

  /**
   * Generates the publish commands for each asset and stores them as script content.
   *
   * @returns A string representing all commands to be included in the publish script.
   *
   * @remarks
   * The method iterates over each asset, creating a publish command for it, and appends it to
   * the list of script commands. If `addOnlyTemplatesToOutput` is set to `true`, only assets
   * marked as templates are added to the `assetIdMap` for outputting.
   */
  private generatePublishScripts(): string {
    const commands: string[] = ["set -ex"];

    for (const asset of this.assets) {
      const { assetId, assetManifestPath, assetSelector } = asset;

      // Command to publish asset
      commands.push(
        `npx cdk-assets --path "${this.relativeToAssembly(assetManifestPath)}" --verbose publish "${assetSelector}"`,
      );

      // Add asset ID to output map if criteria met
      if (!this.assetIdMap.has(assetId) && (!this.addOnlyTemplatesToOutput || asset.isTemplate)) {
        const assetOutputName = `${ASSET_HASH_NAME}-${this.assetIdMap.size + 1}`;
        this.assetIdMap.set(assetId, assetOutputName);
      }
    }

    // Append commands to output each asset's hash
    this.assetIdMap.forEach((assetOutputName, assetId) => {
      commands.push(`echo '${assetOutputName}=${assetId}' >> $GITHUB_OUTPUT`);
    });

    return commands.join("\n");
  }

  /**
   * Writes the generated publish script content to a specified file.
   *
   * @param filePath - The path where the script file should be saved.
   *
   * @remarks
   * This method creates the necessary directories if they do not exist and writes
   * the accumulated `content` to the specified file path.
   */
  public writePublishScript(filePath: string): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, this.content, { encoding: "utf-8" });
  }

  /**
   * Returns the path to an asset relative to the assembly directory.
   *
   * @param p - The absolute path to an asset.
   * @returns The path relative to the assembly directory in POSIX format.
   */
  private relativeToAssembly(p: string): string {
    return posixPath(path.join(this.cdkoutDir, path.relative(path.resolve(this.cdkoutDir), p)));
  }
}
