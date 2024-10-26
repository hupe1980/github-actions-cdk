import { RootConstruct } from "constructs";
import { AnnotationMetadataEntryType, Annotations, DISABLE_STACK_TRACE_IN_METADATA } from "../src";

describe("Annotations", () => {
  let dummyConstruct: RootConstruct;
  let annotations: Annotations;

  beforeEach(() => {
    dummyConstruct = new RootConstruct("Dummy");
    annotations = Annotations.of(dummyConstruct);
  });

  test("should add info message correctly", () => {
    const message = "This is an info message.";
    const addMetadataSpy = jest.spyOn(dummyConstruct.node, "addMetadata");

    annotations.addInfo(message);

    expect(addMetadataSpy).toHaveBeenCalledWith(AnnotationMetadataEntryType.INFO, message, {
      stackTrace: true,
    });

    addMetadataSpy.mockRestore();
  });

  test("should add warning message correctly", () => {
    const message = "This is a warning message.";
    const addMetadataSpy = jest.spyOn(dummyConstruct.node, "addMetadata");

    annotations.addWarning(message);

    expect(addMetadataSpy).toHaveBeenCalledWith(AnnotationMetadataEntryType.WARN, message, {
      stackTrace: true,
    });

    addMetadataSpy.mockRestore();
  });

  test("should add error message correctly", () => {
    const message = "This is an error message.";
    const addMetadataSpy = jest.spyOn(dummyConstruct.node, "addMetadata");

    annotations.addError(message);

    expect(addMetadataSpy).toHaveBeenCalledWith(AnnotationMetadataEntryType.ERROR, message, {
      stackTrace: true,
    });

    addMetadataSpy.mockRestore();
  });

  test("should respect stack trace setting", () => {
    const addMetadataSpy = jest.spyOn(dummyConstruct.node, "addMetadata");
    dummyConstruct.node.setContext(DISABLE_STACK_TRACE_IN_METADATA, true);

    const annotationsWithDisabledStackTrace = Annotations.of(dummyConstruct);
    annotationsWithDisabledStackTrace.addInfo("Info with stack trace disabled");

    expect(addMetadataSpy).toHaveBeenCalledWith(
      AnnotationMetadataEntryType.INFO,
      "Info with stack trace disabled",
      { stackTrace: false },
    );

    addMetadataSpy.mockRestore();
  });

  test("should enable stack trace by default", () => {
    const message = "Info with stack trace enabled";
    const addMetadataSpy = jest.spyOn(dummyConstruct.node, "addMetadata");

    annotations.addInfo(message);

    expect(addMetadataSpy).toHaveBeenCalledWith(AnnotationMetadataEntryType.INFO, message, {
      stackTrace: true,
    });

    addMetadataSpy.mockRestore();
  });
});
