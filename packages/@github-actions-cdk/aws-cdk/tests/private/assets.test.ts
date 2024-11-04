import type { StackAsset } from "aws-cdk-lib/pipelines";
import { PublishAssetScriptGenerator } from "../../src/private/assets";

describe("PublishAssetScriptGenerator", () => {
  const cdkoutDir = "/mock/cdkout";
  const mockAssets = [
    {
      assetId: "asset1",
      assetManifestPath: "/mock/cdkout/foo/asset1.json",
      assetSelector: "selector1-foo",
      isTemplate: true,
    },
    {
      assetId: "asset2",
      assetManifestPath: "/mock/cdkout/bar/asset2.json",
      assetSelector: "selector2-bar",
      isTemplate: true,
    },
    {
      assetId: "asset3",
      assetManifestPath: "/mock/cdkout/foo/asset3.json",
      assetSelector: "selector3-foo",
      isTemplate: false,
    },
    {
      assetId: "asset3",
      assetManifestPath: "/mock/cdkout/bar/asset3.json",
      assetSelector: "selector3-bar",
      isTemplate: false,
    },
    {
      assetId: "asset4",
      assetManifestPath: "/mock/cdkout/foo/asset4.json",
      assetSelector: "selector4-foo",
      isTemplate: false,
    },
    {
      assetId: "asset4",
      assetManifestPath: "/mock/cdkout/bar/asset4.json",
      assetSelector: "selector4-bar",
      isTemplate: false,
    },
  ];

  describe("generatePublishScripts", () => {
    it("should generate a single script with correct commands for each asset", () => {
      const generator = new PublishAssetScriptGenerator(cdkoutDir, mockAssets as StackAsset[]);

      const expectedScriptContent = [
        "set -ex",
        'npx cdk-assets --path "/mock/cdkout/foo/asset1.json" --verbose publish "selector1-foo"',
        'npx cdk-assets --path "/mock/cdkout/bar/asset2.json" --verbose publish "selector2-bar"',
        'npx cdk-assets --path "/mock/cdkout/foo/asset3.json" --verbose publish "selector3-foo"',
        'npx cdk-assets --path "/mock/cdkout/bar/asset3.json" --verbose publish "selector3-bar"',
        'npx cdk-assets --path "/mock/cdkout/foo/asset4.json" --verbose publish "selector4-foo"',
        'npx cdk-assets --path "/mock/cdkout/bar/asset4.json" --verbose publish "selector4-bar"',
        "echo 'asset-hash-1=asset1' >> $GITHUB_OUTPUT",
        "echo 'asset-hash-2=asset2' >> $GITHUB_OUTPUT",
      ].join("\n");

      expect(generator.content).toEqual(expectedScriptContent);
      expect(generator.assetIdMap.get("asset1")).toEqual("asset-hash-1");
      expect(generator.assetIdMap.get("asset2")).toEqual("asset-hash-2");
    });
  });
});
