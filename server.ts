import 'dotenv/config';
import { OAuth2Client } from 'google-auth-library';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { ZipArchive } from 'archiver';

import { 
  User, 
  UserRole, 
  Course, 
  CourseOffering, 
  Document, 
  AuditLogEntry, 
  Term, 
  DocumentCategory,
  CategoryConfig,
  CORE_16_CATEGORIES
} from './src/types.js';

import {
  initDatabaseSchema,
  dbGetUsers,
  dbGetUserByEmail,
  dbCreateUser,
  dbUpdateUserRole,
  dbGetCourses,
  dbCreateCourse,
  dbGetOfferings,
  dbCreateOffering,
  dbUpdateOfferingAuditor,
  dbGetDocuments,
  dbCreateDocument,
  dbUpdateDocument, dbDeleteDocument,
  dbGetAuditLogs,
  dbCreateAuditLog,
  dbGetCategories,
  dbGetAllCategories,
  dbCreateCategory,
  dbUpdateCategory,
  dbDeleteCategory,
  dbGetTrashDocuments,
  dbRestoreDocument,
  dbPurgeDocument,
  dbGetNextDocumentVersion
} from './db.js';

import { uploadFile, getFile, generateUploadUrl, generateDownloadUrl, isR2Configured, deleteFile } from './storage.js';

let currentDir = '';
if (typeof __dirname !== 'undefined') {
  currentDir = __dirname;
} else {
  currentDir = process.cwd();
}

const app = express();
app.set('trust proxy', 1); // Trust first proxy for rate limiting
app.use(express.json());

// Initialize Multer for in-memory file uploads
const upload = multer({ storage: multer.memoryStorage() });


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  validate: { trustProxy: false, xForwardedForHeader: false },
  max: 20, // limit each IP to 20 login requests per windowMs
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes.' }
});

const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  validate: { trustProxy: false, xForwardedForHeader: false },
  max: 10, // limit each IP to 10 exports per windowMs
  message: { error: 'Too many package exports requested. Please try again later.' }
});

// Simple Cookie Parser Middleware

app.use((req: any, res: Response, next: NextFunction) => {
  const cookies: { [key: string]: string } = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach((cookie: string) => {
      const parts = cookie.split('=');
      if (parts[0]) {
        const key = parts[0].trim();
        const val = (parts[1] || '').trim();
        try {
          cookies[key] = decodeURIComponent(val);
        } catch (e) {
          cookies[key] = val;
        }
      }
    });
  }
  req.cookies = cookies;
  next();
});

// Middleware to ensure database is fully initialized before processing any requests
app.use(async (req: any, res: Response, next: NextFunction) => {
  try {
    await initDatabaseSchema();
    next();
  } catch (err: any) {
    console.error('[Server] Database initialization failed for request:', err);
    res.status(500).json({ error: 'Database initialization failed. Please try again.' });
  }
});

// Middlewares for authentication and authorization
async function getSessionUser(req: any): Promise<User | null> {
  const userEmail = req.cookies.session_user_email;
  if (!userEmail) return null;
  return await dbGetUserByEmail(userEmail);
}

// API Routes

// Authentication Endpoints
app.get('/api/me', async (req: Request, res: Response) => {
  const user = await getSessionUser(req);
  res.json({ user });
});

app.post('/api/login', loginLimiter, async (req: Request, res: Response) => {
  const { email, firebaseToken } = req.body;
  
  let targetEmail = email;
  let targetName = '';
  let targetPicture = '';

  const client = new OAuth2Client();
  
  if (firebaseToken) {
    try {
      const ticket = await client.verifyIdToken({
          idToken: firebaseToken,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
      targetEmail = payload.email || '';
      targetName = payload.name || '';
      targetPicture = payload.picture || '';
    } catch (e) {
      console.error('Token verification failed', e);
      return res.status(401).json({ error: 'Token verification failed' });
    }
  }

  if (!targetEmail) {
    return res.status(400).json({ error: 'Missing email address or authentication token' });
  }

  let user = await dbGetUserByEmail(targetEmail);

  // If user is not registered, automatically register them!
  if (!user) {
    const isDev = targetEmail.toLowerCase() === 'talharupok2022@gmail.com' || targetEmail.toLowerCase().includes('admin');
    user = {
      id: `user_${Date.now()}`,
      name: targetName || targetEmail.split('@')[0],
      email: targetEmail,
      role: isDev ? UserRole.ADMIN : UserRole.INSTRUCTOR,
      department: 'Computer Science & Engineering',
      avatarUrl: targetPicture || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?w=150`,
      pendingApproval: !isDev,
    };
    await dbCreateUser(user);
  }

  // Set standard httpOnly cookie for 24 hours
  res.cookie('session_user_email', user.email, {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
  });

  // Log the login action
  const timestamp = new Date().toISOString();
  const details = `User ${user.name} logged in successfully via Firebase Google Sign-In.`;

  await dbCreateAuditLog({
    id: `log_${Date.now()}`,
    action: 'USER_LOGIN',
    actorId: user.id,
    actorName: user.name,
    actorEmail: user.email,
    timestamp,
    details,
  });

  res.json({ user });
});

app.post('/api/logout', async (req: Request, res: Response) => {
  const user = await getSessionUser(req);
  
  if (user) {
    const timestamp = new Date().toISOString();
    const details = `User ${user.name} logged out.`;

    await dbCreateAuditLog({
      id: `log_${Date.now()}`,
      action: 'USER_LOGOUT',
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      timestamp,
      details,
    });
  }

  res.clearCookie('session_user_email');
  res.json({ success: true });
});

// Users Catalog
app.get('/api/users', async (req: Request, res: Response) => {
  const users = await dbGetUsers();
  res.json({ users });
});

app.post('/api/users', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Unauthorized: Admins only' });
  }

  const { name, email, role, department } = req.body;
  
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Missing name, email, or role' });
  }

  const existingUser = await dbGetUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const newUser: User = {
    id: `user_${Date.now()}`,
    name,
    email,
    role: role as UserRole,
    department: department || '',
    avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?w=150`,
  };

  await dbCreateUser(newUser);

  // Audit entry
  const timestamp = new Date().toISOString();
  const details = `Created new user ${newUser.name} with role ${newUser.role}`;

  await dbCreateAuditLog({
    id: `log_${Date.now()}`,
    action: 'CREATE_USER',
    actorId: currentUser.id,
    actorName: currentUser.name,
    actorEmail: currentUser.email,
    timestamp,
    details,
  });

  res.json({ user: newUser });
});

// Update User Role/Department/Approval (Admin Only)
app.put('/api/users/:userId/role', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Unauthorized: Admins only' });
  }

  const { userId } = req.params;
  const { role, department, pendingApproval } = req.body;

  if (!role) {
    return res.status(400).json({ error: 'Missing role' });
  }

  // Look up user to see if role or approval is changing
  const allUsers = await dbGetUsers();
  const targetUser = allUsers.find(u => u.id === userId);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const oldRole = targetUser.role;
  const isRoleChanged = oldRole !== role;
  const isApprovalChanged = !!targetUser.pendingApproval !== !!pendingApproval;

  // Update user
  const updatedUser = await dbUpdateUserRole(userId, role, department, pendingApproval);

  if (!updatedUser) {
    return res.status(500).json({ error: 'Failed to update user' });
  }

  // Add AuditLogEntry if role has changed or approval changed
  if (isRoleChanged || isApprovalChanged) {
    const timestamp = new Date().toISOString();
    
    let details = `User ${updatedUser.name} updated by Admin ${currentUser.name}.`;
    if (isRoleChanged) {
      details += ` Role changed from ${oldRole} to ${updatedUser.role}.`;
    }
    if (targetUser.pendingApproval && !pendingApproval) {
      details += ` Account was approved.`;
    } else if (!targetUser.pendingApproval && pendingApproval) {
      details += ` Account set to pending approval.`;
    }

    await dbCreateAuditLog({
      id: `log_${Date.now()}`,
      action: 'ROLE_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      timestamp,
      details,
    });
  }

  res.json({ user: updatedUser });
});

// Courses API
app.get('/api/courses', async (req: Request, res: Response) => {
  const courses = await dbGetCourses();
  res.json({ courses });
});

app.post('/api/courses', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Unauthorized: Admins only' });
  }

  const { code, title, department } = req.body;

  if (!code || !title || !department) {
    return res.status(400).json({ error: 'Missing code, title, or department' });
  }

  const courses = await dbGetCourses();
  if (courses.find(c => c.code.toUpperCase() === code.toUpperCase())) {
    return res.status(400).json({ error: 'Course code already exists' });
  }

  const newCourse: Course = {
    id: `course_${Date.now()}`,
    code: code.toUpperCase().trim(),
    title: title.trim(),
    department: department.trim(),
  };

  await dbCreateCourse(newCourse);

  // Audit entry
  const timestamp = new Date().toISOString();
  const details = `Created Course ${newCourse.code}: ${newCourse.title}`;

  await dbCreateAuditLog({
    id: `log_${Date.now()}`,
    action: 'CREATE_COURSE',
    actorId: currentUser.id,
    actorName: currentUser.name,
    actorEmail: currentUser.email,
    timestamp,
    details,
  });

  res.json({ course: newCourse });
});

// Course Offerings API
app.get('/api/offerings', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const offerings = await dbGetOfferings();
  const courses = await dbGetCourses();
  const users = await dbGetUsers();

  let accessibleOfferings = offerings;

  if (currentUser.role === UserRole.INSTRUCTOR) {
    accessibleOfferings = offerings.filter(o => o.instructorId === currentUser.id);
  } else if (currentUser.role === UserRole.AUDITOR) {
    accessibleOfferings = offerings.filter(o => o.auditorId === currentUser.id);
  } else if (currentUser.role === UserRole.DEPT_HEAD) {
    const dept = currentUser.department?.toLowerCase().trim() || '';
    const deptCourses = courses.filter(c => (c.department?.toLowerCase().trim() || '') === dept).map(c => c.id);
    accessibleOfferings = offerings.filter(o => deptCourses.includes(o.courseId));
  }
  // Admin sees all

  // Map and expand references
  const expandedOfferings = accessibleOfferings.map(o => {
    const course = courses.find(c => c.id === o.courseId);
    const instructor = users.find(u => u.id === o.instructorId);
    const auditor = o.auditorId ? users.find(u => u.id === o.auditorId) : undefined;
    return {
      ...o,
      course,
      instructor,
      auditor,
    };
  });
  res.json({ offerings: expandedOfferings });
});

app.post('/api/offerings', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Unauthorized: Admins only' });
  }

  const { courseId, academicYear, term, section, instructorId, auditorId } = req.body;

  if (!courseId || !academicYear || !term || !section || !instructorId) {
    return res.status(400).json({ error: 'Missing courseId, academicYear, term, section, or instructorId' });
  }

  const courses = await dbGetCourses();
  const course = courses.find(c => c.id === courseId);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const users = await dbGetUsers();
  const instructor = users.find(u => u.id === instructorId);
  if (!instructor) {
    return res.status(404).json({ error: 'Instructor not found' });
  }

  const offerings = await dbGetOfferings();
  const duplicate = offerings.find(o => 
    o.courseId === courseId && 
    o.academicYear === Number(academicYear) && 
    o.term === term && 
    o.section === section
  );

  if (duplicate) {
    return res.status(400).json({ error: `Section ${section} already exists for this term offering` });
  }

  const newOffering: CourseOffering = {
    id: `offering_${Date.now()}`,
    courseId,
    academicYear: Number(academicYear),
    term: term as Term,
    section: section.trim(),
    instructorId,
    auditorId: auditorId || undefined,
  };

  await dbCreateOffering(newOffering);

  // Audit entry
  const timestamp = new Date().toISOString();
  const details = `Created Course Offering for ${course.code} Section ${newOffering.section} (${newOffering.term} ${newOffering.academicYear}) assigned to ${instructor.name}`;

  await dbCreateAuditLog({
    id: `log_${Date.now()}`,
    action: 'CREATE_OFFERING',
    actorId: currentUser.id,
    actorName: currentUser.name,
    actorEmail: currentUser.email,
    timestamp,
    details,
  });

  res.json({ offering: { ...newOffering, course, instructor } });
});

// Update Course Offering Auditor assignment
app.put('/api/offerings/:offeringId/auditor', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Unauthorized: Admins only' });
  }

  const { offeringId } = req.params;
  const { auditorId } = req.body;

  const updatedOffering = await dbUpdateOfferingAuditor(offeringId, auditorId || null);
  if (!updatedOffering) {
    return res.status(404).json({ error: 'Offering not found' });
  }

  // Audit entry
  const timestamp = new Date().toISOString();
  
  const users = await dbGetUsers();
  const auditorName = auditorId ? (users.find(u => u.id === auditorId)?.name || 'Auditor') : 'None';
  const details = `Assigned Board Auditor ${auditorName} to offering ID ${offeringId} by Admin ${currentUser.name}`;

  await dbCreateAuditLog({
    id: `log_${Date.now()}`,
    action: 'ASSIGN_AUDITOR',
    actorId: currentUser.id,
    actorName: currentUser.name,
    actorEmail: currentUser.email,
    timestamp,
    details,
  });

  res.json({ offering: updatedOffering });
});

// Categories API (Dynamic Slots Management)
app.get('/api/categories', async (req: Request, res: Response) => {
  const includeAll = req.query.all === 'true';
  const categories = includeAll ? await dbGetAllCategories() : await dbGetCategories();
  res.json({ categories });
});

app.post('/api/categories', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Unauthorized: System Admins only' });
  }

  const { id, label, group, isCore } = req.body;
  if (!label || !group) {
    return res.status(400).json({ error: 'Missing required category label or group' });
  }

  const catId = id ? id.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_') : label.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');

  const newCategory: CategoryConfig = {
    id: catId,
    label: label.trim(),
    group: group.trim(),
    isCore: !!isCore,
    isActive: true,
  };

  await dbCreateCategory(newCategory);

  await dbCreateAuditLog({
    id: `log_${Date.now()}`,
    action: 'CREATE_CATEGORY_SLOT',
    actorId: currentUser.id,
    actorName: currentUser.name,
    actorEmail: currentUser.email,
    timestamp: new Date().toISOString(),
    details: `Added new document requirement slot "${newCategory.label}" (${newCategory.isCore ? 'Core' : 'Optional'})`,
  });

  res.json({ category: newCategory });
});

app.put('/api/categories/:id', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Unauthorized: System Admins only' });
  }

  const { id } = req.params;
  const { label, group, isCore, isActive } = req.body;

  const updated = await dbUpdateCategory(id, { label, group, isCore, isActive });
  if (!updated) {
    return res.status(404).json({ error: 'Category not found' });
  }

  await dbCreateAuditLog({
    id: `log_${Date.now()}`,
    action: 'UPDATE_CATEGORY_SLOT',
    actorId: currentUser.id,
    actorName: currentUser.name,
    actorEmail: currentUser.email,
    timestamp: new Date().toISOString(),
    details: `Updated document slot "${updated.label}" (Core: ${updated.isCore}, Active: ${updated.isActive})`,
  });

  res.json({ category: updated });
});

app.delete('/api/categories/:id', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Unauthorized: System Admins only' });
  }

  const { id } = req.params;
  const success = await dbDeleteCategory(id);
  if (!success) {
    return res.status(404).json({ error: 'Category not found or failed to delete' });
  }

  await dbCreateAuditLog({
    id: `log_${Date.now()}`,
    action: 'DELETE_CATEGORY_SLOT',
    actorId: currentUser.id,
    actorName: currentUser.name,
    actorEmail: currentUser.email,
    timestamp: new Date().toISOString(),
    details: `Deactivated document requirement slot ID: ${id}`,
  });

  res.json({ success: true });
});

// Soft Delete Document (Move to Trash)
app.delete('/api/documents/:id', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { id } = req.params;
  const docs = await dbGetDocuments();
  const targetDoc = docs.find(d => d.id === id);

  if (!targetDoc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Permission check: Admin, Dept Head, or uploader
  const offerings = await dbGetOfferings();
  const offering = offerings.find(o => o.id === targetDoc.offeringId);
  const isAssignedInstructor = offering && offering.instructorId === currentUser.id;

  if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.DEPT_HEAD && targetDoc.uploadedBy !== currentUser.email && !isAssignedInstructor) {
    return res.status(403).json({ error: 'Unauthorized to delete this document' });
  }

  await dbDeleteDocument(id);

  await dbCreateAuditLog({
    id: `log_${Date.now()}`,
    action: 'MOVE_DOCUMENT_TO_TRASH',
    actorId: currentUser.id,
    actorName: currentUser.name,
    actorEmail: currentUser.email,
    targetDocumentId: targetDoc.id,
    targetDocumentName: targetDoc.fileName,
    timestamp: new Date().toISOString(),
    details: `Moved document ${targetDoc.fileName} to Trash`,
  });

  res.json({ success: true });
});

// Trash API (View Trash, Restore, Permanent Purge from Cloudflare R2)
app.get('/api/trash', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const trashDocs = await dbGetTrashDocuments();
  res.json({ documents: trashDocs });
});

app.post('/api/trash/:id/restore', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { id } = req.params;
  const restored = await dbRestoreDocument(id);
  if (!restored) {
    return res.status(404).json({ error: 'Document not found in trash' });
  }

  await dbCreateAuditLog({
    id: `log_${Date.now()}`,
    action: 'RESTORE_DOCUMENT_FROM_TRASH',
    actorId: currentUser.id,
    actorName: currentUser.name,
    actorEmail: currentUser.email,
    timestamp: new Date().toISOString(),
    details: `Restored document ID ${id} from Trash`,
  });

  res.json({ success: true });
});

app.delete('/api/trash/:id', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Unauthorized: Only Admins can permanently purge files from storage' });
  }

  const { id } = req.params;
  const purgedDoc = await dbPurgeDocument(id);
  if (!purgedDoc) {
    return res.status(404).json({ error: 'Document not found in trash' });
  }

  // Delete physical object from Cloudflare R2 bucket or local fallback
  let r2Deleted = false;
  if (purgedDoc.storagePath) {
    r2Deleted = await deleteFile(purgedDoc.storagePath);
  }

  await dbCreateAuditLog({
    id: `log_${Date.now()}`,
    action: 'PERMANENT_PURGE_DOCUMENT',
    actorId: currentUser.id,
    actorName: currentUser.name,
    actorEmail: currentUser.email,
    targetDocumentId: purgedDoc.id,
    targetDocumentName: purgedDoc.fileName,
    timestamp: new Date().toISOString(),
    details: `Permanently purged document ${purgedDoc.fileName} from database and ${r2Deleted ? 'Cloudflare R2 storage' : 'storage'}`,
  });

  res.json({ success: true, r2Deleted });
});

// Documents API
app.get('/api/documents', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const allDocs = await dbGetDocuments();
  const offerings = await dbGetOfferings();
  const courses = await dbGetCourses();
  const users = await dbGetUsers();

  // Pre-calculate accessible offerings
  let accessibleOfferingIds = offerings.map(o => o.id);
  
  if (currentUser.role === UserRole.INSTRUCTOR) {
    accessibleOfferingIds = offerings.filter(o => o.instructorId === currentUser.id).map(o => o.id);
  } else if (currentUser.role === UserRole.AUDITOR) {
    accessibleOfferingIds = offerings.filter(o => o.auditorId === currentUser.id).map(o => o.id);
  } else if (currentUser.role === UserRole.DEPT_HEAD) {
    const dept = currentUser.department?.toLowerCase().trim() || '';
    const deptCourses = courses.filter(c => (c.department?.toLowerCase().trim() || '') === dept).map(c => c.id);
    accessibleOfferingIds = offerings.filter(o => deptCourses.includes(o.courseId)).map(o => o.id);
  }

  const { offeringId, category, isCurrent } = req.query;

  let filteredDocs = allDocs.filter(d => accessibleOfferingIds.includes(d.offeringId));

  if (offeringId) {
    filteredDocs = filteredDocs.filter(d => d.offeringId === offeringId);
  }
  if (category) {
    filteredDocs = filteredDocs.filter(d => d.category === category);
  }
  if (isCurrent !== undefined) {
    const isCurrentBool = isCurrent === 'true';
    filteredDocs = filteredDocs.filter(d => d.isCurrent === isCurrentBool);
  }

  // Include detailed Course + Offering + User metadata
  const enrichedDocs = filteredDocs.map(doc => {
    const offering = offerings.find(o => o.id === doc.offeringId);
    const course = offering ? courses.find(c => c.id === offering.courseId) : null;
    const instructor = offering ? users.find(u => u.id === offering.instructorId) : null;
    const uploader = users.find(u => u.email === doc.uploadedBy);

    return {
      ...doc,
      offering,
      course,
      instructor,
      uploader,
    };
  });

  // Sort: uploadedAt desc
  enrichedDocs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  res.json({ documents: enrichedDocs });
});

// Combined Simulated Upload or Real S3/R2 Upload Endpoint
app.post('/api/documents/upload', upload.single('file'), async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);

  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Instructors, Admins, or Department Heads can upload
  if (currentUser.role !== UserRole.INSTRUCTOR && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.DEPT_HEAD) {
    return res.status(403).json({ error: 'Unauthorized: Only Instructors, Department Heads, or Admins can submit course files' });
  }

  const { offeringId, category, textContent } = req.body;
  const file = req.file;

  if (!offeringId || !category) {
    return res.status(400).json({ error: 'Missing offeringId or category' });
  }

  // Find offering and course to auto-generate standard filename
  const offerings = await dbGetOfferings();
  const offering = offerings.find(o => o.id === offeringId);
  if (!offering) {
    return res.status(404).json({ error: 'Offering not found' });
  }

  const courses = await dbGetCourses();
  const course = courses.find(c => c.id === offering.courseId);
  if (!course) {
    return res.status(404).json({ error: 'Course relation is corrupted' });
  }

  // Authorization check: Assigned instructor, Admin, or Dept Head for this course department can upload
  const isDeptHeadForCourse = currentUser.role === UserRole.DEPT_HEAD && (currentUser.department?.toLowerCase().trim() === course.department?.toLowerCase().trim());
  const isAuthorized = currentUser.role === UserRole.ADMIN || offering.instructorId === currentUser.id || isDeptHeadForCourse;
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Access denied: Only the assigned lead instructor or department head can upload materials for this offering' });
  }

  // Calculate version number: query maximum existing version
  const version = await dbGetNextDocumentVersion(offeringId, category);

  // Resolve upload content buffer and mimeType
  let fileBuffer: Buffer;
  let fileMimeType = 'application/pdf';
  let originalName = '';

  if (file) {
    fileBuffer = file.buffer;
    fileMimeType = file.mimetype;
    originalName = file.originalname;
    
    // Server-side magic bytes validation
    if (fileBuffer.length >= 4) {
      const hex = fileBuffer.toString('hex', 0, 4).toUpperCase();
      let isValid = false;
      const ext = originalName.split('.').pop()?.toLowerCase() || '';
      
      if (ext === 'pdf' && hex.startsWith('25504446')) {
        isValid = true;
      } else if ((ext === 'docx' || ext === 'xlsx') && hex.startsWith('504B0304')) {
        isValid = true;
      }
      
      if (!isValid) {
        return res.status(400).json({ error: 'Security Error: File content magic bytes do not match expected file extension.' });
      }
    }
  } else if (textContent) {
    fileBuffer = Buffer.from(textContent, 'utf-8');
    fileMimeType = 'text/plain';
    originalName = 'simulated_content.txt';
  } else {
    return res.status(400).json({ error: 'No file uploaded or simulated content provided' });
  }

  // Auto-generate standard naming convention using centralized function
  const fileExtension = file ? (originalName.split('.').pop()?.toLowerCase() || 'pdf') : 'txt';
  const fileName = generateStoredFilenameBackend(offering, course, category, fileExtension);
  
  // Custom storage path
  const storagePathKey = `course-archive/${offering.academicYear}/${offering.term}/${course.code}/${fileName}`;

  // Upload file buffer to R2 or local storage fallback!
  const storagePath = await uploadFile(storagePathKey, fileBuffer, fileMimeType);

  const docUniqueId = `doc_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
  const newDoc: Document = {
    id: docUniqueId,
    offeringId,
    category: category as DocumentCategory,
    version,
    isCurrent: true,
    fileName,
    fileHash: '',
    uploadedBy: currentUser.email,
    uploadedAt: new Date().toISOString(),
    storagePath,
    status: 'pending_review',
  };

  await dbCreateDocument(newDoc);

  // Audit Log entry
  const timestamp = new Date().toISOString();
  const details = `Uploaded file "${fileName}" to ${course.code} (${offering.term} ${offering.academicYear}). Storage: ${storagePath.startsWith('r2://') ? 'Cloudflare R2' : 'Local Storage'}.`;

  await dbCreateAuditLog({
    id: `log_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
    action: 'UPLOAD_DOCUMENT',
    actorId: currentUser.id,
    actorName: currentUser.name,
    actorEmail: currentUser.email,
    targetDocumentId: newDoc.id,
    targetDocumentName: fileName,
    timestamp,
    details,
  });

  const users = await dbGetUsers();
  res.json({
    document: {
      ...newDoc,
      course,
      offering,
      uploader: users.find(u => u.email === newDoc.uploadedBy),
    }
  });
});

// Bulk Upload Endpoint for processing multiple files simultaneously
app.post('/api/documents/bulk-upload', upload.array('files'), async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);

  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (currentUser.role !== UserRole.INSTRUCTOR && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.DEPT_HEAD) {
    return res.status(403).json({ error: 'Unauthorized: Only Instructors, Department Heads, or Admins can bulk submit course files' });
  }

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded for bulk processing' });
  }

  let itemsMeta: { offeringId: string; category: string }[] = [];
  try {
    if (req.body.items) {
      itemsMeta = typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items;
    }
  } catch (e) {
    return res.status(400).json({ error: 'Invalid items metadata format' });
  }

  const offerings = await dbGetOfferings();
  const courses = await dbGetCourses();
  const users = await dbGetUsers();

  const results: any[] = [];
  const errors: { fileName: string; error: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const meta = itemsMeta[i] || { offeringId: req.body.offeringId, category: req.body.category };
    const offeringId = meta.offeringId || req.body.offeringId;
    const category = meta.category || req.body.category;

    if (!offeringId || !category) {
      errors.push({ fileName: file.originalname, error: 'Missing target offering or category' });
      continue;
    }

    const offering = offerings.find(o => o.id === offeringId);
    if (!offering) {
      errors.push({ fileName: file.originalname, error: 'Offering not found' });
      continue;
    }

    const course = courses.find(c => c.id === offering.courseId);
    if (!course) {
      errors.push({ fileName: file.originalname, error: 'Course relation not found' });
      continue;
    }

    const isDeptHeadForCourse = currentUser.role === UserRole.DEPT_HEAD && (currentUser.department?.toLowerCase().trim() === course.department?.toLowerCase().trim());
    const isAuthorized = currentUser.role === UserRole.ADMIN || offering.instructorId === currentUser.id || isDeptHeadForCourse;
    if (!isAuthorized) {
      errors.push({ fileName: file.originalname, error: 'Access denied for this course offering' });
      continue;
    }

    const fileBuffer = file.buffer;
    const fileMimeType = file.mimetype;
    const originalName = file.originalname;

    // Validate magic bytes
    if (fileBuffer.length >= 4) {
      const hex = fileBuffer.toString('hex', 0, 4).toUpperCase();
      let isValid = false;
      const ext = originalName.split('.').pop()?.toLowerCase() || '';

      if (ext === 'pdf' && hex.startsWith('25504446')) {
        isValid = true;
      } else if ((ext === 'docx' || ext === 'xlsx') && hex.startsWith('504B0304')) {
        isValid = true;
      }

      if (!isValid) {
        errors.push({ fileName: originalName, error: 'Security Error: File content magic bytes do not match expected file extension.' });
        continue;
      }
    }

    const version = await dbGetNextDocumentVersion(offeringId, category);

    const fileExtension = originalName.split('.').pop()?.toLowerCase() || 'pdf';
    const fileName = generateStoredFilenameBackend(offering, course, category, fileExtension);

    const storagePathKey = `course-archive/${offering.academicYear}/${offering.term}/${course.code}/${fileName}`;
    const storagePath = await uploadFile(storagePathKey, fileBuffer, fileMimeType);

    const docUniqueId = `doc_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    const newDoc: Document = {
      id: docUniqueId,
      offeringId,
      category: category as DocumentCategory,
      version,
      isCurrent: true,
      fileName,
      fileHash: '',
      uploadedBy: currentUser.email,
      uploadedAt: new Date().toISOString(),
      storagePath,
      status: 'pending_review',
    };

    await dbCreateDocument(newDoc);

    await dbCreateAuditLog({
      id: `log_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      action: 'UPLOAD_DOCUMENT',
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      targetDocumentId: newDoc.id,
      targetDocumentName: fileName,
      timestamp: new Date().toISOString(),
      details: `[Bulk Upload] Uploaded file "${fileName}" to ${course.code} (${offering.term} ${offering.academicYear}). Storage: ${storagePath.startsWith('r2://') ? 'Cloudflare R2' : 'Local Storage'}.`,
    });

    results.push({
      ...newDoc,
      course,
      offering,
      uploader: users.find(u => u.email === newDoc.uploadedBy),
    });
  }

  res.json({
    success: true,
    processedCount: results.length,
    errorCount: errors.length,
    documents: results,
    errors,
  });
});

function getCategoryDetailsBackend(category: string) {
  switch (category) {
    case 'final_grades':
      return { docTypeLabel: 'FinalGrades' };
    case 'obe_excel':
      return { docTypeLabel: '' };
    case 'co_attainment':
      return { docTypeLabel: 'COAttainment' };
    case 'po_attainment':
      return { docTypeLabel: 'POAttainment' };
    case 'grade_summary_cqi':
      return { docTypeLabel: 'GradeSummaryCQI' };
    case 'instructor_feedback':
      return { docTypeLabel: 'InstructorFeedback' };
    case 'course_outline':
      return { docTypeLabel: 'CourseOutline' };
    case 'class_test_question':
      return { docTypeLabel: 'ClassTest', variant: 'Question' };
    case 'class_test_sample_highest':
      return { docTypeLabel: 'ClassTest', variant: 'SampleHighest' };
    case 'class_test_sample_marginal':
      return { docTypeLabel: 'ClassTest', variant: 'SampleMarginal' };
    case 'class_test_sample_average':
      return { docTypeLabel: 'ClassTest', variant: 'SampleAverage' };
    case 'midterm_question':
      return { docTypeLabel: 'Midterm', variant: 'Question' };
    case 'midterm_sample_highest':
      return { docTypeLabel: 'Midterm', variant: 'SampleHighest' };
    case 'midterm_sample_marginal':
      return { docTypeLabel: 'Midterm', variant: 'SampleMarginal' };
    case 'midterm_sample_average':
      return { docTypeLabel: 'Midterm', variant: 'SampleAverage' };
    case 'final_question':
      return { docTypeLabel: 'Final', variant: 'Question' };
    case 'final_sample_highest':
      return { docTypeLabel: 'Final', variant: 'SampleHighest' };
    case 'final_sample_marginal':
      return { docTypeLabel: 'Final', variant: 'SampleMarginal' };
    case 'final_sample_average':
      return { docTypeLabel: 'Final', variant: 'SampleAverage' };
    case 'projects_list':
      return { docTypeLabel: 'Projects', variant: 'List' };
    case 'projects_sample_highest':
      return { docTypeLabel: 'Projects', variant: 'SampleHighest' };
    case 'projects_sample_marginal':
      return { docTypeLabel: 'Projects', variant: 'SampleMarginal' };
    case 'projects_sample_average':
      return { docTypeLabel: 'Projects', variant: 'SampleAverage' };
    case 'lab_experiments_list':
      return { docTypeLabel: 'LabExperiments', variant: 'List' };
    case 'class_attendance':
      return { docTypeLabel: 'Attendance', variant: 'Class' };
    case 'lab_attendance':
      return { docTypeLabel: 'Attendance', variant: 'Lab' };
    case 'midterm_attendance':
      return { docTypeLabel: 'Attendance', variant: 'Midterm' };
    case 'final_attendance':
      return { docTypeLabel: 'Attendance', variant: 'Final' };
    default:
      return { docTypeLabel: category };
  }
}

function generateStoredFilenameBackend(
  offering: any,
  course: any,
  category: string,
  fileExtension: string
): string {
  const academicYear = offering.academicYear;
  
  let termNumber = 1;
  const termStr = String(offering.term).toUpperCase();
  if (termStr === 'SPRING') termNumber = 1;
  else if (termStr === 'SUMMER') termNumber = 2;
  else if (termStr === 'FALL') termNumber = 3;

  const courseCode = course.code || '';
  const section = offering.section || '';
  
  const { docTypeLabel, variant } = getCategoryDetailsBackend(category);
  
  let baseName = `${academicYear}.${termNumber}.${courseCode}-${section}`;
  if (docTypeLabel) {
    baseName += `_${docTypeLabel}`;
    if (variant) {
      baseName += `_${variant}`;
    }
  }
  
  return `${baseName}.${fileExtension}`;
}

function getCategoryAllowedExtensionsBackend(category: string): string[] {
  if (category === 'course_outline') {
    return ['pdf', 'docx'];
  }
  if (category === 'obe_excel') {
    return ['xlsx'];
  }
  return ['pdf'];
}

// Route to generate a secure presigned upload URL for S3/R2 or local fallback
app.post('/api/documents/presigned-upload', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { offeringId, category, fileName, fileSize } = req.body;
  if (!offeringId || !category || !fileName || fileSize === undefined) {
    return res.status(400).json({ error: 'Missing offeringId, category, fileName, or fileSize' });
  }

  // Get offering and course
  const offerings = await dbGetOfferings();
  const offering = offerings.find(o => o.id === offeringId);
  if (!offering) {
    return res.status(404).json({ error: 'Course offering not found' });
  }

  const courses = await dbGetCourses();
  const course = courses.find(c => c.id === offering.courseId);
  if (!course) {
    return res.status(404).json({ error: 'Course relation not found' });
  }

  // Authorization check: Assigned instructor, Admin, or Dept Head for course department can upload
  const isDeptHeadForCourse = currentUser.role === UserRole.DEPT_HEAD && (currentUser.department?.toLowerCase().trim() === course.department?.toLowerCase().trim());
  const isAuthorized = currentUser.role === UserRole.ADMIN || offering.instructorId === currentUser.id || isDeptHeadForCourse;
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Access denied: Only the assigned lead instructor or department head can upload materials for this offering' });
  }

  // File size check: Reject any file over 25MB
  const maxSizeBytes = 25 * 1024 * 1024;
  if (fileSize > maxSizeBytes) {
    return res.status(400).json({ error: 'Validation Error: File size exceeds the 25MB maximum limit.' });
  }

  // File extension validation
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const allowedExtensions = getCategoryAllowedExtensionsBackend(category);
  if (!allowedExtensions.includes(ext)) {
    return res.status(400).json({ error: `Validation Error: File type mismatch. For "${category}", only [${allowedExtensions.join(', ').toUpperCase()}] files are allowed.` });
  }

  // Calculate target version
  const version = await dbGetNextDocumentVersion(offeringId, category);

  // Generate standardized filename matching EWU convention
  const standardFileName = generateStoredFilenameBackend(offering, course, category, ext);

  // Generate storage key: courseFiles/{academicYear}/{term}/{courseCode}-{section}/{docCategory}/{version}/{fileName}
  const storageKey = `courseFiles/${offering.academicYear}/${offering.term}/${course.code}-${offering.section}/${category}/${version}/${standardFileName}`;

  // Content type mapping
  let contentType = 'application/pdf';
  if (ext === 'xlsx') {
    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else if (ext === 'docx') {
    contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  // Generate presigned upload URL
  const uploadUrl = await generateUploadUrl(storageKey, contentType);

  res.json({
    uploadUrl,
    key: storageKey,
    fileName: standardFileName,
    version,
  });
});

// Route to confirm upload success and document registration
app.post('/api/documents/confirm-upload', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { offeringId, category, fileName, version, key } = req.body;
  if (!offeringId || !category || !fileName || !version || !key) {
    return res.status(400).json({ error: 'Missing required confirmation parameters: offeringId, category, fileName, version, key' });
  }

  // Verify offering and course
  const offerings = await dbGetOfferings();
  const offering = offerings.find(o => o.id === offeringId);
  if (!offering) {
    return res.status(404).json({ error: 'Offering not found' });
  }

  const courses = await dbGetCourses();
  const course = courses.find(c => c.id === offering.courseId);
  if (!course) {
    return res.status(404).json({ error: 'Course relation not found' });
  }

  // Authorization check: Only assigned instructor, Admin, or Dept Head for this course department can confirm upload
  const isDeptHeadForCourse = currentUser.role === UserRole.DEPT_HEAD && (currentUser.department?.toLowerCase().trim() === course.department?.toLowerCase().trim());
  const isAuthorized = currentUser.role === UserRole.ADMIN || offering.instructorId === currentUser.id || isDeptHeadForCourse;
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Access denied: Only the assigned lead instructor or department head can register files for this offering' });
  }

  const storagePath = isR2Configured ? `r2://${key}` : `local://${key}`;

  try {
    const docUniqueId = `doc_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    const newDoc: Document = {
      id: docUniqueId,
      offeringId,
      category: category as DocumentCategory,
      version: Number(version),
      isCurrent: true,
      fileName,
      fileHash: '',
      uploadedBy: currentUser.email,
      uploadedAt: new Date().toISOString(),
      storagePath,
      status: 'pending_review',
    };

    await dbCreateDocument(newDoc);

    // Audit Log entry
    const timestamp = new Date().toISOString();
    const details = `Document "${fileName}" successfully registered. Storage path: ${storagePath}.`;

    await dbCreateAuditLog({
      id: `log_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      action: 'UPLOAD_DOCUMENT',
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      targetDocumentId: newDoc.id,
      targetDocumentName: fileName,
      timestamp,
      details,
    });

    const users = await dbGetUsers();
    res.json({
      document: {
        ...newDoc,
        course,
        offering,
        uploader: users.find(u => u.email === newDoc.uploadedBy),
      }
    });
  } catch (err: any) {
    console.error('[Confirm] Error confirming uploaded file:', err);
    return res.status(500).json({ error: `Upload Confirmation System Error: ${err.message || 'Could not register uploaded file metadata.'}` });
  }
});

// Fallback upload endpoint for local testing
app.put('/api/local-storage-fallback-upload', async (req: Request, res: Response) => {
  const key = req.query.key as string;
  if (!key) {
    return res.status(400).json({ error: 'Missing key parameter' });
  }

  try {
    const uploadDir = path.join(currentDir, 'data', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeKey = key.replace(/\//g, '_');
    const localFilePath = path.join(uploadDir, safeKey);

    const dataChunks: Buffer[] = [];
    req.on('data', chunk => {
      dataChunks.push(chunk);
    });

    req.on('end', () => {
      const buffer = Buffer.concat(dataChunks);
      fs.writeFileSync(localFilePath, buffer);
      console.log(`[Local Fallback] Written upload to: ${localFilePath}`);
      res.json({ success: true });
    });
  } catch (err: any) {
    console.error('[Local Fallback] Failed to handle local PUT fallback:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fallback download endpoint for local testing
app.get('/api/local-storage-fallback-download', async (req: Request, res: Response) => {
  const key = req.query.key as string;
  if (!key) {
    return res.status(400).json({ error: 'Missing key parameter' });
  }

  try {
    const uploadDir = path.join(currentDir, 'data', 'uploads');
    const safeKey = key.replace(/\//g, '_');
    const localFilePath = path.join(uploadDir, safeKey);

    if (fs.existsSync(localFilePath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.sendFile(localFilePath);
    } else {
      res.status(404).send('File not found in local fallback directory.');
    }
  } catch (err: any) {
    res.status(500).send(`Fallback download error: ${err.message}`);
  }
});

// For compatibility with old applet trigger
app.post('/api/documents/mock-upload', async (req: Request, res: Response) => {
  // Redirect to unified upload endpoint
  req.url = '/api/documents/upload';
  (app as any).handle(req, res);
});



// File Download/View endpoint with backend access control and presigned download URL generation
app.get('/api/documents/:id/download', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { id } = req.params;
  const allDocs = await dbGetDocuments();
  const doc = allDocs.find(d => d.id === id);

  if (!doc) {
    return res.status(404).json({ error: 'Document metadata not found' });
  }

  // Get offering and course
  const offerings = await dbGetOfferings();
  const offering = offerings.find(o => o.id === doc.offeringId);
  if (!offering) {
    return res.status(404).json({ error: 'Associated Course Offering not found' });
  }

  const courses = await dbGetCourses();
  const course = courses.find(c => c.id === offering.courseId);
  if (!course) {
    return res.status(404).json({ error: 'Associated Course relation not found' });
  }

  // Enforce access control in the Express backend:
  // - Admin: always allowed
  // - Instructor: allowed only if they are the instructor for this CourseOffering
  // - Dept Head: allowed only if course department is in their scope
  // - Board Auditor: allowed only if offering.auditorId === currentUser.id
  let isAuthorized = false;

  if (currentUser.role === UserRole.ADMIN) {
    isAuthorized = true;
  } else if (currentUser.role === UserRole.INSTRUCTOR) {
    isAuthorized = offering.instructorId === currentUser.id;
  } else if (currentUser.role === UserRole.DEPT_HEAD) {
    const dept = currentUser.department?.toLowerCase().trim() || '';
    const oDept = course.department?.toLowerCase().trim() || '';
    isAuthorized = oDept === dept || dept.includes(oDept) || oDept.includes(dept);
  } else if (currentUser.role === UserRole.AUDITOR) {
    isAuthorized = offering.auditorId === currentUser.id;
  }

  if (!isAuthorized) {
    return res.status(403).json({ error: 'Access Denied: You do not have the required role clearance or assignment to view this folder document' });
  }

  // Only admin and dept_head can download old (non-current) versions
  if (!doc.isCurrent && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.DEPT_HEAD) {
    return res.status(403).json({ error: 'Access Denied: Only Department Heads and Admins can download old (non-current) versions of documents.' });
  }

  try {
    const isInline = req.query.download !== 'true';
    const downloadUrl = await generateDownloadUrl(doc.storagePath, 3600, isInline);
    console.log(`[Download] Authorized view/download of document ID "${id}". Redirecting to presigned URL (inline=${isInline}).`);

    const timestamp = new Date().toISOString();
    const details = `User ${currentUser.name} accessed document "${doc.fileName}" (${doc.id}).`;
    await dbCreateAuditLog({
      id: `log_${Date.now()}`,
      action: "DOWNLOAD_DOCUMENT" as any,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      timestamp,
      details,
    });

    res.redirect(downloadUrl);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve secure download link from storage.' });
  }
});

// Update Document Review Status
app.post('/api/documents/:id/status', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);

  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Only dept head or admin can review files
  if (currentUser.role !== UserRole.DEPT_HEAD && currentUser.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Unauthorized: Only Department Heads or Admins can review/verify files' });
  }

  const { id } = req.params;
  const { status, feedback } = req.body;

  if (!status || (status !== 'approved' && status !== 'rejected')) {
    return res.status(400).json({ error: 'Invalid review status' });
  }

  const updatedDoc = await dbUpdateDocument(id, status, feedback);
  if (!updatedDoc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Get offering and course info for clean logging
  const offerings = await dbGetOfferings();
  const courses = await dbGetCourses();
  const offering = offerings.find(o => o.id === updatedDoc.offeringId);
  const course = offering ? courses.find(c => c.id === offering.courseId) : null;
  const courseCode = course ? course.code : 'UNKNOWN';

  // Audit Log entry
  const actionType = status === 'approved' ? 'APPROVE_DOCUMENT' : 'REJECT_DOCUMENT';
  const timestamp = new Date().toISOString();
  const details = `${status === 'approved' ? 'Approved' : 'Rejected'} document "${updatedDoc.fileName}" for course ${courseCode}. Feedback: "${feedback || 'None'}"`;

  await dbCreateAuditLog({
    id: `log_${Date.now()}`,
    action: actionType,
    actorId: currentUser.id,
    actorName: currentUser.name,
    actorEmail: currentUser.email,
    targetDocumentId: updatedDoc.id,
    targetDocumentName: updatedDoc.fileName,
    timestamp,
    details,
  });

  res.json({
    document: {
      ...updatedDoc,
      course,
      offering,
    }
  });
});

// Export Package (ZIP Stream)
app.get('/api/offerings/:id/export-package', exportLimiter, async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Only dept head or admin can export package
  if (currentUser.role !== UserRole.DEPT_HEAD && currentUser.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Unauthorized: Only Department Heads or Admins can export packages' });
  }

  const { id } = req.params;

  const offerings = await dbGetOfferings();
  const offering = offerings.find(o => o.id === id);
  if (!offering) {
    return res.status(404).json({ error: 'Course Offering not found' });
  }

  const courses = await dbGetCourses();
  const course = courses.find(c => c.id === offering.courseId);
  if (!course) {
    return res.status(404).json({ error: 'Associated Course not found' });
  }

  const allDocs = await dbGetDocuments();
  // Filter only current versions for this offering
  const currentDocsForOffering = allDocs.filter(d => d.offeringId === id && d.isCurrent);

  const archiveName = `${offering.academicYear}.${offering.term}.${course.code}-${offering.section}_Package.zip`;

  // Set up ZIP stream headers
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${archiveName}"`);

  const archive = new ZipArchive({
    zlib: { level: 9 } // Best compression
  });

  archive.on('error', function(err: any) {
    console.error('[Export Package] Archiver error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create zip archive' });
    } else {
      res.end();
    }
  });

  archive.pipe(res);

  let includedCategories: string[] = [];

  const allCategories = await dbGetCategories();
  const coreCategories = allCategories.filter(c => c.isCore && c.isActive !== false);
  const categoriesToExport = coreCategories.length > 0 ? coreCategories.map(c => c.id) : CORE_16_CATEGORIES;

  for (let i = 0; i < categoriesToExport.length; i++) {
    const category = categoriesToExport[i];
    // Find the doc (could be multiple if not properly marked, we take first current)
    const doc = currentDocsForOffering.find(d => d.category === category);
    if (doc) {
      includedCategories.push(category);
      const prefix = (i + 1).toString().padStart(2, '0');
      const zipFileName = `${prefix}_${doc.fileName}`;
      
      try {
        const fileData = await getFile(doc.storagePath);
        archive.append(fileData.buffer, { name: zipFileName });
      } catch (err) {
        console.error(`Failed to fetch file for category ${category}`, err);
      }
    }
  }

  await archive.finalize();

  // Audit Log entry
  const actionType = 'EXPORT_PACKAGE';
  const timestamp = new Date().toISOString();
  const details = `Exported Course Portfolio Package for ${course.code} (${offering.term} ${offering.academicYear}). Included ${includedCategories.length}/${categoriesToExport.length} core categories.`;

  await dbCreateAuditLog({
    id: `log_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
    action: actionType,
    actorId: currentUser.id,
    actorName: currentUser.name,
    actorEmail: currentUser.email,
    timestamp,
    details,
  });
});

// Faculty Missing Documents Reminder Audit Logging
app.post('/api/reminders/log', async (req: Request, res: Response) => {
  const currentUser = await getSessionUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Dept Head, Admin, or Auditor can record reminder events
  if (currentUser.role !== UserRole.DEPT_HEAD && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.AUDITOR) {
    return res.status(403).json({ error: 'Unauthorized: Only Department Heads, Admins, or Reviewers can issue reminders' });
  }

  const { offeringId, facultyEmail, facultyName, courseCode, missingCount, missingCategories, deadline, subject } = req.body;
  const timestamp = new Date().toISOString();
  const categoriesList = Array.isArray(missingCategories) ? missingCategories.join(', ') : 'Course file components';
  const deadlineNote = deadline ? ` Deadline: "${deadline}".` : '';
  const details = `Reminder dispatched via Personal Gmail to ${facultyName || facultyEmail} <${facultyEmail}> for course ${courseCode || 'Portfolio'} (${missingCount || 0} missing documents: ${categoriesList}).${deadlineNote} Subject: "${subject || 'Missing Course File Submissions'}"`;

  try {
    const newLog = await dbCreateAuditLog({
      id: `log_${Date.now()}`,
      action: 'FACULTY_REMINDER_SENT' as any,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      targetDocumentId: offeringId || undefined,
      targetDocumentName: `${courseCode || 'Course'} Portfolio Notice`,
      timestamp,
      details,
    });

    res.json({ success: true, log: newLog });
  } catch (err: any) {
    console.error('[Reminder Log Error]', err);
    res.status(500).json({ error: 'Failed to record reminder in audit log' });
  }
});

// System Audit Log
app.get('/api/audit-log', async (req: Request, res: Response) => {
  const auditLogs = await dbGetAuditLogs();
  // Sort reverse chronological
  const sortedLogs = [...auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json({ auditLogs: sortedLogs });
});

// Mount Vite middleware for dev / serve static assets in production
async function startServer() {
  // Ensure database schema initialized before handling requests
  await initDatabaseSchema();

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Mounted Vite middleware for development.');
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Server] Serving compiled production frontend.');
  }

  // Start Server on PORT 3000 (The standard external ingress port)
  if (!process.env.VERCEL) {
    const PORT = 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] University course-file archive application running on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();

export default app;
