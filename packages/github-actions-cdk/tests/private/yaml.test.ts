import { YamlGenerator } from "../../src/private/yaml";

describe("YamlGenerator", () => {
  it("converts a basic JavaScript object to YAML", () => {
    const obj = { name: "example", version: 1 };
    const generator = new YamlGenerator(obj);
    const yamlOutput = generator.toYaml();

    expect(yamlOutput).toContain("name: example");
    expect(yamlOutput).toContain("version: 1");
  });

  it("adds a multiline comment at the top of the YAML document", () => {
    const obj = { name: "example", version: 1 };
    const generator = new YamlGenerator(obj);
    const comment = "This is a test comment.\nIt has multiple lines.";
    generator.setCommentAtTop(comment);

    const yamlOutput = generator.toYaml();
    const expectedComment = "# This is a test comment.\n# It has multiple lines.";
    expect(yamlOutput.startsWith(expectedComment)).toBe(true);
  });

  it("does not add a comment if none is provided", () => {
    const obj = { name: "example", version: 1 };
    const generator = new YamlGenerator(obj);

    const yamlOutput = generator.toYaml();
    expect(yamlOutput.startsWith("#")).toBe(false);
    expect(yamlOutput).toContain("name: example");
    expect(yamlOutput).toContain("version: 1");
  });

  it("handles empty objects gracefully", () => {
    const obj = {};
    const generator = new YamlGenerator(obj);
    const yamlOutput = generator.toYaml();

    expect(yamlOutput.trim()).toBe("{}");
  });
});
