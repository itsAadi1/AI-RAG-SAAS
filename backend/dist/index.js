"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
const documents_routes_1 = __importDefault(require("./routes/documents.routes"));
const rag_routes_1 = __importDefault(require("./routes/rag.routes"));
app.use('/documents', documents_routes_1.default);
app.use("/rag", rag_routes_1.default);
app.listen(3000, () => console.log("Server running on port 3000"));
//# sourceMappingURL=index.js.map