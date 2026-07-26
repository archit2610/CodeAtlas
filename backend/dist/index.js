import "dotenv/config";
import app from "./app.js";
import { cleanupExpiredRepositories } from "./services/cleanup.service.js";
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
    // Run cleanup job on startup and every 1 hour (3600000 ms)
    cleanupExpiredRepositories();
    setInterval(() => {
        cleanupExpiredRepositories();
    }, 60 * 60 * 1000);
});
//# sourceMappingURL=index.js.map