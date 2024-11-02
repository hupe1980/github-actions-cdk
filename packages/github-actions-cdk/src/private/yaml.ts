import * as fs from "node:fs";
import * as YAML from "yaml";

export class YamlFile {
  constructor(
    private readonly filePath: string,
    private readonly obj: Record<string, unknown>,
    private readonly commentAtTop?: string,
  ) {}

  public toYaml(): string {
    const yamlDoc = new YAML.Document(this.obj);
    yamlDoc.commentBefore = this.commentAtTop ?? null;

    return yamlDoc.toString({
      commentString: this.formatComment,
      indent: 2,
    });
  }

  public writeFile(): void {
    fs.writeFileSync(this.filePath, this.toYaml(), { encoding: "utf8" });
  }

  private formatComment(comment: string): string {
    return comment
      .split("\n")
      .map((line) => (line ? `# ${line}` : ""))
      .join("\n");
  }
}
