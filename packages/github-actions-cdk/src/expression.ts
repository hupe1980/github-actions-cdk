export class Expression {
  public static fromSecrets(name: string): string {
    return `\${{ secrets.${name} }}`;
  }

  public static fromEnv(name: string): string {
    return `\${{ env.${name} }}`;
  }

  public static fromGitHub(name: string): string {
    return `\${{ github.${name} }}`;
  }
}
