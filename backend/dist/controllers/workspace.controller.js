"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWorkspace = exports.updateWorkspace = exports.getWorkspace = exports.getWorkspaces = exports.createWorkspace = void 0;
const prisma_1 = __importDefault(require("../prisma/prisma"));
// Create a new workspace for the authenticated user
const createWorkspace = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Workspace name is required' });
        }
        const workspace = await prisma_1.default.workspace.create({
            data: {
                name,
                ownerId: userId,
            },
        });
        return res.status(201).json({ message: 'Workspace created', workspace });
    }
    catch (error) {
        console.error('Workspace creation error:', error);
        return res.status(500).json({ error: 'Failed to create workspace', details: error.message });
    }
};
exports.createWorkspace = createWorkspace;
// Get all workspaces for the authenticated user
const getWorkspaces = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const workspaces = await prisma_1.default.workspace.findMany({
            where: {
                ownerId: userId,
            },
            include: {
                documents: {
                    select: {
                        id: true,
                        title: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return res.json({ workspaces });
    }
    catch (error) {
        console.error('Get workspaces error:', error);
        return res.status(500).json({ error: 'Failed to fetch workspaces', details: error.message });
    }
};
exports.getWorkspaces = getWorkspaces;
// Get a specific workspace by ID (if user owns it)
const getWorkspace = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id } = req.params;
        const workspace = await prisma_1.default.workspace.findFirst({
            where: {
                id,
                ownerId: userId,
            },
            include: {
                documents: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }
        return res.json({ workspace });
    }
    catch (error) {
        console.error('Get workspace error:', error);
        return res.status(500).json({ error: 'Failed to fetch workspace', details: error.message });
    }
};
exports.getWorkspace = getWorkspace;
// Update workspace name
const updateWorkspace = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Workspace name is required' });
        }
        const workspace = await prisma_1.default.workspace.updateMany({
            where: {
                id,
                ownerId: userId,
            },
            data: {
                name,
            },
        });
        if (workspace.count === 0) {
            return res.status(404).json({ error: 'Workspace not found' });
        }
        const updatedWorkspace = await prisma_1.default.workspace.findUnique({
            where: { id },
        });
        return res.json({ message: 'Workspace updated', workspace: updatedWorkspace });
    }
    catch (error) {
        console.error('Update workspace error:', error);
        return res.status(500).json({ error: 'Failed to update workspace', details: error.message });
    }
};
exports.updateWorkspace = updateWorkspace;
// Delete workspace
const deleteWorkspace = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id } = req.params;
        const workspace = await prisma_1.default.workspace.findFirst({
            where: {
                id,
                ownerId: userId,
            },
        });
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }
        await prisma_1.default.workspace.delete({
            where: { id },
        });
        return res.json({ message: 'Workspace deleted' });
    }
    catch (error) {
        console.error('Delete workspace error:', error);
        return res.status(500).json({ error: 'Failed to delete workspace', details: error.message });
    }
};
exports.deleteWorkspace = deleteWorkspace;
//# sourceMappingURL=workspace.controller.js.map