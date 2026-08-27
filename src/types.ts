/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  INSTRUCTOR = 'instructor',
  DEPT_HEAD = 'dept_head',
  AUDITOR = 'auditor',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
  pendingApproval?: boolean;
}

export interface Course {
  id: string;
  code: string; // e.g. CSE407
  title: string; // e.g. Software Engineering
  department: string;
}

export enum Term {
  SPRING = 'Spring',
  SUMMER = 'Summer',
  FALL = 'Fall',
}

export interface CourseOffering {
  id: string;
  courseId: string;
  academicYear: number; // e.g. 2025
  term: Term;
  section: string; // e.g. "01"
  instructorId: string; // refers to User
  auditorId?: string; // refers to User with role 'auditor'
  submissionStatus?: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  submitterSignatureUrl?: string;
  approvedAt?: string;
  approverSignatureUrl?: string;
}

export type DocumentCategory = string;

export interface CategoryConfig {
  id: string; // value, e.g. 'course_outline'
  label: string; // e.g. 'Course Outline'
  group: string; // e.g. 'Syllabus & Info'
  isCore: boolean; // whether required for completion count
  isActive: boolean; // soft-delete flag
}

export interface CourseFileSlotConfig {
  number: string; // "01", "02", ... "16"
  id: string; // main category id
  label: string; // "Final grades of the students (Tabulation Sheet)"
  filenameExample?: string; // "2025.3.CSE103-00.xlsx" for OBE
  group: string;
  isCore: boolean;
  subSlots?: {
    id: string;
    subNumber: string; // "a", "b", "c"
    label: string; // "Highest answer script"
    group: string;
    isCore: boolean;
  }[];
}

export const OFFICIAL_16_COURSE_FILE_STRUCTURE: CourseFileSlotConfig[] = [
  {
    number: '01',
    id: 'final_grades',
    label: 'Final grades of the students (Tabulation Sheet)',
    group: 'Grades & Results',
    isCore: true,
  },
  {
    number: '02',
    id: 'obe_excel',
    label: 'OBE Excel Sheet (soft copy)',
    filenameExample: '2025.3.CSE103-00.xlsx',
    group: 'OBE & CQI',
    isCore: true,
  },
  {
    number: '03',
    id: 'co_attainment',
    label: 'CO Attainment Report (From OBE Excel)',
    group: 'OBE & CQI',
    isCore: true,
  },
  {
    number: '04',
    id: 'po_attainment',
    label: 'PO Attainment Report (From OBE Excel)',
    group: 'OBE & CQI',
    isCore: true,
  },
  {
    number: '05',
    id: 'grade_summary_cqi',
    label: 'Grade Summary with CQI Improvement Plan (From OBE Excel)',
    group: 'OBE & CQI',
    isCore: true,
  },
  {
    number: '06',
    id: 'instructor_feedback',
    label: 'Instructor Feedback (From OBE Excel)',
    group: 'OBE & CQI',
    isCore: true,
  },
  {
    number: '07',
    id: 'course_outline',
    label: 'Course Outline',
    group: 'Syllabus & Info',
    isCore: true,
  },
  {
    number: '08',
    id: 'class_test_question',
    label: '1) Class Test Assessment Question',
    group: 'Class Tests',
    isCore: true,
    subSlots: [
      { id: 'class_test_sample_highest', subNumber: 'a', label: 'Highest answer script', group: 'Class Tests', isCore: true },
      { id: 'class_test_sample_marginal', subNumber: 'b', label: 'Marginally passed answer script', group: 'Class Tests', isCore: true },
      { id: 'class_test_sample_average', subNumber: 'c', label: 'Average answer script', group: 'Class Tests', isCore: true },
    ]
  },
  {
    number: '09',
    id: 'midterm_question',
    label: '1) Midterm Assessment Question',
    group: 'Midterms',
    isCore: true,
    subSlots: [
      { id: 'midterm_sample_highest', subNumber: 'a', label: 'Highest answer script', group: 'Midterms', isCore: true },
      { id: 'midterm_sample_marginal', subNumber: 'b', label: 'Marginally passed answer script', group: 'Midterms', isCore: true },
      { id: 'midterm_sample_average', subNumber: 'c', label: 'Average answer script', group: 'Midterms', isCore: true },
    ]
  },
  {
    number: '10',
    id: 'final_question',
    label: '1) Final Exam Question',
    group: 'Finals',
    isCore: true,
    subSlots: [
      { id: 'final_sample_highest', subNumber: 'a', label: 'Highest answer script', group: 'Finals', isCore: true },
      { id: 'final_sample_marginal', subNumber: 'b', label: 'Marginally passed answer script', group: 'Finals', isCore: true },
      { id: 'final_sample_average', subNumber: 'c', label: 'Average answer script', group: 'Finals', isCore: true },
    ]
  },
  {
    number: '11',
    id: 'projects_list',
    label: '1) List of projects/assignments with description',
    group: 'Projects & Reports',
    isCore: true,
    subSlots: [
      { id: 'projects_sample_highest', subNumber: 'a', label: 'Highest answer script', group: 'Projects & Reports', isCore: true },
      { id: 'projects_sample_marginal', subNumber: 'b', label: 'Marginally passed answer script', group: 'Projects & Reports', isCore: true },
      { id: 'projects_sample_average', subNumber: 'c', label: 'Average answer script', group: 'Projects & Reports', isCore: true },
    ]
  },
  {
    number: '12',
    id: 'lab_experiments_list',
    label: 'List of lab experiments',
    group: 'Labs & Practical',
    isCore: true,
  },
  {
    number: '13',
    id: 'class_attendance',
    label: 'Class Attendance',
    group: 'Attendance',
    isCore: true,
  },
  {
    number: '14',
    id: 'lab_attendance',
    label: 'Lab Attendance',
    group: 'Attendance',
    isCore: true,
  },
  {
    number: '15',
    id: 'midterm_attendance',
    label: 'Mid Term Exam Attendance',
    group: 'Attendance',
    isCore: true,
  },
  {
    number: '16',
    id: 'final_attendance',
    label: 'Final Exam Attendance',
    group: 'Attendance',
    isCore: true,
  },
];

export const CORE_16_CATEGORIES: DocumentCategory[] = [
  'final_grades',
  'obe_excel',
  'co_attainment',
  'po_attainment',
  'grade_summary_cqi',
  'instructor_feedback',
  'course_outline',
  'class_test_question',
  'class_test_sample_highest',
  'class_test_sample_marginal',
  'class_test_sample_average',
  'midterm_question',
  'midterm_sample_highest',
  'midterm_sample_marginal',
  'midterm_sample_average',
  'final_question',
  'final_sample_highest',
  'final_sample_marginal',
  'final_sample_average',
  'projects_list',
  'projects_sample_highest',
  'projects_sample_marginal',
  'projects_sample_average',
  'lab_experiments_list',
  'class_attendance',
  'lab_attendance',
  'midterm_attendance',
  'final_attendance'
];

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string; group: string; number?: string }[] = [
  { value: 'final_grades', label: 'Final grades of the students (Tabulation Sheet)', group: 'Grades & Results', number: '01' },
  { value: 'obe_excel', label: 'OBE Excel Sheet (soft copy)', group: 'OBE & CQI', number: '02' },
  { value: 'co_attainment', label: 'CO Attainment Report (From OBE Excel)', group: 'OBE & CQI', number: '03' },
  { value: 'po_attainment', label: 'PO Attainment Report (From OBE Excel)', group: 'OBE & CQI', number: '04' },
  { value: 'grade_summary_cqi', label: 'Grade Summary with CQI Improvement Plan (From OBE Excel)', group: 'OBE & CQI', number: '05' },
  { value: 'instructor_feedback', label: 'Instructor Feedback (From OBE Excel)', group: 'OBE & CQI', number: '06' },
  { value: 'course_outline', label: 'Course Outline', group: 'Syllabus & Info', number: '07' },
  { value: 'class_test_question', label: '1) Class Test Assessment Question', group: 'Class Tests', number: '08' },
  { value: 'class_test_sample_highest', label: 'a) Highest answer script', group: 'Class Tests', number: '08.2.a' },
  { value: 'class_test_sample_marginal', label: 'b) Marginally passed answer script', group: 'Class Tests', number: '08.2.b' },
  { value: 'class_test_sample_average', label: 'c) Average answer script', group: 'Class Tests', number: '08.2.c' },
  { value: 'midterm_question', label: '1) Midterm Assessment Question', group: 'Midterms', number: '09' },
  { value: 'midterm_sample_highest', label: 'a) Highest answer script', group: 'Midterms', number: '09.2.a' },
  { value: 'midterm_sample_marginal', label: 'b) Marginally passed answer script', group: 'Midterms', number: '09.2.b' },
  { value: 'midterm_sample_average', label: 'c) Average answer script', group: 'Midterms', number: '09.2.c' },
  { value: 'final_question', label: '1) Final Exam Question', group: 'Finals', number: '10' },
  { value: 'final_sample_highest', label: 'a) Highest answer script', group: 'Finals', number: '10.2.a' },
  { value: 'final_sample_marginal', label: 'b) Marginally passed answer script', group: 'Finals', number: '10.2.b' },
  { value: 'final_sample_average', label: 'c) Average answer script', group: 'Finals', number: '10.2.c' },
  { value: 'projects_list', label: '1) List of projects/assignments with description', group: 'Projects & Reports', number: '11' },
  { value: 'projects_sample_highest', label: 'a) Highest answer script', group: 'Projects & Reports', number: '11.2.a' },
  { value: 'projects_sample_marginal', label: 'b) Marginally passed answer script', group: 'Projects & Reports', number: '11.2.b' },
  { value: 'projects_sample_average', label: 'c) Average answer script', group: 'Projects & Reports', number: '11.2.c' },
  { value: 'lab_experiments_list', label: 'List of lab experiments', group: 'Labs & Practical', number: '12' },
  { value: 'class_attendance', label: 'Class Attendance', group: 'Attendance', number: '13' },
  { value: 'lab_attendance', label: 'Lab Attendance', group: 'Attendance', number: '14' },
  { value: 'midterm_attendance', label: 'Mid Term Exam Attendance', group: 'Attendance', number: '15' },
  { value: 'final_attendance', label: 'Final Exam Attendance', group: 'Attendance', number: '16' },
];

export interface Document {
  id: string;
  offeringId: string;
  category: DocumentCategory;
  version: number;
  isCurrent: boolean;
  fileName: string; // generated, e.g. CSE407_2025_Spring_final_grades_v1.pdf
  fileHash?: string;
  uploadedBy: string; // user email
  uploadedAt: string; // ISO string
  storagePath: string; // theoretical path
  status: 'pending_review' | 'approved' | 'rejected';
  feedback?: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string; // e.g. "CREATE_DOCUMENT", "APPROVE_DOCUMENT", "REJECT_DOCUMENT"
  actorId: string; // refers to User
  actorName: string;
  actorEmail: string;
  targetDocumentId?: string;
  targetDocumentName?: string;
  timestamp: string; // ISO string
  details: string; // short description
  entryHash?: string;
  previousEntryHash?: string;
}

export interface BulkQueueItem {
  id: string;
  file: File;
  fileName: string;
  fileSizeFormatted: string;
  offeringId: string;
  detectedCategory: DocumentCategory;
  selectedCategory: DocumentCategory;
  confidence: 'high' | 'medium' | 'low';
  matchedPattern: string;
  status: 'queued' | 'validating' | 'uploading' | 'completed' | 'error';
  progress: number;
  errorMessage?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'action_required';
  linkOfferingId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Core8CourseInfo {
  code: string;
  title: string;
  level: string;
  pillar: string;
  focus: string;
}

export const CORE_8_CSE_COURSE_CODES = [
  'CSE103', // Structured Programming
  'CSE110', // Object Oriented Programming
  'CSE207', // Data Structures
  'CSE246', // Algorithms
  'CSE302', // Database Systems
  'CSE301', // Database Management Systems
  'CSE325', // Operating Systems
  'CSE360', // Computer Architecture
  'CSE412', // Software Engineering
  'CSE407', // Software Engineering
  'CSE405', // Computer Networks
  'CSE350', // Data Communications
] as const;

export const CORE_8_CSE_BENCHMARKS: Core8CourseInfo[] = [
  { code: 'CSE103', title: 'Structured Programming', level: '100-Level', pillar: 'Programming Foundations', focus: 'Syntax, Problem Solving, Flow Control (PO1, PO2)' },
  { code: 'CSE110', title: 'Object Oriented Programming', level: '100-Level', pillar: 'Object-Oriented Design', focus: 'Classes, Polymorphism, Inheritance (PO2, PO3)' },
  { code: 'CSE207', title: 'Data Structures', level: '200-Level', pillar: 'Structural Data & Memory', focus: 'Lists, Trees, Graphs, Memory Complexity (PO2, PO3)' },
  { code: 'CSE246', title: 'Algorithms', level: '200-Level', pillar: 'Algorithmic Efficiency', focus: 'DP, Greedy, Graph Algorithms, Asymptotics (PO2, PO3)' },
  { code: 'CSE302', title: 'Database Systems', level: '300-Level', pillar: 'Data & Transaction Models', focus: 'Relational Design, SQL, Normalization, ACID (PO3, PO5)' },
  { code: 'CSE325', title: 'Operating Systems', level: '300-Level', pillar: 'Systems & Concurrency', focus: 'Process Scheduling, Synchronization, Memory Paging (PO3, PO4)' },
  { code: 'CSE360', title: 'Computer Architecture', level: '300-Level', pillar: 'Hardware Architecture', focus: 'ALU, Pipelining, Instruction Sets, Cache (PO1, PO3)' },
  { code: 'CSE412', title: 'Software Engineering', level: '400-Level', pillar: 'Software Design & Lifecycle', focus: 'SDLC, Agile, Architecture, Quality Assurance (PO3, PO8, PO9)' },
];
