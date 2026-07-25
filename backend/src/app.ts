import express from "express";
import cookieparser from "cookie-parser";
import cors from "cors";
import Reports from "./routes/report.router.js";
import Conversation from "./routes/conversation.router.js";
import Repositories from "./routes/repository.router.js";
import AgentRuns from "./routes/agent-run.router.js";
import { ApiError } from "./utils/api-error.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(express.json());
app.use(cookieparser());

app.use("/api/v1/reports/", Reports);
app.use("/api/v1/conversations/", Conversation);
app.use("/api/v1/repositories/", Repositories);
app.use("/api/v1/", AgentRuns);

app.get("/health", (req, res) => {
    res.json({
        success: true,
        status: "healthy",
        engine: "CodeAtlas Intelligence Engine",
        timestamp: new Date().toISOString()
    });
});

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "CodeAtlas Backend is running 🚀",
    });
});

app.use((err: ApiError, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const status = err.statusCode ?? 500;
    res.status(status).json({ success: false, message: err.message, errors: err.errors });
});

export default app;
