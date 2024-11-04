import * as YAML from "yaml";

/**
 * A helper class for generating YAML content from a JavaScript object,
 * with support for adding a formatted comment at the top of the YAML document.
 */
export class YamlGenerator {
  private commentAtTop?: string;

  /**
   * Initializes a new instance of the `YamlGenerator` class.
   *
   * @param obj - The JavaScript object to convert to YAML.
   */
  constructor(private readonly obj: Record<string, unknown>) {}

  /**
   * Sets a comment to appear at the top of the generated YAML document.
   *
   * @param comment - The comment string to add. This can be multiline, and each line
   * will be prefixed with `#` in the output YAML.
   */
  public setCommentAtTop(comment: string): void {
    this.commentAtTop = comment;
  }

  /**
   * Converts the stored JavaScript object to a YAML string.
   *
   * @returns A YAML-formatted string representation of the object, including an optional
   * comment at the top if specified.
   *
   * @remarks
   * This method converts the JavaScript object into a YAML document. If a top comment is set,
   * it formats the comment using the `formatComment` method to ensure each line is prefixed with `#`.
   */
  public toYaml(): string {
    const yamlDoc = new YAML.Document(this.obj);

    // Adds the comment to the beginning of the YAML document if provided.
    if (this.commentAtTop) {
      yamlDoc.commentBefore = this.formatComment(this.commentAtTop);
    }

    // Returns the YAML string with specified formatting options.
    return yamlDoc.toString({
      indent: 2,
    });
  }

  /**
   * Formats a given comment string to YAML format, prefixing each line with `#`.
   *
   * @param comment - The comment string to format. Can contain multiple lines.
   * @returns The formatted comment string with each line prefixed by `#`.
   */
  private formatComment(comment: string): string {
    return comment
      .split("\n")
      .map((line) => (line ? `# ${line}` : ""))
      .join("\n");
  }
}
