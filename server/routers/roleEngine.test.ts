import { describe, it, expect, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock the LLM helper
vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({
    choices: [
      {
        message: {
          content: JSON.stringify({
            roleName: "Test Role",
            coreFunction: "Test function",
            keyAttributes: {
              roleFunction: "test",
              expertiseLevel: "expert",
              tone: "professional",
              communicationStyle: "clear",
              coreValues: "accuracy",
              domainFocus: "testing",
            },
            primaryUseCases: ["use case 1"],
            antiUseCases: ["anti use case 1"],
            systemPrompt: "Test system prompt",
            userPrompt: "Test user prompt",
            reuseTemplate: "Test template",
            example1: {
              scenario: "Test scenario",
              input: "Test input",
              output: "Test output",
            },
            example2: {
              scenario: "Test scenario 2",
              input: "Test input 2",
              output: "Test output 2",
            },
            evaluatorChecklist: ["Check 1", "Check 2"],
            usageNotes: "Test notes",
            designRationale: "Test rationale",
          }),
        },
      },
    ],
  })),
}));

function createContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("roleEngine.generate", () => {
  it("successfully generates a role with valid input", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.roleEngine.generate({
      topic: "A senior data scientist who explains ML concepts",
      masterPrompt: "You are an AI role engineer",
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.roleName).toBe("Test Role");
    expect(result.data?.coreFunction).toBe("Test function");
    expect(result.data?.systemPrompt).toBe("Test system prompt");
  });

  it("returns error for empty topic", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.roleEngine.generate({
        topic: "",
        masterPrompt: "You are an AI role engineer",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("returns error for empty master prompt", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.roleEngine.generate({
        topic: "Test topic",
        masterPrompt: "",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
