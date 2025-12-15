import express from "express";
import issue from "./routes/issue.js";
import validate from "./routes/validate.js";
import health from "./routes/health.js";
import secureHeaders from "./middleware/headers.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(secureHeaders);

app.post("/issue", issue);
app.post("/validate", validate);
app.get("/health", health);

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`Railway backend listening on port ${PORT}`));
