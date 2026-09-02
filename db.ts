import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
  CORE_16_CATEGORIES,
  AppNotification
} from './src/types.js';

// Password Hashing & Verification Utilities
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedPasswordHash?: string): boolean {
  if (!storedPasswordHash) return false;
  const parts = storedPasswordHash.split(':');
  if (parts.length !== 2) {
    return storedPasswordHash === password;
  }
  const [salt, originalHash] = parts;
  const hashToVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hashToVerify === originalHash;
}

// Default initial password hash for pre-seeded accounts: "ewu123456"
export const DEFAULT_SEED_PASSWORD_HASH = hashPassword('ewu123456');

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
    id: 'user_maheen',
    name: 'Dr. Maheen Islam',
    email: 'maheen@ewubd.edu',
    role: UserRole.DEPT_HEAD,
    department: 'Department of Computer Science & Engineering',
    pendingApproval: false,
    passwordHash: DEFAULT_SEED_PASSWORD_HASH,
  },
  {
    id: 'user_mcctuhin',
    name: 'Rashedul Amin Tuhin',
    email: 'mcctuhin@ewubd.edu',
    role: UserRole.INSTRUCTOR,
    department: 'Department of Computer Science & Engineering',
    pendingApproval: false,
    passwordHash: DEFAULT_SEED_PASSWORD_HASH,
  },
  {
    id: 'user_taskeed',
    name: 'Dr. Taskeed Jabid',
    email: 'taskeed@ewubd.edu',
    role: UserRole.INSTRUCTOR,
    department: 'Department of Computer Science & Engineering',
    pendingApproval: false,
    passwordHash: DEFAULT_SEED_PASSWORD_HASH,
  },
  {
    id: 'user_wasif',
    name: 'Dr. Ahmed Wasif Reza',
    email: 'wasif@ewubd.edu',
    role: UserRole.INSTRUCTOR,
    department: 'Department of Computer Science & Engineering',
    pendingApproval: false,
    passwordHash: DEFAULT_SEED_PASSWORD_HASH,
  },
  {
    id: 'user_data_entry',
    name: 'Universal Data Entry Assistant',
    email: 'data-entry@ewubd.edu',
    role: UserRole.INSTRUCTOR,
    department: 'Department of Computer Science & Engineering',
    pendingApproval: false,
    passwordHash: DEFAULT_SEED_PASSWORD_HASH,
  },
  {
    id: 'user_dev',
    name: 'Talha (Developer)',
    email: 'talharupok2022@gmail.com',
    role: UserRole.ADMIN,
    department: 'Department of Computer Science & Engineering',
    pendingApproval: false,
    passwordHash: DEFAULT_SEED_PASSWORD_HASH,
  },
  {
    id: 'user_1',
    name: 'Dr. Alice Smith',
    email: 'alice@university.edu',
    role: UserRole.INSTRUCTOR,
    department: 'Computer Science & Engineering',
    pendingApproval: false,
    passwordHash: DEFAULT_SEED_PASSWORD_HASH,
  },
  {
    id: 'user_2',
    name: 'Prof. Bob Johnson',
    email: 'bob@university.edu',
    role: UserRole.INSTRUCTOR,
    department: 'Computer Science & Engineering',
    pendingApproval: false,
    passwordHash: DEFAULT_SEED_PASSWORD_HASH,
  },
  {
    id: 'user_3',
    name: 'Dr. Sarah Jenkins',
    email: 'head@university.edu',
    role: UserRole.DEPT_HEAD,
    department: 'Computer Science & Engineering',
    pendingApproval: false,
    passwordHash: DEFAULT_SEED_PASSWORD_HASH,
  },
  {
    id: 'user_4',
    name: 'James Carter',
    email: 'auditor@university.edu',
    role: UserRole.AUDITOR,
    department: 'Academic Registry',
    pendingApproval: false,
    passwordHash: DEFAULT_SEED_PASSWORD_HASH,
  },
  {
    id: 'user_5',
    name: 'Admin Controller',
    email: 'admin@university.edu',
    role: UserRole.ADMIN,
    department: 'IT Administration',
    pendingApproval: false,
    passwordHash: DEFAULT_SEED_PASSWORD_HASH,
  },
];

const INITIAL_COURSES: Course[] = [
  // Core CSE Courses
  { id: 'course_cse412', code: 'CSE412', title: 'Software Engineering', department: 'Computer Science & Engineering' },
  { id: 'course_cse302', code: 'CSE302', title: 'Database Systems', department: 'Computer Science & Engineering' },
  { id: 'course_cse103', code: 'CSE103', title: 'Structured Programming', department: 'Computer Science & Engineering' },
  { id: 'course_cse106', code: 'CSE106', title: 'Discrete Mathematics', department: 'Computer Science & Engineering' },
  { id: 'course_cse110', code: 'CSE110', title: 'Object Oriented Programming', department: 'Computer Science & Engineering' },
  { id: 'course_cse200', code: 'CSE200', title: 'Computer-Aided Engineering Drawing', department: 'Computer Science & Engineering' },
  { id: 'course_cse207', code: 'CSE207', title: 'Data Structures', department: 'Computer Science & Engineering' },
  { id: 'course_cse209', code: 'CSE209', title: 'Electrical Circuits', department: 'Computer Science & Engineering' },
  { id: 'course_cse225', code: 'CSE225', title: 'Numerical Methods', department: 'Computer Science & Engineering' },
  { id: 'course_cse246', code: 'CSE246', title: 'Algorithms', department: 'Computer Science & Engineering' },
  { id: 'course_cse251', code: 'CSE251', title: 'Electronic Circuits', department: 'Computer Science & Engineering' },
  { id: 'course_cse303', code: 'CSE303', title: 'Statistics for Data Science', department: 'Computer Science & Engineering' },
  { id: 'course_cse313', code: 'CSE313', title: 'Theory of Computations', department: 'Computer Science & Engineering' },
  { id: 'course_cse325', code: 'CSE325', title: 'Operating Systems', department: 'Computer Science & Engineering' },
  { id: 'course_cse345', code: 'CSE345', title: 'Digital Logic Design', department: 'Computer Science & Engineering' },
  { id: 'course_cse347', code: 'CSE347', title: 'Information System Analysis and Design', department: 'Computer Science & Engineering' },
  { id: 'course_cse350', code: 'CSE350', title: 'Data Communications', department: 'Computer Science & Engineering' },
  { id: 'course_cse355', code: 'CSE355', title: 'Digital System Design', department: 'Computer Science & Engineering' },
  { id: 'course_cse360', code: 'CSE360', title: 'Computer Architecture', department: 'Computer Science & Engineering' },
  { id: 'course_cse366', code: 'CSE366', title: 'Artificial Intelligence', department: 'Computer Science & Engineering' },
  { id: 'course_cse400a', code: 'CSE400A', title: 'Capstone Project (Part 1 of 3)', department: 'Computer Science & Engineering' },
  { id: 'course_cse400b', code: 'CSE400B', title: 'Capstone Project (Part 2 of 3)', department: 'Computer Science & Engineering' },
  { id: 'course_cse400c', code: 'CSE400C', title: 'Capstone Project (Part 3 of 3)', department: 'Computer Science & Engineering' },
  { id: 'course_cse405', code: 'CSE405', title: 'Computer Networks', department: 'Computer Science & Engineering' },
  { id: 'course_cse406', code: 'CSE406', title: 'Internet of Things', department: 'Computer Science & Engineering' },
  { id: 'course_cse407', code: 'CSE407', title: 'Green Computing', department: 'Computer Science & Engineering' },
  { id: 'course_cse420', code: 'CSE420', title: 'Computer Graphics', department: 'Computer Science & Engineering' },
  { id: 'course_cse422', code: 'CSE422', title: 'Simulation and Modeling', department: 'Computer Science & Engineering' },
  { id: 'course_cse423', code: 'CSE423', title: 'Software Architecture', department: 'Computer Science & Engineering' },
  { id: 'course_cse428', code: 'CSE428', title: 'Human Computer Interactions', department: 'Computer Science & Engineering' },
  { id: 'course_cse430', code: 'CSE430', title: 'Software Testing and Quality Assurance', department: 'Computer Science & Engineering' },
  { id: 'course_cse432', code: 'CSE432', title: 'Digital Signal Processing', department: 'Computer Science & Engineering' },
  { id: 'course_cse438', code: 'CSE438', title: 'Digital Image Processing', department: 'Computer Science & Engineering' },
  { id: 'course_cse442', code: 'CSE442', title: 'Microprocessors and Microcontrollers', department: 'Computer Science & Engineering' },
  { id: 'course_cse445', code: 'CSE445', title: 'Computer Vision', department: 'Computer Science & Engineering' },
  { id: 'course_cse446', code: 'CSE446', title: 'ASIC Design Using FPGA', department: 'Computer Science & Engineering' },
  { id: 'course_cse452', code: 'CSE452', title: 'Distributed Systems and Algorithms', department: 'Computer Science & Engineering' },
  { id: 'course_cse453', code: 'CSE453', title: 'Wireless Network', department: 'Computer Science & Engineering' },
  { id: 'course_cse457', code: 'CSE457', title: 'Cellular Networks', department: 'Computer Science & Engineering' },
  { id: 'course_cse460', code: 'CSE460', title: 'Cryptography', department: 'Computer Science & Engineering' },
  { id: 'course_cse464', code: 'CSE464', title: 'Advanced Database System', department: 'Computer Science & Engineering' },
  { id: 'course_cse471', code: 'CSE471', title: 'Compiler Design', department: 'Computer Science & Engineering' },
  { id: 'course_cse472', code: 'CSE472', title: 'Advanced Network Services and Management', department: 'Computer Science & Engineering' },
  { id: 'course_cse473', code: 'CSE473', title: 'Network Security and Systems', department: 'Computer Science & Engineering' },
  { id: 'course_cse474', code: 'CSE474', title: 'Pattern Recognition', department: 'Computer Science & Engineering' },
  { id: 'course_cse475', code: 'CSE475', title: 'Machine Learning', department: 'Computer Science & Engineering' },
  { id: 'course_cse477', code: 'CSE477', title: 'Data Mining', department: 'Computer Science & Engineering' },
  { id: 'course_cse479', code: 'CSE479', title: 'Web Programming', department: 'Computer Science & Engineering' },
  { id: 'course_cse481', code: 'CSE481', title: 'Nature-Inspired Computing', department: 'Computer Science & Engineering' },
  { id: 'course_cse483', code: 'CSE483', title: 'Graph Theory', department: 'Computer Science & Engineering' },
  { id: 'course_cse484', code: 'CSE484', title: 'Computational Geometry', department: 'Computer Science & Engineering' },
  { id: 'course_cse486', code: 'CSE486', title: 'Bioinformatics Algorithms', department: 'Computer Science & Engineering' },
  { id: 'course_cse487', code: 'CSE487', title: 'Computer and Cyber Security', department: 'Computer Science & Engineering' },
  { id: 'course_cse488', code: 'CSE488', title: 'Big Data Analytics', department: 'Computer Science & Engineering' },
  { id: 'course_cse489', code: 'CSE489', title: 'Mobile Programming', department: 'Computer Science & Engineering' },
  { id: 'course_cse491', code: 'CSE491', title: 'VLSI Design', department: 'Computer Science & Engineering' },
  { id: 'course_cse492', code: 'CSE492', title: 'Robotics', department: 'Computer Science & Engineering' },
  { id: 'course_cse494', code: 'CSE494', title: 'Embedded Systems', department: 'Computer Science & Engineering' },
  { id: 'course_cse495', code: 'CSE495', title: 'IT Project Management and Entrepreneurship', department: 'Computer Science & Engineering' },

  // Basic Science & Math Courses
  { id: 'course_che109', code: 'CHE109', title: 'Engineering Chemistry-I', department: 'Basic Science' },
  { id: 'course_phy109', code: 'PHY109', title: 'Engineering Physics-I', department: 'Basic Science' },
  { id: 'course_phy209', code: 'PHY209', title: 'Engineering Physics-II', department: 'Basic Science' },
  { id: 'course_mat101', code: 'MAT101', title: 'Differential & Integral Calculus', department: 'Mathematics' },
  { id: 'course_mat102', code: 'MAT102', title: 'Differential Equations & Special Functions', department: 'Mathematics' },
  { id: 'course_mat104', code: 'MAT104', title: 'Co-ordinate Geometry & Vector Analysis', department: 'Mathematics' },
  { id: 'course_mat205', code: 'MAT205', title: 'Linear Algebra & Complex Variables', department: 'Mathematics' },
  { id: 'course_sta102', code: 'STA102', title: 'Statistics and Probability', department: 'Mathematics' },

  // General Education & Business Courses
  { id: 'course_eng101', code: 'ENG101', title: 'Basic English', department: 'General Education' },
  { id: 'course_eng102', code: 'ENG102', title: 'Composition and Communication Skills', department: 'General Education' },
  { id: 'course_gen201', code: 'GEN201', title: 'Bangladesh Studies', department: 'General Education' },
  { id: 'course_gen226', code: 'GEN226', title: 'Emergence of Bangladesh', department: 'General Education' },
  { id: 'course_gen239', code: 'GEN239', title: 'Professional Ethics', department: 'General Education' },
  { id: 'course_act101', code: 'ACT101', title: 'Financial Accounting', department: 'Business Administration' },
  { id: 'course_bus231', code: 'BUS231', title: 'Business Communication', department: 'Business Administration' },
  { id: 'course_bus321', code: 'BUS321', title: 'Business for Engineering and Technology', department: 'Business Administration' },
  { id: 'course_eco101', code: 'ECO101', title: 'Principles of Microeconomics', department: 'Business Administration' },
  { id: 'course_fin101', code: 'FIN101', title: 'Principles of Finance', department: 'Business Administration' },
];

const INITIAL_OFFERINGS: CourseOffering[] = [
  {
    id: 'offering_1',
    courseId: 'course_cse412',
    academicYear: 2025,
    term: Term.SPRING,
    section: '01',
    instructorId: 'user_1',
  },
  {
    id: 'offering_2',
    courseId: 'course_cse412',
    academicYear: 2025,
    term: Term.SPRING,
    section: '02',
    instructorId: 'user_2',
  },
  {
    id: 'offering_3',
    courseId: 'course_cse302',
    academicYear: 2025,
    term: Term.SPRING,
    section: '01',
    instructorId: 'user_1',
  },
  {
    id: 'offering_4',
    courseId: 'course_cse209',
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
  notifications?: AppNotification[];
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
          pending_approval BOOLEAN DEFAULT FALSE,
          password_hash TEXT
        )
      `;

      // Ensure pending_approval and password_hash columns exist if users table was created previously
      await sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_approval BOOLEAN DEFAULT FALSE
      `;
      await sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT
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
          submission_status VARCHAR(30) DEFAULT 'draft',
          submitted_at VARCHAR(100),
          submitter_signature_url TEXT,
          approved_at VARCHAR(100),
          approver_signature_url TEXT,
          CONSTRAINT unique_offering UNIQUE (course_id, academic_year, term, section)
        )
      `;

      // Ensure auditor_id column exists if offerings table was created previously
      await sql`
        ALTER TABLE offerings ADD COLUMN IF NOT EXISTS auditor_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL
      `;
      await sql`ALTER TABLE offerings ADD COLUMN IF NOT EXISTS submission_status VARCHAR(30) DEFAULT 'draft'`;
      await sql`ALTER TABLE offerings ADD COLUMN IF NOT EXISTS submitted_at VARCHAR(100)`;
      await sql`ALTER TABLE offerings ADD COLUMN IF NOT EXISTS submitter_signature_url TEXT`;
      await sql`ALTER TABLE offerings ADD COLUMN IF NOT EXISTS approved_at VARCHAR(100)`;
      await sql`ALTER TABLE offerings ADD COLUMN IF NOT EXISTS approver_signature_url TEXT`;

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

      // Create notifications table
      await sql`
        CREATE TABLE IF NOT EXISTS notifications (
          id VARCHAR(50) PRIMARY KEY,
          user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(200) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          link_offering_id VARCHAR(50),
          is_read BOOLEAN DEFAULT FALSE,
          created_at VARCHAR(100) NOT NULL
        )
      `;

      await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`;

      // Seed / Sync Initial Approved Users
      for (const u of INITIAL_USERS) {
        await sql`
          INSERT INTO users (id, name, email, role, department, avatar_url, pending_approval, password_hash)
          VALUES (${u.id}, ${u.name}, ${u.email}, ${u.role}, ${u.department || 'Department of Computer Science & Engineering'}, ${u.avatarUrl || null}, false, ${u.passwordHash || DEFAULT_SEED_PASSWORD_HASH})
          ON CONFLICT (email) DO UPDATE SET
            role = EXCLUDED.role,
            name = EXCLUDED.name,
            department = EXCLUDED.department,
            pending_approval = false,
            password_hash = COALESCE(users.password_hash, EXCLUDED.password_hash)
        `;
      }

      // Seed / Sync Initial Courses
      for (const c of INITIAL_COURSES) {
        await sql`
          INSERT INTO courses (id, code, title, department)
          VALUES (${c.id}, ${c.code}, ${c.title}, ${c.department})
          ON CONFLICT (code) DO UPDATE SET
            title = EXCLUDED.title,
            department = EXCLUDED.department
        `;
      }

      // Seed / Sync Initial Offerings
      for (const o of INITIAL_OFFERINGS) {
        const targetCourse = INITIAL_COURSES.find(c => c.id === o.courseId);
        if (targetCourse) {
          const courseRows = await sql`SELECT id FROM courses WHERE code = ${targetCourse.code}`;
          const actualCourseId = courseRows.length > 0 ? courseRows[0].id : o.courseId;
          const existingOffering = await sql`
            SELECT id FROM offerings 
            WHERE course_id = ${actualCourseId} AND academic_year = ${o.academicYear} AND term = ${o.term} AND section = ${o.section}
          `;
          if (existingOffering.length === 0) {
            await sql`
              INSERT INTO offerings (id, course_id, academic_year, term, section, instructor_id)
              VALUES (${o.id}, ${actualCourseId}, ${o.academicYear}, ${o.term}, ${o.section}, ${o.instructorId})
              ON CONFLICT (id) DO NOTHING
            `;
          }
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
    const rows = await sql`SELECT id, name, email, role, department, avatar_url as "avatarUrl", pending_approval as "pendingApproval", password_hash as "passwordHash" FROM users`;
    return rows as User[];
  }
  const db = readLocalDB();
  return db.users;
}

export async function dbGetUserByEmail(email: string): Promise<User | null> {
  if (sql) {
    const rows = await sql`
      SELECT id, name, email, role, department, avatar_url as "avatarUrl", pending_approval as "pendingApproval", password_hash as "passwordHash" 
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
      INSERT INTO users (id, name, email, role, department, avatar_url, pending_approval, password_hash)
      VALUES (${user.id}, ${user.name}, ${user.email}, ${user.role}, ${user.department}, ${user.avatarUrl}, ${user.pendingApproval || false}, ${user.passwordHash || null})
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

export async function dbUpdateUserAvatar(userId: string, avatarUrl: string): Promise<User | null> {
  if (sql) {
    const rows = await sql`
      UPDATE users 
      SET avatar_url = ${avatarUrl}
      WHERE id = ${userId}
      RETURNING id, name, email, role, department, avatar_url as "avatarUrl", pending_approval as "pendingApproval"
    `;
    return rows.length > 0 ? (rows[0] as User) : null;
  }
  const db = readLocalDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) return null;
  user.avatarUrl = avatarUrl;
  writeLocalDB(db);
  return user;
}

export async function dbDeleteUser(userId: string): Promise<boolean> {
  if (sql) {
    // Delete notifications for this user
    await sql`DELETE FROM notifications WHERE user_id = ${userId}`;
    // Offerings referencing instructor_id or auditor_id will automatically SET NULL due to foreign key
    const rows = await sql`DELETE FROM users WHERE id = ${userId} RETURNING id`;
    return rows.length > 0;
  }
  const db = readLocalDB();
  const userIdx = db.users.findIndex(u => u.id === userId);
  if (userIdx === -1) return false;
  db.users.splice(userIdx, 1);
  if (db.offerings) {
    db.offerings.forEach(o => {
      if (o.instructorId === userId) {
        o.instructorId = '';
      }
      if (o.auditorId === userId) {
        o.auditorId = null;
      }
    });
  }
  if (db.notifications) {
    db.notifications = db.notifications.filter(n => n.userId !== userId);
  }
  writeLocalDB(db);
  return true;
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
      SELECT 
        id, course_id as "courseId", academic_year as "academicYear", term, section, 
        instructor_id as "instructorId", auditor_id as "auditorId",
        submission_status as "submissionStatus",
        submitted_at as "submittedAt",
        submitter_signature_url as "submitterSignatureUrl",
        approved_at as "approvedAt",
        approver_signature_url as "approverSignatureUrl"
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
      INSERT INTO offerings (
        id, course_id, academic_year, term, section, instructor_id, auditor_id,
        submission_status, submitted_at, submitter_signature_url, approved_at, approver_signature_url
      )
      VALUES (
        ${offering.id}, ${offering.courseId}, ${offering.academicYear}, ${offering.term}, ${offering.section}, ${offering.instructorId}, ${offering.auditorId || null},
        ${offering.submissionStatus || 'draft'}, ${offering.submittedAt || null}, ${offering.submitterSignatureUrl || null}, ${offering.approvedAt || null}, ${offering.approverSignatureUrl || null}
      )
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

export async function dbUpdateOfferingStatus(
  offeringId: string, 
  updates: {
    submissionStatus?: 'draft' | 'submitted' | 'approved' | 'rejected',
    submittedAt?: string,
    submitterSignatureUrl?: string,
    approvedAt?: string,
    approverSignatureUrl?: string
  }
): Promise<CourseOffering | null> {
  if (sql) {
    // Just fetch existing first for simplicity, or do a dynamic update
    const rows = await sql`
      UPDATE offerings 
      SET 
        submission_status = COALESCE(${updates.submissionStatus ?? null}, submission_status),
        submitted_at = COALESCE(${updates.submittedAt ?? null}, submitted_at),
        submitter_signature_url = COALESCE(${updates.submitterSignatureUrl ?? null}, submitter_signature_url),
        approved_at = COALESCE(${updates.approvedAt ?? null}, approved_at),
        approver_signature_url = COALESCE(${updates.approverSignatureUrl ?? null}, approver_signature_url)
      WHERE id = ${offeringId}
      RETURNING 
        id, course_id as "courseId", academic_year as "academicYear", term, section, 
        instructor_id as "instructorId", auditor_id as "auditorId",
        submission_status as "submissionStatus",
        submitted_at as "submittedAt",
        submitter_signature_url as "submitterSignatureUrl",
        approved_at as "approvedAt",
        approver_signature_url as "approverSignatureUrl"
    `;
    return rows.length > 0 ? (rows[0] as CourseOffering) : null;
  }
  const db = readLocalDB();
  const offering = db.offerings.find(o => o.id === offeringId);
  if (!offering) return null;
  
  if (updates.submissionStatus !== undefined) offering.submissionStatus = updates.submissionStatus;
  if (updates.submittedAt !== undefined) offering.submittedAt = updates.submittedAt;
  if (updates.submitterSignatureUrl !== undefined) offering.submitterSignatureUrl = updates.submitterSignatureUrl;
  if (updates.approvedAt !== undefined) offering.approvedAt = updates.approvedAt;
  if (updates.approverSignatureUrl !== undefined) offering.approverSignatureUrl = updates.approverSignatureUrl;
  
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

// NOTIFICATIONS
export async function dbGetNotifications(userId: string): Promise<AppNotification[]> {
  if (sql) {
    const rows = await sql`
      SELECT 
        id, 
        user_id as "userId", 
        title, 
        message, 
        type, 
        link_offering_id as "linkOfferingId", 
        is_read as "isRead", 
        created_at as "createdAt"
      FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return rows as AppNotification[];
  }
  const db = readLocalDB();
  if (!db.notifications) db.notifications = [];
  return db.notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function dbCreateNotification(notif: AppNotification): Promise<AppNotification> {
  if (sql) {
    await sql`
      INSERT INTO notifications (id, user_id, title, message, type, link_offering_id, is_read, created_at)
      VALUES (
        ${notif.id}, 
        ${notif.userId}, 
        ${notif.title}, 
        ${notif.message}, 
        ${notif.type}, 
        ${notif.linkOfferingId || null}, 
        ${notif.isRead || false}, 
        ${notif.createdAt}
      )
    `;
    return notif;
  }
  const db = readLocalDB();
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift(notif);
  writeLocalDB(db);
  return notif;
}

export async function dbMarkNotificationRead(id: string): Promise<boolean> {
  if (sql) {
    const res = await sql`UPDATE notifications SET is_read = TRUE WHERE id = ${id}`;
    return res.count > 0;
  }
  const db = readLocalDB();
  if (!db.notifications) db.notifications = [];
  const notif = db.notifications.find(n => n.id === id);
  if (notif) {
    notif.isRead = true;
    writeLocalDB(db);
    return true;
  }
  return false;
}

export async function dbMarkAllNotificationsRead(userId: string): Promise<boolean> {
  if (sql) {
    await sql`UPDATE notifications SET is_read = TRUE WHERE user_id = ${userId}`;
    return true;
  }
  const db = readLocalDB();
  if (!db.notifications) db.notifications = [];
  db.notifications.forEach(n => {
    if (n.userId === userId) n.isRead = true;
  });
  writeLocalDB(db);
  return true;
}

export async function dbDeleteNotification(id: string): Promise<boolean> {
  if (sql) {
    const res = await sql`DELETE FROM notifications WHERE id = ${id}`;
    return res.count > 0;
  }
  const db = readLocalDB();
  if (!db.notifications) db.notifications = [];
  const idx = db.notifications.findIndex(n => n.id === id);
  if (idx >= 0) {
    db.notifications.splice(idx, 1);
    writeLocalDB(db);
    return true;
  }
  return false;
}
