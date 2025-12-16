"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const prisma_1 = __importDefault(require("./prisma/prisma"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Test database connection
prisma_1.default.$connect()
    .then(() => {
    console.log('✓ Database connection successful');
})
    .catch((error) => {
    console.error('✗ Database connection failed:', error);
});
// Routes
const documents_routes_1 = __importDefault(require("./routes/documents.routes"));
const rag_routes_1 = __importDefault(require("./routes/rag.routes"));
const workspace_routes_1 = __importDefault(require("./routes/workspace.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
app.use('/documents', documents_routes_1.default);
app.use("/rag", rag_routes_1.default);
app.use('/workspaces', workspace_routes_1.default);
app.use('/auth', auth_routes_1.default);
// Test endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Server is running', routes: ['/auth/register', '/auth/login'] });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Available routes:');
    console.log('  POST /auth/register');
    console.log('  POST /auth/login');
});
//# sourceMappingURL=index.js.map