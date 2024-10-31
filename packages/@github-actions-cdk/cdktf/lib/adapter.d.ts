import type { Construct } from "constructs";
import { Project, type ProjectProps } from "github-actions-cdk";
export declare class CdktfAdapter extends Project {
    private readonly awsCdkScope;
    private hasValidationErrors;
    constructor(awsCdkScope: Construct, props?: ProjectProps);
    protected handleSynthesisError(error: unknown): void;
    protected finalizeSynthesis(): void;
}
