import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

export const roleEngineRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        topic: z.string().min(1, "Topic is required"),
        masterPrompt: z.string().min(1, "Master prompt is required"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Call Kimi AI via the LLM helper (which uses Groq API)
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: input.masterPrompt,
            },
            {
              role: "user",
              content: `Create a complete role-based AI persona package for: ${input.topic}`,
            },
          ],
        });

        // Extract the text content from the response
        const content = response.choices[0]?.message.content;
        let text = "";
        
        if (typeof content === "string") {
          text = content;
        } else if (Array.isArray(content)) {
          // Extract text from content array
          text = content
            .filter((c) => "text" in c)
            .map((c) => ("text" in c ? c.text : ""))
            .join("");
        }

        // Clean up markdown formatting if present
        const clean = text.replace(/```json|```/g, "").trim();

        // Parse the JSON response
        const parsed = JSON.parse(clean);

        return {
          success: true,
          data: parsed,
        };
      } catch (error) {
        console.error("[Role Engine] Generation failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate role",
          data: null,
        };
      }
    }),
});
