import { createApp } from "../server/_core/index";

let app: any;

try {
    const result = await createApp();
    app = result.app;
} catch (error) {
    console.error("[Vercel Startup Error]", error);
    // Fallback handler if initialization fails
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
