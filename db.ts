import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
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
  DOCUMENT_CATEGORIES,
  CORE_16_CATEGORIES
} from './src/types.js';

let currentDir = '';
if (typeof __dirname !== 'undefined') {
  currentDir = __dirname;
} else {
  currentDir = process.cwd();
}

// In a serverless/Vercel environment, the root directory is read-only.
// We use /tmp for reading and writing local JSON database.
const IS_VERCEL = !!process.env.VERCEL;
const BUNDLED_DATA_DIR = path.join(currentDir, 'data');
const BUNDLED_DB_FILE = path.join(BUNDLED_DATA_DIR, 'db.json');

const DATA_DIR = IS_VERCEL ? '/tmp' : BUNDLED_DATA_DIR;
const DB_FILE = IS_VERCEL ? '/tmp/db.json' : BUNDLED_DB_FILE;

// Ensure local db.json is initialized in /tmp if running on Vercel
if (IS_VERCEL) {
  try {
    if (!fs.existsSync(DB_FILE)) {
      if (fs.existsSync(BUNDLED_DB_FILE)) {
        if (!fs.existsSync('/tmp')) {
          fs.mkdirSync('/tmp', { recursive: true });
        }
        fs.copyFileSync(BUNDLED_DB_FILE, DB_FILE);
        console.log('[Database] Copied bundled db.json to /tmp/db.json');
      } else {
        console.log('[Database] Bundled db.json not found, a new one will be created.');
      }
    }
  } catch (err) {
    console.error('[Database] Failed to copy bundled db.json to /tmp:', err);
  }
}

// Initial Seed Data
const INITIAL_USERS: User[] = [
  {
    id: 'user_1',
    name: 'Dr. Alice Smith',
    email: 'alice@university.edu',
    role: UserRole.INSTRUCTOR,
    department: 'Computer Science & Engineering',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  },
  {
    id: 'user_2',
    name: 'Prof. Bob Johnson',
    email: 'bob@university.edu',
    role: UserRole.INSTRUCTOR,
    department: 'Computer Science & Engineering',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  },
  {
    id: 'user_3',
    name: 'Dr. Sarah Jenkins',
    email: 'head@university.edu',
    role: UserRole.DEPT_HEAD,
    department: 'Computer Science & Engineering',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  },
  {
    id: 'user_4',
    name: 'James Carter',
    email: 'auditor@university.edu',
    role: UserRole.AUDITOR,
    department: 'Academic Registry',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
  },
  {
    id: 'user_5',
    name: 'Admin Controller',
    email: 'admin@university.edu',
    role: UserRole.ADMIN,
    department: 'IT Administration',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
  {
    id: 'user_dev',
    name: 'Talha (Developer)',
    email: 'talharupok2022@gmail.com',
    role: UserRole.ADMIN,
    department: 'IT Administration',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  },
];

const INITIAL_COURSES: Course[] = [
  {
    id: 'course_1',
    code: 'CSE407',
    title: 'Software Engineering',
    department: 'Computer Science & Engineering',
  },
  {
    id: 'course_2',
    code: 'CSE301',
    title: 'Database Management Systems',
    department: 'Computer Science & Engineering',
  },
  {
    id: 'course_3',
    code: 'EEE201',
    title: 'Electrical Circuits',
    department: 'Electrical & Electronic Engineering',
  },
  {
    id: 'course_4',
    code: 'MAT102',
    title: 'Calculus II',
    department: 'Mathematics',
  },
];

const INITIAL_OFFERINGS: CourseOffering[] = [
  {
    id: 'offering_1',
    courseId: 'course_1',
    academicYear: 2025,
    term: Term.SPRING,
    section: '01',
    instructorId: 'user_1',
  },
  {
    id: 'offering_2',
    courseId: 'course_1',
    academicYear: 2025,
    term: Term.SPRING,
    section: '02',
    instructorId: 'user_2',
  },
  {
    id: 'offering_3',
    courseId: 'course_2',
    academicYear: 2025,
    term: Term.SPRING,
    section: '01',
    instructorId: 'user_1',
  },
  {
    id: 'offering_4',
    courseId: 'course_3',
    academicYear: 2024,
    term: Term.FALL,
    section: '01',
    instructorId: 'user_2',
  },
];

const INITIAL_CATEGORIES: CategoryConfig[] = DOCUMENT_CATEGORIES.map(c => ({
  id: c.value,
  label: c.label,
  group: c.group,
  isCore: CORE_16_CATEGORIES.includes(c.value),
  isActive: true,
}));

interface Database {
  users: User[];
  courses: Course[];
  offerings: CourseOffering[];
  documents: Document[];
  auditLogs: AuditLogEntry[];
  categories?: CategoryConfig[];
}

const isPostgresConfigured = !!process.env.DATABASE_URL;
let sql: any = null;

if (isPostgresConfigured) {
  try {
    sql = postgres(process.env.DATABASE_URL!, {
      ssl: 'require',
      connect_timeout: 10,
    });
    console.log('[Database] Connected to Neon PostgreSQL.');
  } catch (err) {
    console.error('[Database] Failed to connect to PostgreSQL:', err);
  }
} else {
  console.log('[Database] DATABASE_URL not set. Falling back to local db.json.');
}

let initPromise: Promise<void> | null = null;

// Function to initialize schema in PostgreSQL
export function initDatabaseSchema(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    if (!isPostgresConfigured || !sql) {
      return;
    }

    try {
      console.log('[Database] Ensuring tables exist in PostgreSQL...');
      
      // Create users table
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          role VARCHAR(50) NOT NULL,
          department VARCHAR(100),
          avatar_url TEXT,
          pending_approval BOOLEAN DEFAULT FALSE
        )
      `;

      // Ensure pending_approval column exists if users table was created previously
      await sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_approval BOOLEAN DEFAULT FALSE
      `;

      // Create courses table
      await sql`
        CREATE TABLE IF NOT EXISTS courses (
          id VARCHAR(50) PRIMARY KEY,
          code VARCHAR(50) UNIQUE NOT NULL,
          title VARCHAR(200) NOT NULL,
          department VARCHAR(100) NOT NULL
        )
      `;

      // Create offerings table
      await sql`
        CREATE TABLE IF NOT EXISTS offerings (
          id VARCHAR(50) PRIMARY KEY,
          course_id VARCHAR(50) REFERENCES courses(id) ON DELETE CASCADE,
          academic_year INTEGER NOT NULL,
          term VARCHAR(50) NOT NULL,
          section VARCHAR(50) NOT NULL,
          instructor_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
          auditor_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
          CONSTRAINT unique_offering UNIQUE (course_id, academic_year, term, section)
        )
      `;

      // Ensure auditor_id column exists if offerings table was created previously
      await sql`
        ALTER TABLE offerings ADD COLUMN IF NOT EXISTS auditor_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL
      `;

      // Create documents table
      await sql`
        CREATE TABLE IF NOT EXISTS documents (
          id VARCHAR(50) PRIMARY KEY,
          offering_id VARCHAR(50) REFERENCES offerings(id) ON DELETE CASCADE,
          category VARCHAR(100) NOT NULL,
          version INTEGER NOT NULL,
          is_current BOOLEAN DEFAULT TRUE,
          file_name VARCHAR(255) NOT NULL,
          file_hash VARCHAR(100) NOT NULL,
          uploaded_by VARCHAR(100) NOT NULL,
          uploaded_at VARCHAR(100) NOT NULL,
          storage_path TEXT NOT NULL,
          status VARCHAR(50) NOT NULL,
          feedback TEXT,
          is_deleted BOOLEAN DEFAULT FALSE,
          deleted_at VARCHAR(100)
        )
      `;

      await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE`;
      await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at VARCHAR(100)`;

      // Create categories table
      await sql`
        CREATE TABLE IF NOT EXISTS categories (
          id VARCHAR(100) PRIMARY KEY,
          label VARCHAR(200) NOT NULL,
          group_name VARCHAR(100) NOT NULL,
          is_core BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE
        )
      `;

      // Create audit_logs table
      await sql`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(50) PRIMARY KEY,
          action VARCHAR(100) NOT NULL,
          actor_id VARCHAR(50) NOT NULL,
          actor_name VARCHAR(100) NOT NULL,
          actor_email VARCHAR(100) NOT NULL,
          target_document_id VARCHAR(50),
          target_document_name VARCHAR(255),
          timestamp VARCHAR(100) NOT NULL,
          details TEXT NOT NULL,
          entry_hash VARCHAR(100),
          previous_entry_hash VARCHAR(100)
        )
      `;

      // Ensure entry_hash and previous_entry_hash exist and are nullable if table was created previously
      await sql`
        ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entry_hash VARCHAR(100) DEFAULT ''
      `;
      await sql`
        ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS previous_entry_hash VARCHAR(100) DEFAULT ''
      `;
      await sql`
        ALTER TABLE audit_logs ALTER COLUMN entry_hash DROP NOT NULL
      `;
      await sql`
        ALTER TABLE audit_logs ALTER COLUMN previous_entry_hash DROP NOT NULL
      `;

      // Seed Initial Data if empty
      const usersCount = await sql`SELECT count(*) FROM users`;
      if (parseInt(usersCount[0].count) === 0) {
        console.log('[Database] Seeding initial users...');
        for (const u of INITIAL_USERS) {
          await sql`
            INSERT INTO users (id, name, email, role, department, avatar_url)
            VALUES (${u.id}, ${u.name}, ${u.email}, ${u.role}, ${u.department}, ${u.avatarUrl})
          `;
        }
      }

      const coursesCount = await sql`SELECT count(*) FROM courses`;
      if (parseInt(coursesCount[0].count) === 0) {
        console.log('[Database] Seeding initial courses...');
        for (const c of INITIAL_COURSES) {
          await sql`
            INSERT INTO courses (id, code, title, department)
            VALUES (${c.id}, ${c.code}, ${c.title}, ${c.department})
          `;
        }
      }

      const offeringsCount = await sql`SELECT count(*) FROM offerings`;
      if (parseInt(offeringsCount[0].count) === 0) {
        console.log('[Database] Seeding initial offerings...');
        for (const o of INITIAL_OFFERINGS) {
          await sql`
            INSERT INTO offerings (id, course_id, academic_year, term, section, instructor_id)
            VALUES (${o.id}, ${o.courseId}, ${o.academicYear}, ${o.term}, ${o.section}, ${o.instructorId})
          `;
        }
      }

      console.log('[Database] Syncing official categories with database...');
      for (const cat of INITIAL_CATEGORIES) {
        await sql`
          INSERT INTO categories (id, label, group_name, is_core, is_active)
          VALUES (${cat.id}, ${cat.label}, ${cat.group}, ${cat.isCore}, ${cat.isActive})
          ON CONFLICT (id) DO UPDATE SET
            label = EXCLUDED.label,
            group_name = EXCLUDED.group_name,
            is_core = EXCLUDED.is_core
        `;
      }

      console.log('[Database] PostgreSQL schema verification and seeding complete.');
    } catch (err) {
      console.error('[Database] Failed to initialize PostgreSQL tables, falling back to db.json:', err);
      sql = null; // Fallback to JSON db on schema creation errors
    }
  })();

  return initPromise;
}

// Local db.json fallback helpers
function readLocalDB(): Database {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const seedDB: Database = {
        users: INITIAL_USERS,
        courses: INITIAL_COURSES,
        offerings: INITIAL_OFFERINGS,
        documents: [],
        categories: INITIAL_CATEGORIES,
        auditLogs: [{
          id: 'log_0',
          action: 'SYSTEM_INIT',
          actorId: 'system',
          actorName: 'System Core',
          actorEmail: 'system@university.edu',
          timestamp: new Date().toISOString(),
          details: 'System initialized with core course catalog',
        }],
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(seedDB, null, 2), 'utf-8');
      return seedDB;
    }
    const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
    const parsedDB: Database = JSON.parse(fileContent);
    if (!parsedDB.categories) {
      parsedDB.categories = INITIAL_CATEGORIES;
      writeLocalDB(parsedDB);
    }
    return parsedDB;
  } catch (error) {
    return {
      users: INITIAL_USERS,
      courses: INITIAL_COURSES,
      offerings: INITIAL_OFFERINGS,
      documents: [],
      categories: INITIAL_CATEGORIES,
      auditLogs: [],
    };
  }
}

function writeLocalDB(data: Database) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing local db.json:', error);
  }
}

// UNIFIED API METHODS

// USERS
export async function dbGetUsers(): Promise<User[]> {
  if (sql) {
    const rows = await sql`SELECT id, name, email, role, department, avatar_url as "avatarUrl", pending_approval as "pendingApproval" FROM users`;
    return rows as User[];
  }
  const db = readLocalDB();
  return db.users;
}

export async function dbGetUserByEmail(email: string): Promise<User | null> {
  if (sql) {
    const rows = await sql`
      SELECT id, name, email, role, department, avatar_url as "avatarUrl", pending_approval as "pendingApproval" 
      FROM users 
      WHERE LOWER(email) = LOWER(${email})
    `;
    return rows.length > 0 ? (rows[0] as User) : null;
  }
  const db = readLocalDB();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function dbCreateUser(user: User): Promise<User> {
  if (sql) {
    await sql`
      INSERT INTO users (id, name, email, role, department, avatar_url, pending_approval)
      VALUES (${user.id}, ${user.name}, ${user.email}, ${user.role}, ${user.department}, ${user.avatarUrl}, ${user.pendingApproval || false})
    `;
    return user;
  }
  const db = readLocalDB();
  db.users.push(user);
  writeLocalDB(db);
  return user;
}

export async function dbUpdateUserRole(userId: string, role: string, department?: string, pendingApproval?: boolean): Promise<User | null> {
  if (sql) {
    let rows;
    if (department !== undefined && pendingApproval !== undefined) {
      rows = await sql`
        UPDATE users 
        SET role = ${role}, department = ${department}, pending_approval = ${pendingApproval}
        WHERE id = ${userId}
        RETURNING id, name, email, role, department, avatar_url as "avatarUrl", pending_approval as "pendingApproval"
      `;
    } else if (department !== undefined) {
      rows = await sql`
        UPDATE users 
        SET role = ${role}, department = ${department}
        WHERE id = ${userId}
        RETURNING id, name, email, role, department, avatar_url as "avatarUrl", pending_approval as "pendingApproval"
      `;
    } else if (pendingApproval !== undefined) {
      rows = await sql`
        UPDATE users 
        SET role = ${role}, pending_approval = ${pendingApproval}
        WHERE id = ${userId}
        RETURNING id, name, email, role, department, avatar_url as "avatarUrl", pending_approval as "pendingApproval"
      `;
    } else {
      rows = await sql`
        UPDATE users 
        SET role = ${role}
        WHERE id = ${userId}
        RETURNING id, name, email, role, department, avatar_url as "avatarUrl", pending_approval as "pendingApproval"
      `;
    }
    return rows.length > 0 ? (rows[0] as User) : null;
  }
  const db = readLocalDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) return null;
  user.role = role as any;
  if (department !== undefined) {
    user.department = department;
  }
  if (pendingApproval !== undefined) {
    user.pendingApproval = pendingApproval;
  }
  writeLocalDB(db);
  return user;
}

// COURSES
export async function dbGetCourses(): Promise<Course[]> {
  if (sql) {
    const rows = await sql`SELECT id, code, title, department FROM courses`;
    return rows as Course[];
  }
  const db = readLocalDB();
  return db.courses;
}

export async function dbCreateCourse(course: Course): Promise<Course> {
  if (sql) {
    await sql`
      INSERT INTO courses (id, code, title, department)
      VALUES (${course.id}, ${course.code}, ${course.title}, ${course.department})
    `;
    return course;
  }
  const db = readLocalDB();
  db.courses.push(course);
  writeLocalDB(db);
  return course;
}

// OFFERINGS
export async function dbGetOfferings(): Promise<CourseOffering[]> {
  if (sql) {
    const rows = await sql`
      SELECT id, course_id as "courseId", academic_year as "academicYear", term, section, instructor_id as "instructorId", auditor_id as "auditorId" 
      FROM offerings
    `;
    return rows as CourseOffering[];
  }
  const db = readLocalDB();
  return db.offerings;
}

export async function dbCreateOffering(offering: CourseOffering): Promise<CourseOffering> {
  if (sql) {
    await sql`
      INSERT INTO offerings (id, course_id, academic_year, term, section, instructor_id, auditor_id)
      VALUES (${offering.id}, ${offering.courseId}, ${offering.academicYear}, ${offering.term}, ${offering.section}, ${offering.instructorId}, ${offering.auditorId || null})
    `;
    return offering;
  }
  const db = readLocalDB();
  db.offerings.push(offering);
  writeLocalDB(db);
  return offering;
}

export async function dbUpdateOfferingAuditor(offeringId: string, auditorId: string | null): Promise<CourseOffering | null> {
  if (sql) {
    const rows = await sql`
      UPDATE offerings 
      SET auditor_id = ${auditorId} 
      WHERE id = ${offeringId}
      RETURNING id, course_id as "courseId", academic_year as "academicYear", term, section, instructor_id as "instructorId", auditor_id as "auditorId"
    `;
    return rows.length > 0 ? (rows[0] as CourseOffering) : null;
  }
  const db = readLocalDB();
  const offering = db.offerings.find(o => o.id === offeringId);
  if (!offering) return null;
  offering.auditorId = auditorId || undefined;
  writeLocalDB(db);
  return offering;
}

// CATEGORIES
export async function dbGetCategories(): Promise<CategoryConfig[]> {
  if (sql) {
    const rows = await sql`
      SELECT 
        id, 
        label, 
        group_name as "group", 
        is_core as "isCore", 
        is_active as "isActive" 
      FROM categories
      WHERE is_active = TRUE
    `;
    return rows as CategoryConfig[];
  }
  const db = readLocalDB();
  return (db.categories || INITIAL_CATEGORIES).filter(c => c.isActive !== false);
}

export async function dbGetAllCategories(): Promise<CategoryConfig[]> {
  if (sql) {
    const rows = await sql`
      SELECT 
        id, 
        label, 
        group_name as "group", 
        is_core as "isCore", 
        is_active as "isActive" 
      FROM categories
    `;
    return rows as CategoryConfig[];
  }
  const db = readLocalDB();
  return db.categories || INITIAL_CATEGORIES;
}

export async function dbCreateCategory(category: CategoryConfig): Promise<CategoryConfig> {
  if (sql) {
    await sql`
      INSERT INTO categories (id, label, group_name, is_core, is_active)
      VALUES (${category.id}, ${category.label}, ${category.group}, ${category.isCore}, ${category.isActive})
    `;
    return category;
  }
  const db = readLocalDB();
  if (!db.categories) db.categories = [...INITIAL_CATEGORIES];
  const existingIndex = db.categories.findIndex(c => c.id === category.id);
  if (existingIndex >= 0) {
    db.categories[existingIndex] = category;
  } else {
    db.categories.push(category);
  }
  writeLocalDB(db);
  return category;
}

export async function dbUpdateCategory(id: string, updates: Partial<CategoryConfig>): Promise<CategoryConfig | null> {
  if (sql) {
    const existing = await sql`SELECT id, label, group_name as "group", is_core as "isCore", is_active as "isActive" FROM categories WHERE id = ${id}`;
    if (existing.length === 0) return null;
    const current = existing[0];
    const updatedLabel = updates.label !== undefined ? updates.label : current.label;
    const updatedGroup = updates.group !== undefined ? updates.group : current.group;
    const updatedIsCore = updates.isCore !== undefined ? updates.isCore : current.isCore;
    const updatedIsActive = updates.isActive !== undefined ? updates.isActive : current.isActive;

    const rows = await sql`
      UPDATE categories
      SET label = ${updatedLabel}, group_name = ${updatedGroup}, is_core = ${updatedIsCore}, is_active = ${updatedIsActive}
      WHERE id = ${id}
      RETURNING id, label, group_name as "group", is_core as "isCore", is_active as "isActive"
    `;
    return rows.length > 0 ? (rows[0] as CategoryConfig) : null;
  }
  const db = readLocalDB();
  if (!db.categories) db.categories = [...INITIAL_CATEGORIES];
  const cat = db.categories.find(c => c.id === id);
  if (!cat) return null;
  if (updates.label !== undefined) cat.label = updates.label;
  if (updates.group !== undefined) cat.group = updates.group;
  if (updates.isCore !== undefined) cat.isCore = updates.isCore;
  if (updates.isActive !== undefined) cat.isActive = updates.isActive;
  writeLocalDB(db);
  return cat;
}

export async function dbDeleteCategory(id: string): Promise<boolean> {
  // Soft delete category
  const res = await dbUpdateCategory(id, { isActive: false });
  return !!res;
}

// DOCUMENTS
export async function dbGetDocuments(): Promise<Document[]> {
  if (sql) {
    const rows = await sql`
      SELECT 
        id, 
        offering_id as "offeringId", 
        category, 
        version, 
        is_current as "isCurrent", 
        file_name as "fileName", 
        file_hash as "fileHash", 
        uploaded_by as "uploadedBy", 
        uploaded_at as "uploadedAt", 
        storage_path as "storagePath", 
        status, 
        feedback,
        is_deleted as "isDeleted",
        deleted_at as "deletedAt"
      FROM documents
      WHERE is_deleted = FALSE OR is_deleted IS NULL
    `;
    return rows as Document[];
  }
  const db = readLocalDB();
  return db.documents.filter(d => !d.isDeleted);
}

export async function dbGetTrashDocuments(): Promise<Document[]> {
  if (sql) {
    const rows = await sql`
      SELECT 
        id, 
        offering_id as "offeringId", 
        category, 
        version, 
        is_current as "isCurrent", 
        file_name as "fileName", 
        file_hash as "fileHash", 
        uploaded_by as "uploadedBy", 
        uploaded_at as "uploadedAt", 
        storage_path as "storagePath", 
        status, 
        feedback,
        is_deleted as "isDeleted",
        deleted_at as "deletedAt"
      FROM documents
      WHERE is_deleted = TRUE
    `;
    return rows as Document[];
  }
  const db = readLocalDB();
  return db.documents.filter(d => d.isDeleted === true);
}

export async function dbCreateDocument(doc: Document): Promise<Document> {
  if (sql) {
    // If we mark this doc as current, set other docs of same offering and category as not current
    if (doc.isCurrent) {
      await sql`
        UPDATE documents 
        SET is_current = FALSE 
        WHERE offering_id = ${doc.offeringId} AND category = ${doc.category}
      `;
    }
    await sql`
      INSERT INTO documents (
        id, offering_id, category, version, is_current, 
        file_name, file_hash, uploaded_by, uploaded_at, storage_path, status, feedback,
        is_deleted, deleted_at
      )
      VALUES (
        ${doc.id}, ${doc.offeringId}, ${doc.category}, ${doc.version}, ${doc.isCurrent}, 
        ${doc.fileName}, ${doc.fileHash || ''}, ${doc.uploadedBy}, ${doc.uploadedAt}, ${doc.storagePath}, ${doc.status}, ${doc.feedback || null},
        FALSE, NULL
      )
    `;
    return doc;
  }
  const db = readLocalDB();
  if (doc.isCurrent) {
    db.documents.forEach(d => {
      if (d.offeringId === doc.offeringId && d.category === doc.category) {
        d.isCurrent = false;
      }
    });
  }
  db.documents.push(doc);
  writeLocalDB(db);
  return doc;
}

export async function dbUpdateDocument(id: string, status: string, feedback: string): Promise<Document | null> {
  if (sql) {
    const rows = await sql`
      UPDATE documents 
      SET status = ${status}, feedback = ${feedback} 
      WHERE id = ${id}
      RETURNING 
        id, offering_id as "offeringId", category, version, is_current as "isCurrent", 
        file_name as "fileName", file_hash as "fileHash", uploaded_by as "uploadedBy", 
        uploaded_at as "uploadedAt", storage_path as "storagePath", status, feedback,
        is_deleted as "isDeleted", deleted_at as "deletedAt"
    `;
    return rows.length > 0 ? (rows[0] as Document) : null;
  }
  const db = readLocalDB();
  const doc = db.documents.find(d => d.id === id);
  if (!doc) return null;
  doc.status = status as any;
  doc.feedback = feedback;
  writeLocalDB(db);
  return doc;
}

export async function dbDeleteDocument(id: string): Promise<boolean> {
  const timestamp = new Date().toISOString();
  if (sql) {
    const result = await sql`
      UPDATE documents 
      SET is_deleted = TRUE, deleted_at = ${timestamp}
      WHERE id = ${id}
    `;
    return result.count > 0;
  }
  const db = readLocalDB();
  const doc = db.documents.find(d => d.id === id);
  if (doc) {
    doc.isDeleted = true;
    doc.deletedAt = timestamp;
    writeLocalDB(db);
    return true;
  }
  return false;
}

export async function dbGetNextDocumentVersion(offeringId: string, category: string): Promise<number> {
  if (sql) {
    const rows = await sql`
      SELECT COALESCE(MAX(version), 0) as "maxVersion"
      FROM documents
      WHERE offering_id = ${offeringId} AND category = ${category}
    `;
    return Number(rows[0]?.maxVersion || 0) + 1;
  }
  const db = readLocalDB();
  const existing = db.documents.filter(d => d.offeringId === offeringId && d.category === category);
  const maxV = existing.reduce((max, d) => Math.max(max, d.version || 0), 0);
  return maxV + 1;
}

export async function dbRestoreDocument(id: string): Promise<boolean> {
  if (sql) {
    const rows = await sql`SELECT offering_id as "offeringId", category FROM documents WHERE id = ${id}`;
    if (rows.length === 0) return false;
    const { offeringId, category } = rows[0];

    // Check if there is already an active current document for this offering and category
    const activeCurrent = await sql`
      SELECT id FROM documents 
      WHERE offering_id = ${offeringId} AND category = ${category} AND is_current = TRUE AND (is_deleted = FALSE OR is_deleted IS NULL)
    `;
    const shouldBeCurrent = activeCurrent.length === 0;

    const result = await sql`
      UPDATE documents 
      SET is_deleted = FALSE, deleted_at = NULL, is_current = ${shouldBeCurrent}
      WHERE id = ${id}
    `;
    return result.count > 0;
  }
  const db = readLocalDB();
  const doc = db.documents.find(d => d.id === id);
  if (doc) {
    const hasActiveCurrent = db.documents.some(d => 
      d.id !== id && 
      d.offeringId === doc.offeringId && 
      d.category === doc.category && 
      d.isCurrent && 
      !d.isDeleted
    );
    doc.isDeleted = false;
    doc.deletedAt = undefined;
    doc.isCurrent = !hasActiveCurrent;
    writeLocalDB(db);
    return true;
  }
  return false;
}

export async function dbPurgeDocument(id: string): Promise<Document | null> {
  if (sql) {
    const rows = await sql`
      DELETE FROM documents 
      WHERE id = ${id}
      RETURNING 
        id, offering_id as "offeringId", category, version, is_current as "isCurrent", 
        file_name as "fileName", file_hash as "fileHash", uploaded_by as "uploadedBy", 
        uploaded_at as "uploadedAt", storage_path as "storagePath", status, feedback
    `;
    return rows.length > 0 ? (rows[0] as Document) : null;
  }
  const db = readLocalDB();
  const targetDoc = db.documents.find(d => d.id === id) || null;
  if (targetDoc) {
    db.documents = db.documents.filter(d => d.id !== id);
    writeLocalDB(db);
  }
  return targetDoc;
}

// AUDIT LOGS
export async function dbGetAuditLogs(): Promise<AuditLogEntry[]> {
  if (sql) {
    const rows = await sql`
      SELECT 
        id, 
        action, 
        actor_id as "actorId", 
        actor_name as "actorName", 
        actor_email as "actorEmail", 
        target_document_id as "targetDocumentId", 
        target_document_name as "targetDocumentName", 
        timestamp, 
        details,
        entry_hash as "entryHash",
        previous_entry_hash as "previousEntryHash"
      FROM audit_logs
    `;
    return rows as AuditLogEntry[];
  }
  const db = readLocalDB();
  return db.auditLogs;
}

export async function dbCreateAuditLog(log: AuditLogEntry): Promise<AuditLogEntry> {
  const calculatedHash = log.entryHash || '';
  const prevHash = log.previousEntryHash || '';

  const fullLog: AuditLogEntry = {
    ...log,
    entryHash: calculatedHash,
    previousEntryHash: prevHash,
  };

  if (sql) {
    await sql`
      INSERT INTO audit_logs (
        id, action, actor_id, actor_name, actor_email, 
        target_document_id, target_document_name, timestamp, details,
        entry_hash, previous_entry_hash
      )
      VALUES (
        ${fullLog.id}, ${fullLog.action}, ${fullLog.actorId}, ${fullLog.actorName}, ${fullLog.actorEmail}, 
        ${fullLog.targetDocumentId || null}, ${fullLog.targetDocumentName || null}, ${fullLog.timestamp}, ${fullLog.details},
        ${fullLog.entryHash}, ${fullLog.previousEntryHash}
      )
    `;
    return fullLog;
  }
  const db = readLocalDB();
  db.auditLogs.push(fullLog);
  writeLocalDB(db);
  return fullLog;
}
