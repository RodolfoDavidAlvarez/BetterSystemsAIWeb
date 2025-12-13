import { Request, Response } from 'express';
import { db } from '../../db/index';
import { documents } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and common documents are allowed.'));
    }
  },
});

// Get documents for an entity
export async function getDocuments(req: Request, res: Response) {
  try {
    const { entityType, entityId } = req.params;

    const entityDocs = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.entityType, entityType),
          eq(documents.entityId, parseInt(entityId)),
          eq(documents.status, 'active')
        )
      )
      .orderBy(desc(documents.createdAt));

    res.json({ success: true, data: entityDocs });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Upload document
export async function uploadDocument(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { entityType, entityId, title, description, category, tags } = req.body;
    const file = req.file;

    // Determine file type from mime type
    let fileType = 'other';
    if (file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (file.mimetype === 'application/pdf') {
      fileType = 'pdf';
    } else if (
      file.mimetype.includes('word') ||
      file.mimetype.includes('document')
    ) {
      fileType = 'doc';
    }

    // Create document record
    const [document] = await db
      .insert(documents)
      .values({
        entityType,
        entityId: parseInt(entityId),
        title: title || file.originalname,
        description,
        fileType,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileUrl: `/uploads/${file.filename}`,
        category,
        tags: tags ? JSON.parse(tags) : [],
        uploadedBy: req.user?.id,
      })
      .returning();

    res.status(201).json({ success: true, data: document });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Delete document
export async function deleteDocument(req: Request, res: Response) {
  try {
    const documentId = parseInt(req.params.id);

    // Get document to find file path
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId));

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Soft delete - mark as deleted
    await db
      .update(documents)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(documents.id, documentId));

    // Optionally delete the physical file
    // const filePath = path.join(process.cwd(), document.fileUrl);
    // await fs.unlink(filePath).catch(console.error);

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Update document metadata
export async function updateDocument(req: Request, res: Response) {
  try {
    const documentId = parseInt(req.params.id);
    const { title, description, category, tags } = req.body;

    const [updatedDoc] = await db
      .update(documents)
      .set({
        title,
        description,
        category,
        tags,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId))
      .returning();

    if (!updatedDoc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    res.json({ success: true, data: updatedDoc });
  } catch (error: any) {
    console.error('Error updating document:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
