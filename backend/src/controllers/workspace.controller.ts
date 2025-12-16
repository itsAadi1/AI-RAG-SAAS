import { Request, Response } from 'express';
import prisma from '../prisma/prisma';

// Create a new workspace for the authenticated user
export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        ownerId: userId,
      },
    });

    return res.status(201).json({ message: 'Workspace created', workspace });
  } catch (error: any) {
    console.error('Workspace creation error:', error);
    return res.status(500).json({ error: 'Failed to create workspace', details: error.message });
  }
};

// Get all workspaces for the authenticated user
export const getWorkspaces = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const workspaces = await prisma.workspace.findMany({
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
  } catch (error: any) {
    console.error('Get workspaces error:', error);
    return res.status(500).json({ error: 'Failed to fetch workspaces', details: error.message });
  }
};

// Get a specific workspace by ID (if user owns it)
export const getWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const workspace = await prisma.workspace.findFirst({
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
  } catch (error: any) {
    console.error('Get workspace error:', error);
    return res.status(500).json({ error: 'Failed to fetch workspace', details: error.message });
  }
};

// Update workspace name
export const updateWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    const workspace = await prisma.workspace.updateMany({
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

    const updatedWorkspace = await prisma.workspace.findUnique({
      where: { id },
    });

    return res.json({ message: 'Workspace updated', workspace: updatedWorkspace });
  } catch (error: any) {
    console.error('Update workspace error:', error);
    return res.status(500).json({ error: 'Failed to update workspace', details: error.message });
  }
};

// Delete workspace
export const deleteWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const workspace = await prisma.workspace.findFirst({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    await prisma.workspace.delete({
      where: { id },
    });

    return res.json({ message: 'Workspace deleted' });
  } catch (error: any) {
    console.error('Delete workspace error:', error);
    return res.status(500).json({ error: 'Failed to delete workspace', details: error.message });
  }
};

