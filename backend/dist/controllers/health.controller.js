"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const healthController = async (req, res) => {
    const timestamp = new Date().toISOString();
    let databaseStatus = 'unknown';
    try {
        await prisma.$queryRaw `SELECT 1`;
        databaseStatus = 'connected';
    }
    catch (e) {
        databaseStatus = 'disconnected';
    }
    const status = databaseStatus === 'connected' ? 'ok' : 'degraded';
    res.json({
        status,
        database: databaseStatus,
        timestamp,
    });
};
exports.healthController = healthController;
//# sourceMappingURL=health.controller.js.map