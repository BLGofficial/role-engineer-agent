import { createApp } from "../server/_core/index.js";

let app;

try {
    const result = await createApp();
    app = result.app;
} catch (error) {
    console.error("[Vercel Startup Error]", error);
    const express = await import("express");
    const fallbackApp = express.default();
    fallbackApp.all("*", (_req, res) => {
        res.status(500).json({
            success: false,
            error: "Server initialization failed. Check Vercel logs.",
            details: error instanceof Error ? error.message : String(error)
        });
    });
    app = fallbackApp;
}

export default app;
