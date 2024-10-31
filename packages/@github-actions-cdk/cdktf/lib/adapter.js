"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdktfAdapter = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const cdktf_1 = require("cdktf");
const github_actions_cdk_1 = require("github-actions-cdk");
class CdktfAdapter extends github_actions_cdk_1.Project {
    static [JSII_RTTI_SYMBOL_1] = { fqn: "@github-actions-cdk/cdktf.CdktfAdapter", version: "0.0.19" };
    awsCdkScope;
    hasValidationErrors;
    constructor(awsCdkScope, props = {}) {
        super(props);
        this.awsCdkScope = awsCdkScope;
        this.hasValidationErrors = false;
        cdktf_1.Aspects.of(this.awsCdkScope).add({
            visit: (node) => {
                if (node === this.awsCdkScope) {
                    this.synth();
                }
            },
        });
    }
    handleSynthesisError(error) {
        if ((0, github_actions_cdk_1.isValidationError)(error)) {
            this.hasValidationErrors = true;
            this.awsCdkScope.node.addValidation({
                validate: () => {
                    return error.errors.map(({ message, source }) => `- [${source.node.path}]: ${message}`);
                },
            });
        }
        else {
            throw error;
        }
    }
    finalizeSynthesis() {
        const workflows = Object.values(this.manifest.workflows);
        for (const workflow of workflows) {
            for (const annotation of workflow.annotations) {
                switch (annotation.level) {
                    case github_actions_cdk_1.AnnotationMetadataEntryType.INFO:
                        cdktf_1.Annotations.of(this.awsCdkScope).addInfo(annotation.message);
                        break;
                    case github_actions_cdk_1.AnnotationMetadataEntryType.WARN:
                        cdktf_1.Annotations.of(this.awsCdkScope).addWarning(annotation.message);
                        break;
                    case github_actions_cdk_1.AnnotationMetadataEntryType.ERROR:
                        cdktf_1.Annotations.of(this.awsCdkScope).addError(annotation.message);
                        break;
                    default:
                        throw new Error(`Unknown annotation level: ${annotation.level}`);
                }
            }
        }
        if (!this.continueOnErrorAnnotations && this.manifest.hasErrorAnnotation()) {
            return;
        }
        if (this.hasValidationErrors) {
            return;
        }
        cdktf_1.Annotations.of(this.awsCdkScope).addInfo(`GitHub Actions workflows generated at ${this.outdir}`);
    }
}
exports.CdktfAdapter = CdktfAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSxpQ0FBNkM7QUFFN0MsMkRBSzRCO0FBRTVCLE1BQWEsWUFBYSxTQUFRLDRCQUFPOztJQUN0QixXQUFXLENBQWE7SUFDakMsbUJBQW1CLENBQVU7SUFFckMsWUFBWSxXQUFzQixFQUFFLFFBQXNCLEVBQUU7UUFDMUQsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRWIsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDL0IsSUFBSSxDQUFDLG1CQUFtQixHQUFHLEtBQUssQ0FBQztRQUVqQyxlQUFPLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUM7WUFDL0IsS0FBSyxFQUFFLENBQUMsSUFBZ0IsRUFBRSxFQUFFO2dCQUMxQixJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQzlCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDZixDQUFDO1lBQ0gsQ0FBQztTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFUyxvQkFBb0IsQ0FBQyxLQUFjO1FBQzNDLElBQUksSUFBQSxzQ0FBaUIsRUFBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7WUFDaEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO2dCQUNsQyxRQUFRLEVBQUUsR0FBRyxFQUFFO29CQUNiLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUMxRixDQUFDO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQzthQUFNLENBQUM7WUFDTixNQUFNLEtBQUssQ0FBQztRQUNkLENBQUM7SUFDSCxDQUFDO0lBRVMsaUJBQWlCO1FBQ3pCLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN6RCxLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRSxDQUFDO1lBQ2pDLEtBQUssTUFBTSxVQUFVLElBQUksUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUM5QyxRQUFRLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDekIsS0FBSyxnREFBMkIsQ0FBQyxJQUFJO3dCQUNuQyxtQkFBVyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDN0QsTUFBTTtvQkFDUixLQUFLLGdEQUEyQixDQUFDLElBQUk7d0JBQ25DLG1CQUFXLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUNoRSxNQUFNO29CQUNSLEtBQUssZ0RBQTJCLENBQUMsS0FBSzt3QkFDcEMsbUJBQVcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQzlELE1BQU07b0JBQ1I7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQ3JFLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsMEJBQTBCLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLENBQUM7WUFDM0UsT0FBTztRQUNULENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQzdCLE9BQU87UUFDVCxDQUFDO1FBRUQsbUJBQVcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLE9BQU8sQ0FDdEMseUNBQXlDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FDdkQsQ0FBQztJQUNKLENBQUM7O0FBL0RILG9DQWdFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFubm90YXRpb25zLCBBc3BlY3RzIH0gZnJvbSBcImNka3RmXCI7XG5pbXBvcnQgdHlwZSB7IENvbnN0cnVjdCwgSUNvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCI7XG5pbXBvcnQge1xuICBBbm5vdGF0aW9uTWV0YWRhdGFFbnRyeVR5cGUsXG4gIFByb2plY3QsXG4gIHR5cGUgUHJvamVjdFByb3BzLFxuICBpc1ZhbGlkYXRpb25FcnJvcixcbn0gZnJvbSBcImdpdGh1Yi1hY3Rpb25zLWNka1wiO1xuXG5leHBvcnQgY2xhc3MgQ2RrdGZBZGFwdGVyIGV4dGVuZHMgUHJvamVjdCB7XG4gIHByaXZhdGUgcmVhZG9ubHkgYXdzQ2RrU2NvcGU6IElDb25zdHJ1Y3Q7XG4gIHByaXZhdGUgaGFzVmFsaWRhdGlvbkVycm9yczogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3Rvcihhd3NDZGtTY29wZTogQ29uc3RydWN0LCBwcm9wczogUHJvamVjdFByb3BzID0ge30pIHtcbiAgICBzdXBlcihwcm9wcyk7XG5cbiAgICB0aGlzLmF3c0Nka1Njb3BlID0gYXdzQ2RrU2NvcGU7XG4gICAgdGhpcy5oYXNWYWxpZGF0aW9uRXJyb3JzID0gZmFsc2U7XG5cbiAgICBBc3BlY3RzLm9mKHRoaXMuYXdzQ2RrU2NvcGUpLmFkZCh7XG4gICAgICB2aXNpdDogKG5vZGU6IElDb25zdHJ1Y3QpID0+IHtcbiAgICAgICAgaWYgKG5vZGUgPT09IHRoaXMuYXdzQ2RrU2NvcGUpIHtcbiAgICAgICAgICB0aGlzLnN5bnRoKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgaGFuZGxlU3ludGhlc2lzRXJyb3IoZXJyb3I6IHVua25vd24pOiB2b2lkIHtcbiAgICBpZiAoaXNWYWxpZGF0aW9uRXJyb3IoZXJyb3IpKSB7XG4gICAgICB0aGlzLmhhc1ZhbGlkYXRpb25FcnJvcnMgPSB0cnVlO1xuICAgICAgdGhpcy5hd3NDZGtTY29wZS5ub2RlLmFkZFZhbGlkYXRpb24oe1xuICAgICAgICB2YWxpZGF0ZTogKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBlcnJvci5lcnJvcnMubWFwKCh7IG1lc3NhZ2UsIHNvdXJjZSB9KSA9PiBgLSBbJHtzb3VyY2Uubm9kZS5wYXRofV06ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgZmluYWxpemVTeW50aGVzaXMoKTogdm9pZCB7XG4gICAgY29uc3Qgd29ya2Zsb3dzID0gT2JqZWN0LnZhbHVlcyh0aGlzLm1hbmlmZXN0LndvcmtmbG93cyk7XG4gICAgZm9yIChjb25zdCB3b3JrZmxvdyBvZiB3b3JrZmxvd3MpIHtcbiAgICAgIGZvciAoY29uc3QgYW5ub3RhdGlvbiBvZiB3b3JrZmxvdy5hbm5vdGF0aW9ucykge1xuICAgICAgICBzd2l0Y2ggKGFubm90YXRpb24ubGV2ZWwpIHtcbiAgICAgICAgICBjYXNlIEFubm90YXRpb25NZXRhZGF0YUVudHJ5VHlwZS5JTkZPOlxuICAgICAgICAgICAgQW5ub3RhdGlvbnMub2YodGhpcy5hd3NDZGtTY29wZSkuYWRkSW5mbyhhbm5vdGF0aW9uLm1lc3NhZ2UpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBBbm5vdGF0aW9uTWV0YWRhdGFFbnRyeVR5cGUuV0FSTjpcbiAgICAgICAgICAgIEFubm90YXRpb25zLm9mKHRoaXMuYXdzQ2RrU2NvcGUpLmFkZFdhcm5pbmcoYW5ub3RhdGlvbi5tZXNzYWdlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgQW5ub3RhdGlvbk1ldGFkYXRhRW50cnlUeXBlLkVSUk9SOlxuICAgICAgICAgICAgQW5ub3RhdGlvbnMub2YodGhpcy5hd3NDZGtTY29wZSkuYWRkRXJyb3IoYW5ub3RhdGlvbi5tZXNzYWdlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYW5ub3RhdGlvbiBsZXZlbDogJHthbm5vdGF0aW9uLmxldmVsfWApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmNvbnRpbnVlT25FcnJvckFubm90YXRpb25zICYmIHRoaXMubWFuaWZlc3QuaGFzRXJyb3JBbm5vdGF0aW9uKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNWYWxpZGF0aW9uRXJyb3JzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgQW5ub3RhdGlvbnMub2YodGhpcy5hd3NDZGtTY29wZSkuYWRkSW5mbyhcbiAgICAgIGBHaXRIdWIgQWN0aW9ucyB3b3JrZmxvd3MgZ2VuZXJhdGVkIGF0ICR7dGhpcy5vdXRkaXJ9YCxcbiAgICApO1xuICB9XG59XG4iXX0=