/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  BookOpen, 
  Layers, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User, 
  Shield, 
  LogOut, 
  Clock, 
  Search, 
  Plus, 
  Filter, 
  SlidersHorizontal,
  Database, 
  Lock, 
  RefreshCw, 
  FileUp, 
  FileCheck, 
  Eye, 
  Settings, 
  History, 
  ChevronRight,
  ChevronLeft,
  Calendar,
  Info,
  Check,
  UserCheck, Trash2,
  Activity,
  Copy,
  Download,
  X,
  Moon, Sun , ChevronDown,
  Grid,
  List,
  LayoutGrid,
  RotateCcw,
  FileSpreadsheet,
  Sparkles,
  FolderTree,
  UploadCloud,
  Zap,
  Mail,
  Send,
  ListChecks,
  FileWarning,
  ExternalLink,
  Maximize2,
  Minimize2,
  HelpCircle,
  Bell,
  Printer,
  Star,
  Award,
  EyeOff,
  UserPlus,
  KeyRound,
  LogIn,
  ArrowRight
} from 'lucide-react';
import { Pagination } from './components/Pagination';

import { 
  User as UserType, 
  UserRole, 
  Course, 
  CourseOffering, 
  Document as DocumentType, 
  AuditLogEntry, 
  Term, 
  DocumentCategory,
  CategoryConfig,
  DOCUMENT_CATEGORIES,
  CORE_16_CATEGORIES,
  OFFICIAL_16_COURSE_FILE_STRUCTURE,
  CourseFileSlotConfig,
  BulkQueueItem,
  AppNotification,
  CORE_8_CSE_COURSE_CODES,
  CORE_8_CSE_BENCHMARKS
} from './types';

import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';
import SignatureCanvas from 'react-signature-canvas';
const isGoogleAuthConfigured = true;


function useDarkMode() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme-preference') as 'light' | 'dark' | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme-preference', newTheme);
  };

  return { theme, toggleTheme };
}


const getUserFriendlyErrorMessage = (errorMsg: string) => {
  if (!errorMsg) return 'An unexpected error occurred. Please try again.';
  const msg = errorMsg.toLowerCase();
  if (msg.includes('unauthorized') || msg.includes('forbidden') || msg.includes('admin') || msg.includes('instructor')) {
    if (msg.includes('upload') || msg.includes('submit')) {
       return "You don't have permission to upload files for this course. Contact your department head if this is wrong.";
    }
    if (msg.includes('review') || msg.includes('verify')) {
       return "Only Department Heads or Administrators can approve or reject these files.";
    }
    return "You don't have permission to perform this action. Contact your department head if you need access.";
  }
  if (msg.includes('not found')) {
    return "The requested information could not be found. It may have been deleted or moved.";
  }
  if (msg.includes('already exists')) {
    return "This record already exists in the system.";
  }
  if (msg.includes('network error') || msg.includes('fetch')) {
    return "Could not connect to the server. Please check your internet connection and try again.";
  }
  return errorMsg; 
};

const HelpTooltip = ({ text }: { text: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative inline-flex items-center ml-1.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        onBlur={() => setIsOpen(false)}
        aria-label={`Help information: ${text}`}
        className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center text-xs font-bold transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand"
      >
        ?
      </button>
      {isOpen && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl z-50 normal-case font-sans border border-slate-700 pointer-events-auto"
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  // Mobile Menu State
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Global keyboard listener for modal dismissal & accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSignatureModal(false);
        setShowBulkUploadModal(false);
        setShowRoleManualModal(false);
        setShowCore8HubModal(false);
        setShowPrintManifestModal(false);
        setShowAddCourse(false);
        setShowAddOffering(false);
        setShowAddUser(false);
        setShowUploadDoc(false);
        setShowReviewDoc(null);
        setPreviewDoc(null);
        setHistoryModalCategory(null);
        setHistoryModalOfferingId(null);
        setShowNotificationDrawer(false);
        setShowMobileMenu(false);
        setReminderModalData(null);
        setShowAddCatModal(false);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerDept, setRegisterDept] = useState('Department of Computer Science & Engineering');
  const [registerRole, setRegisterRole] = useState<UserRole>(UserRole.INSTRUCTOR);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Domain Catalog State
  const [courses, setCourses] = useState<Course[]>([]);
  const [offerings, setOfferings] = useState<(CourseOffering & { course?: Course; instructor?: UserType })[]>([]);
  const [documents, setDocuments] = useState<(DocumentType & { course?: Course; offering?: CourseOffering; instructor?: UserType; uploader?: UserType })[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [usersList, setUsersList] = useState<UserType[]>([]);
  
  // Dynamic Category Slots & Trash State
  const [categoriesList, setCategoriesList] = useState<CategoryConfig[]>(() => 
    DOCUMENT_CATEGORIES.map(c => ({
      id: c.value,
      label: c.label,
      group: c.group,
      isCore: CORE_16_CATEGORIES.includes(c.value),
      isActive: true
    }))
  );

  // Dynamic Category Metadata & Label Helper
  const getCategoryMeta = (catId: string) => {
    const foundInList = categoriesList.find(c => c.id === catId);
    if (foundInList) return foundInList;
    const foundInPreset = DOCUMENT_CATEGORIES.find(c => c.value === catId);
    if (foundInPreset) {
      return {
        id: foundInPreset.value,
        label: foundInPreset.label,
        group: foundInPreset.group,
        isCore: CORE_16_CATEGORIES.includes(foundInPreset.value),
        isActive: true,
      };
    }
    const humanized = catId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return {
      id: catId,
      label: humanized,
      group: 'Other Requirements',
      isCore: false,
      isActive: true,
    };
  };

  const getCategoryLabel = (catId: string): string => {
    return getCategoryMeta(catId).label;
  };

  const [trashDocuments, setTrashDocuments] = useState<DocumentType[]>([]);
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatGroup, setNewCatGroup] = useState('Syllabus & Info');
  const [newCatIsCore, setNewCatIsCore] = useState(true);
  const [catDeletingId, setCatDeletingId] = useState<string | null>(null);

  // Data loading states
  const [isDataLoading, setIsDataLoading] = useState(false);

  // App Navigation State
  const [activeTab, setActiveTab] = useState<'courses' | 'desk' | 'review' | 'archive' | 'ledger' | 'users' | 'categories' | 'trash'>('courses');
  const { theme, toggleTheme } = useDarkMode();
  
  // Selected detail view
  const [selectedOffering, setSelectedOffering] = useState<(CourseOffering & { course?: Course; instructor?: UserType }) | null>(null);
  const [isExportingId, setIsExportingId] = useState<string | null>(null);

  // Signature Modal State
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureAction, setSignatureAction] = useState<'submit' | 'approve' | null>(null);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload' | 'type'>('draw');
  const [uploadedSignatureUrl, setUploadedSignatureUrl] = useState<string | null>(null);
  const [typedSignatureName, setTypedSignatureName] = useState('');
  const [typedSignatureFont, setTypedSignatureFont] = useState<number>(0);
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);
  const [isPopulatingSamples, setIsPopulatingSamples] = useState(false);

  // Notification Center State
  const [notificationsList, setNotificationsList] = useState<AppNotification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);

  // Selective Batch Download & Print State
  const [selectedDocIdsForBatch, setSelectedDocIdsForBatch] = useState<Set<string>>(new Set());
  const [isExportingSelective, setIsExportingSelective] = useState(false);
  const [showPrintManifestModal, setShowPrintManifestModal] = useState(false);

  // Core 8 CSE Accreditation Benchmark Filter & Hub State
  const [onlyCore8Filter, setOnlyCore8Filter] = useState(false);
  const [showCore8HubModal, setShowCore8HubModal] = useState(false);

  // Compliance & Faculty Missing Review Filter State
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewYearFilter, setReviewYearFilter] = useState<string>('');
  const [reviewTermFilter, setReviewTermFilter] = useState<string>('');
  const [reviewDeptFilter, setReviewDeptFilter] = useState<string>('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'all' | 'missing' | 'complete'>('all');
  const [expandedMissingOfferingId, setExpandedMissingOfferingId] = useState<string | null>(null);

  // Faculty Reminder Modal State
  const [reminderModalData, setReminderModalData] = useState<{
    isOpen: boolean;
    offering: (CourseOffering & { course?: Course; instructor?: UserType }) | null;
    instructor: UserType | null;
    missingCategories: DocumentCategory[];
    deadline: string;
    subject: string;
    body: string;
    recipient: string;
    copied: boolean;
    isSendingLog: boolean;
  } | null>(null);

  // Core navigation state for academic directory flow
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);

  // Filtering State for Archive / Document Catalog
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveCourseFilter, setArchiveCourseFilter] = useState('');
  const [archiveCategoryFilter, setArchiveCategoryFilter] = useState('');
  const [archiveStatusFilter, setArchiveStatusFilter] = useState('');
  const [archiveYearFilter, setArchiveYearFilter] = useState<string>('');
  const [archiveTermFilter, setArchiveTermFilter] = useState<string>('');
  const [archiveDeptFilter, setArchiveDeptFilter] = useState<string>('');
  const [archiveViewLayout, setArchiveViewLayout] = useState<'table' | 'cards' | 'grouped_course' | 'grouped_category'>('table');
  const [archivePage, setArchivePage] = useState<number>(1);
  const [archivePageSize, setArchivePageSize] = useState<number>(24);

  // System Audit Log (Ledger) Server-Side Pagination & Filtering State
  const [ledgerLogs, setLedgerLogs] = useState<AuditLogEntry[]>([]);
  const [ledgerTotal, setLedgerTotal] = useState<number>(0);
  const [ledgerPage, setLedgerPage] = useState<number>(1);
  const [ledgerLimit, setLedgerLimit] = useState<number>(25);
  const [ledgerTotalPages, setLedgerTotalPages] = useState<number>(1);
  const [ledgerSearch, setLedgerSearch] = useState<string>('');
  const [ledgerAction, setLedgerAction] = useState<string>('');
  const [ledgerDateRange, setLedgerDateRange] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [ledgerLayout, setLedgerLayout] = useState<'table' | 'cards'>('table');
  const [ledgerLoading, setLedgerLoading] = useState<boolean>(false);

  // User Management Pagination & Filtering State
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [userPage, setUserPage] = useState<number>(1);
  const [userPageSize, setUserPageSize] = useState<number>(12);

  // Trash Hub Pagination & Filtering State
  const [trashSearch, setTrashSearch] = useState<string>('');
  const [trashPage, setTrashPage] = useState<number>(1);
  const [trashPageSize, setTrashPageSize] = useState<number>(15);

  // Course Offerings (Directory) Pagination State
  const [offeringsPage, setOfferingsPage] = useState<number>(1);
  const [offeringsPageSize, setOfferingsPageSize] = useState<number>(12);

  // Global Filtering State for Course Offerings list (dept_head and admin)
  const [browseMode, setBrowseMode] = useState<'global' | 'structured'>('structured');
  const [globalCourseCode, setGlobalCourseCode] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [globalSession, setGlobalSession] = useState('');
  const [globalInstructor, setGlobalInstructor] = useState('');
  const [globalCategory, setGlobalCategory] = useState('');
  const [globalCategoryStatus, setGlobalCategoryStatus] = useState<'all' | 'missing' | 'present'>('all');

  // Portfolio-specific inner search/filters
  const [portfolioCategorySearch, setPortfolioCategorySearch] = useState('');
  const [portfolioStatusFilter, setPortfolioStatusFilter] = useState<'all' | 'uploaded' | 'missing' | 'approved' | 'pending' | 'rejected'>('all');
  const [portfolioViewColumns, setPortfolioViewColumns] = useState<'1-col' | '2-col'>('2-col');
  const [expandedSubSlots, setExpandedSubSlots] = useState<Record<string, boolean>>({ '08': false, '09': false, '10': false, '11': false });
  const [showRoleManualModal, setShowRoleManualModal] = useState(false);
  const [manualSelectedRole, setManualSelectedRole] = useState<UserRole>(UserRole.INSTRUCTOR);

  const toggleSlotExpansion = (slotNumber: string) => {
    setExpandedSubSlots(prev => ({ ...prev, [slotNumber]: !prev[slotNumber] }));
  };

  const openRoleManual = (role?: UserRole) => {
    setManualSelectedRole(role || currentUser?.role || UserRole.INSTRUCTOR);
    setShowRoleManualModal(true);
  };
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddOffering, setShowAddOffering] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [showReviewDoc, setShowReviewDoc] = useState<DocumentType | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentType | null>(null);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [historyModalCategory, setHistoryModalCategory] = useState<DocumentCategory | null>(null);
  const [historyModalOfferingId, setHistoryModalOfferingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; confirmLabel: string; onConfirm: () => void; isDestructive: boolean }>({
    isOpen: false, title: '', message: '', confirmLabel: '', onConfirm: () => {}, isDestructive: false
  });
  
  const requestConfirmation = (title: string, message: string, confirmLabel: string, onConfirm: () => void, isDestructive = false) => {
    setConfirmDialog({ isOpen: true, title, message, confirmLabel, onConfirm, isDestructive });
  };

  // Form Field States
  // Course Form
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDept, setNewCourseDept] = useState('');
  const [courseFormError, setCourseFormError] = useState('');

  // Offering Form
  const [newOffCourseId, setNewOffCourseId] = useState('');
  const [newOffYear, setNewOffYear] = useState(new Date().getFullYear());
  const [newOffTerm, setNewOffTerm] = useState<Term>(Term.SPRING);
  const [newOffSection, setNewOffSection] = useState('01');
  const [newOffInstructorId, setNewOffInstructorId] = useState('');
  const [offeringFormError, setOfferingFormError] = useState('');

  // User Form
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.INSTRUCTOR);
  const [newUserDept, setNewUserDept] = useState('');
  const [userFormError, setUserFormError] = useState('');

  // Upload Form
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('course_outline');
  const [uploadText, setUploadText] = useState('');
  const [uploadFormError, setUploadFormError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Bulk Upload Feature State & Handlers
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkQueue, setBulkQueue] = useState<BulkQueueItem[]>([]);
  const [globalBulkOfferingId, setGlobalBulkOfferingId] = useState<string>('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkOverallProgress, setBulkOverallProgress] = useState(0);
  const [bulkDragActive, setBulkDragActive] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const autoDetectCategoryFromFilename = (filename: string): { category: DocumentCategory; confidence: 'high' | 'medium' | 'low'; matchedPattern: string } => {
    const cleanName = filename.toLowerCase().replace(/[-_.\s]+/g, '_');

    // 1. Dynamic category value & label match
    for (const cat of categoriesList) {
      if (cat.isActive !== false) {
        if (cleanName.includes(cat.id.toLowerCase()) || cleanName.includes(cat.label.toLowerCase().replace(/\s+/g, '_'))) {
          return {
            category: cat.id,
            confidence: 'high',
            matchedPattern: `Requirement slot "${cat.label}"`
          };
        }
      }
    }

    for (const cat of DOCUMENT_CATEGORIES) {
      if (cleanName.includes(cat.value.toLowerCase())) {
        return {
          category: cat.value,
          confidence: 'high',
          matchedPattern: `Category code "${cat.value}"`
        };
      }
    }

    // 2. Specific pattern matchers (ordered by domain specificity)
    const rules: { keywords: string[]; category: DocumentCategory; label: string }[] = [
      { keywords: ['syllabus', 'course_outline', 'outline', 'course_plan', 'course_policy', 'handout', 'curriculum'], category: 'course_outline', label: 'Syllabus / Course Outline' },
      
      // Attendance
      { keywords: ['midterm_att', 'mid_att', 'midterm_attendance'], category: 'midterm_attendance', label: 'Midterm Attendance' },
      { keywords: ['final_att', 'final_attendance'], category: 'final_attendance', label: 'Final Attendance' },
      { keywords: ['lab_att', 'lab_attendance'], category: 'lab_attendance', label: 'Lab Attendance' },
      { keywords: ['attendance', 'att_log', 'class_att', 'attendance_sheet'], category: 'class_attendance', label: 'Class Attendance Log' },

      // Class Tests / Quizzes
      { keywords: ['ct_high', 'ct_max', 'quiz_high', 'test_high', 'ct1_high', 'ct2_high', 'ct_sample_high'], category: 'class_test_sample_highest', label: 'Class Test Sample (Highest)' },
      { keywords: ['ct_avg', 'quiz_avg', 'test_avg', 'ct1_avg', 'ct2_avg', 'ct_sample_avg'], category: 'class_test_sample_average', label: 'Class Test Sample (Average)' },
      { keywords: ['ct_marg', 'ct_min', 'quiz_min', 'quiz_marg', 'ct1_marg', 'ct2_marg', 'ct_sample_marg'], category: 'class_test_sample_marginal', label: 'Class Test Sample (Marginal)' },
      { keywords: ['ct_q', 'ct1_q', 'ct2_q', 'quiz_q', 'classtest', 'class_test', 'quiz1', 'quiz2', 'quiz3', 'quiz_1', 'quiz_2', 'ct1', 'ct2', 'ct3', 'test1', 'test2', 'quiz'], category: 'class_test_question', label: 'Class Test Question' },

      // Midterm
      { keywords: ['mid_high', 'midterm_high', 'mid_max', 'midterm_sample_high', 'mid_highest'], category: 'midterm_sample_highest', label: 'Midterm Sample (Highest)' },
      { keywords: ['mid_avg', 'midterm_avg', 'mid_sample_avg', 'mid_average'], category: 'midterm_sample_average', label: 'Midterm Sample (Average)' },
      { keywords: ['mid_marg', 'mid_min', 'midterm_marg', 'midterm_min', 'mid_marginal'], category: 'midterm_sample_marginal', label: 'Midterm Sample (Marginal)' },
      { keywords: ['midterm', 'mid_q', 'mid_exam', 'mid_paper', 'mid_question', 'midterm_paper'], category: 'midterm_question', label: 'Midterm Question Paper' },

      // Final
      { keywords: ['final_high', 'final_max', 'final_sample_high', 'final_highest'], category: 'final_sample_highest', label: 'Final Exam Sample (Highest)' },
      { keywords: ['final_avg', 'final_sample_avg', 'final_average'], category: 'final_sample_average', label: 'Final Exam Sample (Average)' },
      { keywords: ['final_marg', 'final_min', 'final_sample_marg', 'final_marginal'], category: 'final_sample_marginal', label: 'Final Exam Sample (Marginal)' },
      { keywords: ['final_exam', 'final_q', 'final_paper', 'final_question', 'term_final', 'final_term'], category: 'final_question', label: 'Final Exam Question Paper' },

      // Labs & Projects
      { keywords: ['lab_exp', 'lab_manual', 'lab_list', 'lab_sheet', 'experiments', 'experiment_list'], category: 'lab_experiments_list', label: 'Lab Experiments List' },
      { keywords: ['project_high', 'capstone_high', 'projects_high'], category: 'projects_sample_highest', label: 'Project Sample (Highest)' },
      { keywords: ['project_avg', 'capstone_avg', 'projects_avg'], category: 'projects_sample_average', label: 'Project Sample (Average)' },
      { keywords: ['project_marg', 'capstone_marg', 'projects_marg'], category: 'projects_sample_marginal', label: 'Project Sample (Marginal)' },
      { keywords: ['project', 'capstone', 'project_list', 'projects_list'], category: 'projects_list', label: 'Projects List' },

      // Attainment & CQI
      { keywords: ['cqi', 'cqi_report', 'improvement_plan', 'grade_summary'], category: 'grade_summary_cqi', label: 'Grade Summary & CQI Report' },
      { keywords: ['po_attain', 'po_report', 'po_attainment'], category: 'po_attainment', label: 'PO Attainment Report' },
      { keywords: ['co_attain', 'co_report', 'co_attainment', 'co_mapping', 'co_po'], category: 'co_attainment', label: 'CO Attainment Report' },
      { keywords: ['obe', 'obe_sheet', 'assessment_sheet', 'obe_calc', 'excel'], category: 'obe_excel', label: 'OBE Assessment Sheet' },
      { keywords: ['grade', 'grades', 'grade_sheet', 'marksheet', 'result', 'grade_list'], category: 'final_grades', label: 'Final Grade Sheet' },
      { keywords: ['feedback', 'instructor_feedback', 'teaching_feedback', 'course_review'], category: 'instructor_feedback', label: 'Instructor Feedback Form' },
    ];

    for (const rule of rules) {
      if (rule.keywords.some(kw => cleanName.includes(kw))) {
        return {
          category: rule.category,
          confidence: 'high',
          matchedPattern: `Pattern matched "${rule.label}"`
        };
      }
    }

    // Extension check
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      return {
        category: 'obe_excel',
        confidence: 'medium',
        matchedPattern: 'Spreadsheet extension (.xlsx) matched OBE Sheet'
      };
    }

    return {
      category: 'course_outline',
      confidence: 'low',
      matchedPattern: 'Default fallback category'
    };
  };

  const autoDetectOfferingFromFilename = (filename: string): string => {
    if (selectedOffering) return selectedOffering.id;
    if (globalBulkOfferingId) return globalBulkOfferingId;

    const upperName = filename.toUpperCase().replace(/[-_.\s]+/g, '');
    for (const offering of offerings) {
      const course = offering.course || courses.find(c => c.id === offering.courseId);
      if (course && course.code) {
        const codeClean = course.code.toUpperCase().replace(/[-_.\s]+/g, '');
        if (upperName.includes(codeClean)) {
          return offering.id;
        }
      }
    }

    return offerings[0]?.id || '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const addFilesToBulkQueue = (fileList: FileList | File[]) => {
    const newItems: BulkQueueItem[] = [];
    const targetOff = globalBulkOfferingId || selectedOffering?.id || (offerings[0]?.id || '');

    Array.from(fileList).forEach((file, index) => {
      const detection = autoDetectCategoryFromFilename(file.name);
      const matchedOfferingId = autoDetectOfferingFromFilename(file.name) || targetOff;

      newItems.push({
        id: `queue_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
        file,
        fileName: file.name,
        fileSizeFormatted: formatFileSize(file.size),
        offeringId: matchedOfferingId,
        detectedCategory: detection.category,
        selectedCategory: detection.category,
        confidence: detection.confidence,
        matchedPattern: detection.matchedPattern,
        status: 'queued',
        progress: 0,
      });
    });

    setBulkQueue(prev => [...prev, ...newItems]);
  };

  const addMockSampleBatchToQueue = () => {
    const targetOff = selectedOffering?.id || globalBulkOfferingId || (offerings[0]?.id || '');
    const courseCode = offerings.find(o => o.id === targetOff)?.course?.code || 'CSE101';

    const mockFiles = [
      { name: `${courseCode}_Course_Syllabus_Spring2025.pdf`, content: 'Sample Course Outline Content PDF', type: 'application/pdf' },
      { name: `${courseCode}_Midterm_Exam_QuestionPaper.pdf`, content: 'Sample Midterm Question Paper PDF', type: 'application/pdf' },
      { name: `${courseCode}_Class_Test1_Highest_Marks.pdf`, content: 'Sample Class Test Sample PDF', type: 'application/pdf' },
      { name: `${courseCode}_OBE_Attainment_Assessment.xlsx`, content: 'Sample OBE Assessment Excel Sheet', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { name: `${courseCode}_CQI_Improvement_Report.pdf`, content: 'Sample CQI Report PDF', type: 'application/pdf' },
    ];

    const newItems: BulkQueueItem[] = mockFiles.map((m, idx) => {
      const blob = new Blob([m.content], { type: m.type });
      const file = new File([blob], m.name, { type: m.type });
      const detection = autoDetectCategoryFromFilename(file.name);
      const matchedOfferingId = autoDetectOfferingFromFilename(file.name) || targetOff;

      return {
        id: `mock_queue_${Date.now()}_${idx}`,
        file,
        fileName: file.name,
        fileSizeFormatted: formatFileSize(file.size),
        offeringId: matchedOfferingId,
        detectedCategory: detection.category,
        selectedCategory: detection.category,
        confidence: detection.confidence,
        matchedPattern: detection.matchedPattern,
        status: 'queued',
        progress: 0,
      };
    });

    setBulkQueue(prev => [...prev, ...newItems]);
    showNotification(`Loaded 5 sample course files into queue!`, 'info');
  };

  const processBulkQueue = async () => {
    const pendingItems = bulkQueue.filter(item => item.status === 'queued' || item.status === 'error');
    if (pendingItems.length === 0) {
      showNotification('No pending items in queue to process', 'info');
      return;
    }

    setIsBulkProcessing(true);
    setBulkOverallProgress(0);

    let successCount = 0;
    let failCount = 0;
    const total = pendingItems.length;

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      
      // Validate file type before sending
      const validation = validateFileType(item.selectedCategory, item.file);
      if (!validation.isValid) {
        setBulkQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error', errorMessage: validation.error } : q));
        failCount++;
        setBulkOverallProgress(Math.round(((i + 1) / total) * 100));
        continue;
      }

      // Set item status to uploading
      setBulkQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading', progress: 30 } : q));

      try {
        const formData = new FormData();
        formData.append('offeringId', item.offeringId);
        formData.append('category', item.selectedCategory);
        formData.append('file', item.file);

        setBulkQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 65 } : q));

        const res = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Server upload failed');
        }

        setBulkQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'completed', progress: 100 } : q));
        successCount++;
      } catch (err: any) {
        console.error(`[Bulk Queue Upload Error - ${item.fileName}]`, err);
        setBulkQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error', progress: 0, errorMessage: err.message || 'Upload failed' } : q));
        failCount++;
      }

      setBulkOverallProgress(Math.round(((i + 1) / total) * 100));
    }

    setIsBulkProcessing(false);

    // Refresh server data
    await fetchAllData();

    if (successCount > 0) {
      showNotification(`Bulk processing finished: ${successCount} file(s) compiled & locked successfully!${failCount > 0 ? ` (${failCount} failed)` : ''}`, successCount === total ? 'success' : 'info');
    } else if (failCount > 0) {
      showNotification(`Bulk processing encountered errors on ${failCount} file(s). Please check error messages in queue.`, 'error');
    }
  };

  const removeFromBulkQueue = (id: string) => {
    setBulkQueue(prev => prev.filter(item => item.id !== id));
  };

  const clearCompletedBulkQueue = () => {
    setBulkQueue(prev => prev.filter(item => item.status !== 'completed'));
  };

  const clearAllBulkQueue = () => {
    setBulkQueue([]);
  };

  const updateBulkQueueItemCategory = (id: string, category: DocumentCategory) => {
    setBulkQueue(prev => prev.map(q => q.id === id ? { ...q, selectedCategory: category, errorMessage: undefined, status: q.status === 'error' ? 'queued' : q.status } : q));
  };

  const updateBulkQueueItemOffering = (id: string, offeringId: string) => {
    setBulkQueue(prev => prev.map(q => q.id === id ? { ...q, offeringId, errorMessage: undefined, status: q.status === 'error' ? 'queued' : q.status } : q));
  };

  const applyGlobalOfferingToAllQueueItems = (offeringId: string) => {
    setGlobalBulkOfferingId(offeringId);
    setBulkQueue(prev => prev.map(q => ({ ...q, offeringId })));
  };

  // Local simulated documents for session preservation
  const [localDocuments, setLocalDocuments] = useState<any[]>([]);
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({});
  const slotFileInputRef = useRef<HTMLInputElement>(null);

  // Load simulated documents from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('local_simulated_documents');
    if (saved) {
      try {
        setLocalDocuments(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse local simulated documents:', e);
      }
    }
  }, []);

  // Helpers for category details, file-type validation and auto-generated filename pattern matching
  const getCategoryDetails = (category: DocumentCategory) => {
    switch (category) {
      case 'course_outline':
        return { docTypeLabel: 'CourseOutline' };
      case 'class_attendance':
        return { docTypeLabel: 'Attendance', variant: 'Class' };
      case 'midterm_attendance':
        return { docTypeLabel: 'Attendance', variant: 'Midterm' };
      case 'final_attendance':
        return { docTypeLabel: 'Attendance', variant: 'Final' };
      case 'class_test_question':
        return { docTypeLabel: 'ClassTest', variant: 'Question' };
      case 'class_test_sample_highest':
        return { docTypeLabel: 'ClassTest', variant: 'SampleHighest' };
      case 'midterm_question':
        return { docTypeLabel: 'Midterm', variant: 'Question' };
      case 'midterm_sample_highest':
        return { docTypeLabel: 'Midterm', variant: 'SampleHighest' };
      case 'final_question':
        return { docTypeLabel: 'Final', variant: 'Question' };
      case 'final_sample_highest':
        return { docTypeLabel: 'Final', variant: 'SampleHighest' };
      case 'lab_experiments_list':
        return { docTypeLabel: 'LabExperiments', variant: 'List' };
      case 'projects_list':
        return { docTypeLabel: 'Projects', variant: 'List' };
      case 'final_grades':
        return { docTypeLabel: 'FinalGrades' };
      case 'obe_excel':
        // No docTypeLabel or variant as per: "e.g. 2025.3.CSE103-00.xlsx for Fall 2025 CSE103 section 00 OBE Excel"
        return { docTypeLabel: '' };
      case 'co_attainment':
        return { docTypeLabel: 'COAttainment' };
      case 'grade_summary_cqi':
        return { docTypeLabel: 'GradeSummaryCQI' };
      default:
        return { docTypeLabel: category };
    }
  };

  const generateStoredFilename = (
    offering: any,
    category: DocumentCategory,
    fileExtension: string
  ): string => {
    if (!offering) return '';
    const academicYear = offering.academicYear;
    
    let termNumber = 1;
    const termStr = String(offering.term).toUpperCase();
    if (termStr === 'SPRING') termNumber = 1;
    else if (termStr === 'SUMMER') termNumber = 2;
    else if (termStr === 'FALL') termNumber = 3;

    const courseCode = offering.course?.code || '';
    const section = offering.section || '';
    
    const { docTypeLabel, variant } = getCategoryDetails(category);
    
    let baseName = `${academicYear}.${termNumber}.${courseCode}-${section}`;
    if (docTypeLabel) {
      baseName += `_${docTypeLabel}`;
      if (variant) {
        baseName += `_${variant}`;
      }
    }
    
    return `${baseName}.${fileExtension}`;
  };

  const getDocCategoryAllowedExtensions = (category: DocumentCategory): string[] => {
    if (category === 'course_outline') {
      return ['pdf', 'docx'];
    }
    if (category === 'obe_excel' || category.includes('excel') || category.includes('sheet')) {
      return ['xlsx', 'xls', 'pdf'];
    }
    return ['pdf', 'docx', 'xlsx'];
  };

  const validateFileType = (category: DocumentCategory, file: File): { isValid: boolean; error?: string } => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = getDocCategoryAllowedExtensions(category);
    if (!ext || !allowed.includes(ext)) {
      const uppercaseAllowed = allowed.map(e => e.toUpperCase()).join(' or ');
      const categoryLabel = getCategoryLabel(category);
      return {
        isValid: false,
        error: `Validation Error: File type mismatch for "${categoryLabel}". Only ${uppercaseAllowed} files are allowed.`
      };
    }
    return { isValid: true };
  };

  // Merge server and local simulated documents with guaranteed offering & course bindings
  const getMergedDocuments = () => {
    const merged: any[] = [];
    // Add all server documents
    documents.forEach(serverDoc => {
      const offering = serverDoc.offering || offerings.find(o => o.id === serverDoc.offeringId);
      const course = serverDoc.course || (offering ? courses.find(c => c.id === offering.courseId) : null);
      const instructor = serverDoc.instructor || (offering ? usersList.find(u => u.id === offering.instructorId) : null);
      merged.push({
        ...serverDoc,
        offering: offering || serverDoc.offering,
        course: course || serverDoc.course,
        instructor: instructor || serverDoc.instructor
      });
    });
    // Add local simulated documents only if there is no server document for that offering & category
    localDocuments.forEach(simDoc => {
      const exists = documents.some(d => d.offeringId === simDoc.offeringId && d.category === simDoc.category);
      if (!exists) {
        const offering = simDoc.offering || offerings.find(o => o.id === simDoc.offeringId);
        const course = simDoc.course || (offering ? courses.find(c => c.id === offering.courseId) : null);
        const instructor = simDoc.instructor || (offering ? usersList.find(u => u.id === offering.instructorId) : null);
        merged.push({
          ...simDoc,
          offering,
          course,
          instructor
        });
      }
    });
    return merged;
  };

  const allDocs = getMergedDocuments();

  const handleSlotFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const validation = validateFileType(uploadCategory, file);
      if (!validation.isValid) {
        setUploadFormError(validation.error || 'Invalid file type');
      } else {
        setUploadFormError('');
      }
      setShowUploadDoc(true);
    }
  };

  // Review Form
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewError, setReviewError] = useState('');

  // System Notification Banner
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // New State for Assigning Board Auditor on Course Offering Form
  const [newOffAuditorId, setNewOffAuditorId] = useState('');

  // New State for inline User Role Editing
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>(UserRole.INSTRUCTOR);
  const [editDept, setEditDept] = useState('');

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Check Auth on Mount
  useEffect(() => {
    fetchAuth();
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (currentUser) {
      fetchAllData();
      if (currentUser.role === UserRole.INSTRUCTOR) {
        setActiveTab('desk');
        setBrowseMode('structured');
      } else if (currentUser.role === UserRole.DEPT_HEAD) {
        setActiveTab('review');
        setBrowseMode('global');
      } else if (currentUser.role === UserRole.AUDITOR) {
        setActiveTab('review');
        setBrowseMode('structured');
      } else {
        setActiveTab('courses');
        setBrowseMode('global');
      }
    }
  }, [currentUser]);

  const fetchAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const res = await fetch('/api/me');
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Error fetching authentication:', err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const fetchAllData = async () => {
    setIsDataLoading(true);
    try {
      const [coursesRes, offeringsRes, docsRes, logsRes, usersRes, catRes, trashRes, notifRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/offerings'),
        fetch('/api/documents'),
        currentUser?.role === UserRole.ADMIN ? fetch('/api/audit-log?limit=all') : Promise.resolve(null),
        fetch('/api/users'),
        fetch('/api/categories?all=true'),
        fetch('/api/trash'),
        fetch('/api/notifications')
      ]);

      if (coursesRes.status === 401 || offeringsRes.status === 401 || docsRes.status === 401) {
        if (currentUser) {
          showNotification('Your session has expired. Please sign in again.', 'error');
          setCurrentUser(null);
        }
        return;
      }

      const coursesData = await coursesRes.json();
      const offeringsData = await offeringsRes.json();
      const docsData = await docsRes.json();
      const logsData = logsRes ? await logsRes.json().catch(() => ({})) : {};
      const usersData = await usersRes.json();
      const catData = await catRes.json();
      const trashData = await trashRes.json();
      const notifData = await notifRes.json().catch(() => ({}));

      setCourses(coursesData.courses || []);
      setOfferings(offeringsData.offerings || []);
      setDocuments(docsData.documents || []);
      setAuditLogs(logsData.auditLogs || []);
      if (logsData.auditLogs) {
        setLedgerLogs(logsData.auditLogs.slice(0, 25));
        setLedgerTotal(logsData.total || logsData.auditLogs.length);
        setLedgerTotalPages(logsData.totalPages || Math.max(1, Math.ceil(logsData.auditLogs.length / 25)));
      }
      setUsersList(usersData.users || []);
      if (catData.categories && catData.categories.length > 0) {
        setCategoriesList(catData.categories);
      }
      setTrashDocuments(trashData.documents || []);
      if (notifData.notifications) {
        setNotificationsList(notifData.notifications);
        setUnreadNotifCount(notifData.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error loading application data:', err);
      showNotification('Failed to sync course archives from server', 'error');
    } finally {
      setIsDataLoading(false);
    }
  };

  // Polling for real-time notifications
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      fetchNotifications();
    }, 20000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotificationsList(data.notifications || []);
        setUnreadNotifCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Failed to sync notifications', e);
    }
  };

  const handleMarkNotificationRead = async (id: string, linkOfferingId?: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadNotifCount(prev => Math.max(0, prev - 1));

      if (linkOfferingId) {
        const target = offerings.find(o => o.id === linkOfferingId);
        if (target) {
          setSelectedOffering(target);
          setActiveTab('courses');
        }
        setShowNotificationDrawer(false);
      }
    } catch (e) {
      console.error('Error marking notification read', e);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PUT' });
      setNotificationsList(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch (e) {
      console.error('Error marking all read', e);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotificationsList(prev => prev.filter(n => n.id !== id));
      setUnreadNotifCount(prev => {
        const target = notificationsList.find(n => n.id === id);
        return target && !target.isRead ? Math.max(0, prev - 1) : prev;
      });
    } catch (e) {
      console.error('Error deleting notification', e);
    }
  };

  // Fetch Server-Side Paginated Audit Logs for Ledger
  const fetchLedgerLogs = async (
    page = ledgerPage,
    limit = ledgerLimit,
    search = ledgerSearch,
    action = ledgerAction,
    dateRange = ledgerDateRange
  ) => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) return;
    setLedgerLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search.trim()) params.set('search', search.trim());
      if (action.trim()) params.set('action', action.trim());

      if (dateRange !== 'all') {
        const now = new Date();
        if (dateRange === 'today') {
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
          params.set('startDate', startOfDay);
        } else if (dateRange === '7d') {
          const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          params.set('startDate', past7);
        } else if (dateRange === '30d') {
          const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          params.set('startDate', past30);
        }
      }

      const res = await fetch(`/api/audit-log?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLedgerLogs(data.auditLogs || []);
        setLedgerTotal(data.total || 0);
        setLedgerPage(data.page || 1);
        setLedgerLimit(data.limit || limit);
        setLedgerTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch ledger logs', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ledger' && currentUser?.role === UserRole.ADMIN) {
      const timeoutId = setTimeout(() => {
        fetchLedgerLogs(ledgerPage, ledgerLimit, ledgerSearch, ledgerAction, ledgerDateRange);
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [activeTab, ledgerPage, ledgerLimit, ledgerSearch, ledgerAction, ledgerDateRange, currentUser]);

  const exportLedgerCSV = () => {
    const params = new URLSearchParams();
    if (ledgerSearch.trim()) params.set('search', ledgerSearch.trim());
    if (ledgerAction.trim()) params.set('action', ledgerAction.trim());
    if (ledgerDateRange !== 'all') {
      const now = new Date();
      if (ledgerDateRange === 'today') {
        params.set('startDate', new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString());
      } else if (ledgerDateRange === '7d') {
        params.set('startDate', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());
      } else if (ledgerDateRange === '30d') {
        params.set('startDate', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());
      }
    }
    window.open(`/api/audit-log/export?${params.toString()}`, '_blank');
  };

  const handleBatchSelectiveExport = async () => {
    if (!selectedOffering || selectedDocIdsForBatch.size === 0) return;
    setIsExportingSelective(true);
    try {
      const res = await fetch(`/api/offerings/${selectedOffering.id}/selective-export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds: Array.from(selectedDocIdsForBatch) })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showNotification(err.error || 'Failed to export custom package', 'error');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedOffering.academicYear}.${selectedOffering.term}.${selectedOffering.course?.code || 'Course'}-${selectedOffering.section}_Selected_${selectedDocIdsForBatch.size}_Files.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showNotification(`📦 Custom ZIP with ${selectedDocIdsForBatch.size} files downloaded successfully!`, 'success');
    } catch (e) {
      showNotification('Network error during export', 'error');
    } finally {
      setIsExportingSelective(false);
    }
  };

  const generateTypedSignatureDataUrl = (text: string, fontIndex: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const fonts = [
      '42px "Great Vibes", "Brush Script MT", cursive',
      '38px "Dancing Script", "Segoe Script", cursive',
      '44px "Sacramento", "Lucida Handwriting", cursive',
      '40px "Caveat", "Comic Sans MS", cursive'
    ];

    ctx.font = fonts[fontIndex] || fonts[0];
    ctx.fillStyle = '#0f172a';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const displayName = text.trim() || 'Signature';
    ctx.fillText(displayName, canvas.width / 2, canvas.height / 2 - 12);

    // Ink flourish underline
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const textWidth = ctx.measureText(displayName).width;
    const startX = Math.max(30, (canvas.width - textWidth) / 2 - 15);
    const endX = Math.min(canvas.width - 30, (canvas.width + textWidth) / 2 + 20);
    const y = canvas.height / 2 + 28;
    
    ctx.moveTo(startX, y);
    ctx.quadraticCurveTo(canvas.width / 2, y + 8, endX, y);
    ctx.stroke();

    return canvas.toDataURL('image/png');
  };

  const openSignatureModal = (action: 'submit' | 'approve') => {
    setSignatureAction(action);
    setSignatureMode('draw');
    setUploadedSignatureUrl(null);
    setTypedSignatureName(currentUser?.name || '');
    setTypedSignatureFont(0);
    setShowSignatureModal(true);
  };

  const handleSignatureSubmit = async () => {
    if (!selectedOffering || !signatureAction) return;

    let signatureDataUrl = '';

    if (signatureMode === 'draw') {
      if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
        showNotification('Please draw your signature on the canvas first', 'error');
        return;
      }
      signatureDataUrl = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
    } else if (signatureMode === 'upload') {
      if (!uploadedSignatureUrl) {
        showNotification('Please upload an image of your signature (.png or .jpg)', 'error');
        return;
      }
      signatureDataUrl = uploadedSignatureUrl;
    } else if (signatureMode === 'type') {
      if (!typedSignatureName.trim()) {
        showNotification('Please type your full name for the automated signature', 'error');
        return;
      }
      signatureDataUrl = generateTypedSignatureDataUrl(typedSignatureName, typedSignatureFont);
    }

    if (!signatureDataUrl) {
      showNotification('Could not generate signature image', 'error');
      return;
    }

    try {
      const endpoint = signatureAction === 'submit' 
        ? `/api/offerings/${selectedOffering.id}/submit` 
        : `/api/offerings/${selectedOffering.id}/approve`;

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureUrl: signatureDataUrl })
      });

      const data = await res.json();
      if (res.ok) {
        showNotification(
          signatureAction === 'submit' 
            ? '🎉 Course portfolio submitted and digitally signed successfully!' 
            : '✅ Course portfolio officially approved and endorsed!',
          'success'
        );
        setShowSignatureModal(false);
        fetchAllData();
        if (data.offering) {
          setSelectedOffering(data.offering);
        }
      } else {
        showNotification(data.error || 'Failed to submit signature', 'error');
      }
    } catch (err) {
      showNotification('Network error submitting digital signature', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
  };

  const getAccessibleOfferings = () => {
    if (!currentUser) return [];
    
    // Admins and Universal Data Entry Operator have full access across all course offerings
    if (currentUser.role === UserRole.ADMIN || currentUser.email === 'data-entry@ewubd.edu') {
      return offerings;
    }
    
    // Department heads can see all offerings in their department
    if (currentUser.role === UserRole.DEPT_HEAD) {
      const dept = currentUser.department?.toLowerCase().trim() || '';
      return offerings.filter(o => {
        const oDept = o.course?.department?.toLowerCase().trim() || '';
        return oDept === dept || dept.includes(oDept) || oDept.includes(dept);
      });
    }
    
    // Instructors can see only offerings where they are the instructor
    if (currentUser.role === UserRole.INSTRUCTOR) {
      return offerings.filter(o => o.instructorId === currentUser.id);
    }
    
    // Board auditors can see only offerings explicitly assigned to them
    if (currentUser.role === UserRole.AUDITOR) {
      return offerings.filter(o => o.auditorId === currentUser.id);
    }
    
    return [];
  };

  // Helper to calculate missing categories for a specific course offering
  const getOfferingMissingCategories = (offeringId: string): DocumentCategory[] => {
    const activeCoreCategories = categoriesList.filter(c => c.isCore && c.isActive !== false).map(c => c.id);
    const coreList = activeCoreCategories.length > 0 ? activeCoreCategories : CORE_16_CATEGORIES;
    const currentOfferingDocs = allDocs.filter(d => d.offeringId === offeringId && d.isCurrent);
    return coreList.filter(cat => !currentOfferingDocs.some(d => d.category === cat));
  };

  // Helper to open the pre-composed reminder modal for a faculty member
  const openReminderModal = (offering: CourseOffering & { course?: Course; instructor?: UserType }) => {
    const missingCats = getOfferingMissingCategories(offering.id);
    const instructor = offering.instructor || usersList.find(u => u.id === offering.instructorId) || {
      id: offering.instructorId,
      name: 'Course Instructor',
      email: 'faculty@university.edu',
      role: UserRole.INSTRUCTOR
    };

    const missingLabels = missingCats.map(cat => getCategoryLabel(cat));

    const courseCode = offering.course?.code || 'Course';
    const courseTitle = offering.course?.title || '';
    const termStr = `${offering.term} ${offering.academicYear}`;
    const sectionStr = offering.section ? ` (Section ${offering.section})` : '';

    const subject = `[Course File Notice] Missing Course File Submissions for ${courseCode} (${termStr})`;
    
    const initialBody = `Dear ${instructor.name},

This is an official notice regarding your course portfolio for ${courseCode}${courseTitle ? ` - ${courseTitle}` : ''} (${termStr}${sectionStr}).

The following required course items are currently missing from your course archive:
${missingLabels.length > 0 ? missingLabels.map(l => `• ${l}`).join('\n') : '• Core Portfolio Components'}

Please log in to the Course File Archive system and upload these documents at your earliest convenience to complete your course portfolio.

Access Course File Archive: ${window.location.origin}

Best regards,
${currentUser?.name || 'Department Administration'}
${currentUser?.role === UserRole.DEPT_HEAD ? 'Department Head' : 'Academic Administration'}`;

    setReminderModalData({
      isOpen: true,
      offering,
      instructor,
      missingCategories: missingCats,
      deadline: '',
      subject,
      body: initialBody,
      recipient: instructor.email || '',
      copied: false,
      isSendingLog: false,
    });
  };

  // Helper to open pre-composed revision email for a specific rejected document
  const openDocRevisionEmail = (doc: DocumentType, customFeedback?: string) => {
    const docOffering = offerings.find(o => o.id === doc.offeringId) || selectedOffering;
    const instructor = docOffering?.instructor || usersList.find(u => u.id === docOffering?.instructorId) || {
      id: docOffering?.instructorId || '',
      name: 'Course Instructor',
      email: 'faculty@university.edu',
      role: UserRole.INSTRUCTOR
    };

    const courseCode = docOffering?.course?.code || (doc as any).course?.code || 'Course';
    const courseTitle = docOffering?.course?.title || (doc as any).course?.title || '';
    const termStr = docOffering ? `${docOffering.term} ${docOffering.academicYear}` : '';
    const sectionStr = docOffering?.section ? ` (Section ${docOffering.section})` : '';
    const categoryLabel = getCategoryLabel(doc.category);
    const feedbackText = customFeedback || doc.feedback || 'Please update and resubmit the document according to department guidelines.';

    const subject = `[Course Portfolio Action Required] Revision Requested for ${courseCode} - ${categoryLabel}`;
    const initialBody = `Dear ${instructor.name},

This is an official notice regarding your course portfolio for ${courseCode}${courseTitle ? ` - ${courseTitle}` : ''} (${termStr}${sectionStr}).

During department portfolio review, the following document submission requires revision:
• Document Slot: ${categoryLabel}
• Submitted File: ${doc.fileName}
• Status: Revision Required (Rejected)
• Reviewer Feedback / Instructions:
"${feedbackText}"

Please log in to the Course File Archive portal, address the reviewer feedback, and upload the updated document at your earliest convenience:
${window.location.origin}

Best regards,
${currentUser?.name || 'Department Administration'}
${currentUser?.role === UserRole.DEPT_HEAD ? 'Department Head' : 'Academic Administration'}`;

    setReminderModalData({
      isOpen: true,
      offering: docOffering as any,
      instructor,
      missingCategories: [doc.category],
      deadline: '',
      subject,
      body: initialBody,
      recipient: instructor.email || '',
      copied: false,
      isSendingLog: false,
    });
  };

  // Helper to update deadline in reminder modal body
  const updateReminderDeadline = (deadlineStr: string) => {
    if (!reminderModalData) return;
    const prevDeadline = reminderModalData.deadline;
    let newBody = reminderModalData.body;

    if (deadlineStr.trim()) {
      const deadlineLine = `\nSubmission Deadline: ${deadlineStr}\n`;
      if (prevDeadline && newBody.includes(`Submission Deadline: ${prevDeadline}`)) {
        newBody = newBody.replace(`Submission Deadline: ${prevDeadline}`, `Submission Deadline: ${deadlineStr}`);
      } else if (newBody.includes('Please log in')) {
        newBody = newBody.replace('Please log in', `${deadlineLine}\nPlease log in`);
      } else {
        newBody += `\n${deadlineLine}`;
      }
    } else if (prevDeadline && newBody.includes(`Submission Deadline: ${prevDeadline}`)) {
      newBody = newBody.replace(`\nSubmission Deadline: ${prevDeadline}\n`, '').replace(`Submission Deadline: ${prevDeadline}`, '');
    }

    setReminderModalData(prev => prev ? {
      ...prev,
      deadline: deadlineStr,
      body: newBody,
    } : null);
  };

  const handleDeadlinePreset = (preset: 'end_of_week' | 'next_monday' | 'in_7_days' | 'clear') => {
    if (preset === 'clear') {
      updateReminderDeadline('');
      return;
    }

    const now = new Date();
    let target = new Date();

    if (preset === 'end_of_week') {
      const day = now.getDay();
      const diff = (5 - day + 7) % 7 || 7; // Target Friday
      target.setDate(now.getDate() + diff);
    } else if (preset === 'next_monday') {
      const day = now.getDay();
      const diff = (1 - day + 7) % 7 || 7; // Target Monday
      target.setDate(now.getDate() + diff);
    } else if (preset === 'in_7_days') {
      target.setDate(now.getDate() + 7);
    }

    const formatted = target.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' (11:59 PM)';

    updateReminderDeadline(formatted);
  };

  const handleOpenInGmail = async () => {
    if (!reminderModalData) return;
    setReminderModalData(prev => prev ? { ...prev, isSendingLog: true } : null);

    const { offering, instructor, missingCategories, deadline, subject, body, recipient } = reminderModalData;
    const courseCode = offering?.course?.code || '';

    try {
      await fetch('/api/reminders/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offeringId: offering?.id,
          facultyEmail: recipient,
          facultyName: instructor?.name,
          courseCode,
          missingCount: missingCategories.length,
          missingCategories: missingCategories.map(c => getCategoryLabel(c)),
          deadline,
          subject,
        }),
      });

      fetchAllData();
    } catch (err) {
      console.error('Failed to log reminder', err);
    }

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');

    showNotification(`Opened in Gmail & logged in Audit Trail for ${instructor?.name || recipient}!`, 'success');
    setReminderModalData(null);
  };

  const handleOpenInMailto = async () => {
    if (!reminderModalData) return;
    const { offering, instructor, missingCategories, deadline, subject, body, recipient } = reminderModalData;
    const courseCode = offering?.course?.code || '';

    try {
      await fetch('/api/reminders/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offeringId: offering?.id,
          facultyEmail: recipient,
          facultyName: instructor?.name,
          courseCode,
          missingCount: missingCategories.length,
          missingCategories: missingCategories.map(c => getCategoryLabel(c)),
          deadline,
          subject,
        }),
      });
      fetchAllData();
    } catch (err) {
      console.error('Failed to log reminder', err);
    }

    const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;

    showNotification(`Triggered default mail app & logged in Audit Trail!`, 'success');
    setReminderModalData(null);
  };

  const handleCopyReminder = () => {
    if (!reminderModalData) return;
    navigator.clipboard.writeText(reminderModalData.body);
    setReminderModalData(prev => prev ? { ...prev, copied: true } : null);
    showNotification('Reminder text copied to clipboard!', 'info');
    setTimeout(() => {
      setReminderModalData(prev => prev ? { ...prev, copied: false } : null);
    }, 2000);
  };

  const handleUpdateUserRoleAndDept = (userId: string, role: UserRole, department: string, pendingApproval: boolean, userName: string) => {
  requestConfirmation(
    "Change User Privileges",
    `You are about to change the role for ${userName} to ${role.replace('_', ' ')}. This will immediately alter what they can view and edit in the system.`,
    "Confirm Role Change",
    () => executeUserRoleUpdate(userId, role, department, pendingApproval),
    role === UserRole.ADMIN
  );
};

const executeUserRoleUpdate = async (userId: string, role: UserRole, department: string, pendingApproval: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          department,
          pendingApproval
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`Updated role/approval for ${data.user.name} successfully`, 'success');
        setEditingUserId(null);
        fetchAllData();
      } else {
        showNotification(getUserFriendlyErrorMessage(data.error || 'Failed to update user'), 'error');
      }
    } catch (err) {
      showNotification('Network error updating user', 'error');
    }
  };

  const handleDeleteUser = (user: UserType) => {
    if (currentUser?.id === user.id) {
      showNotification('You cannot delete your own active administrator account', 'error');
      return;
    }

    requestConfirmation(
      'Delete User Personnel',
      `Are you sure you want to delete "${user.name}" (${user.email}) from the personnel directory? Any course teaching or audit assignments for this user will be unlinked. This action will be recorded in the audit log.`,
      'Delete User',
      async () => {
        try {
          const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok) {
            showNotification(`User "${user.name}" was successfully removed`, 'success');
            fetchAllData();
          } else {
            showNotification(getUserFriendlyErrorMessage(data.error || 'Failed to delete user'), 'error');
          }
        } catch (err) {
          showNotification('Network error deleting user', 'error');
        }
      },
      true
    );
  };

  // Auth Operations

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both your university email and password.');
      return;
    }
    setIsAuthSubmitting(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        showNotification(`Welcome back, ${data.user.name}!`, 'success');
        setLoginPassword('');
      } else {
        setLoginError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setLoginError('Network connection issue. Express server may be starting.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!registerName.trim() || !registerEmail.trim() || !registerPassword) {
      setLoginError('Full name, university email, and password are required.');
      return;
    }
    if (registerPassword.length < 6) {
      setLoginError('Password must be at least 6 characters long.');
      return;
    }
    setIsAuthSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName.trim(),
          email: registerEmail.trim(),
          password: registerPassword,
          department: registerDept || 'Department of Computer Science & Engineering',
          role: registerRole || UserRole.INSTRUCTOR,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        showNotification(`Account created successfully! Welcome, ${data.user.name}.`, 'success');
        setRegisterPassword('');
        setRegisterName('');
        setRegisterEmail('');
      } else {
        setLoginError(data.error || 'Registration failed');
      }
    } catch (err) {
      setLoginError('Network connection issue during registration.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleOAuthSuccess = async (credentialResponse: any) => {
    setLoginError('');
    try {
      const idToken = credentialResponse.credential;
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: '', // backend extracts email from Google token
          googleToken: idToken,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        showNotification(`Logged in via Google as ${data.user.name}`, 'success');
      } else {
        setLoginError(data.error || 'Google Sign-In verification failed');
      }
    } catch (err: any) {
      console.error('OAuth Auth error:', err);
      setLoginError('Google Sign-In failed.');
    }
  };

  const handleOAuthError = () => {
    setLoginError('Google Sign-In failed.');
  };

  useGoogleOneTapLogin({
    onSuccess: handleOAuthSuccess,
    onError: handleOAuthError,
    disabled: !!currentUser,
    auto_select: true,
  });

  const handleQuickLogin = async (email: string) => {
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'ewu123456' }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        showNotification(`Logged in as ${data.user.name} (${data.user.role.toUpperCase()})`, 'success');
      } else {
        setLoginError(data.error || 'Quick login failed');
      }
    } catch (err) {
      console.error('Quick login error:', err);
      setLoginError('Could not log in. Express server may be offline or returned an error.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setCurrentUser(null);
      setSelectedOffering(null);
      showNotification('Logged out successfully', 'info');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Form Submissions
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseFormError('');
    if (!newCourseCode || !newCourseTitle || !newCourseDept) {
      setCourseFormError('All fields are required');
      return;
    }

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCourseCode,
          title: newCourseTitle,
          department: newCourseDept
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`Successfully archived course: ${data.course.code}`, 'success');
        setNewCourseCode('');
        setNewCourseTitle('');
        setNewCourseDept('');
        setShowAddCourse(false);
        fetchAllData();
      } else {
        setCourseFormError(data.error || 'Failed to create course');
      }
    } catch (err) {
      setCourseFormError('Network error adding course');
    }
  };

  const handleAddOffering = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfferingFormError('');
    if (!newOffCourseId || !newOffYear || !newOffTerm || !newOffSection || !newOffInstructorId) {
      setOfferingFormError('All fields are required');
      return;
    }

    try {
      const res = await fetch('/api/offerings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: newOffCourseId,
          academicYear: Number(newOffYear),
          term: newOffTerm,
          section: newOffSection,
          instructorId: newOffInstructorId,
          auditorId: newOffAuditorId || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`Created syllabus offering for Section ${data.offering.section}`, 'success');
        setNewOffAuditorId('');
        setShowAddOffering(false);
        fetchAllData();
      } else {
        setOfferingFormError(data.error || 'Failed to create offering');
      }
    } catch (err) {
      setOfferingFormError('Network error adding offering');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');
    if (!newUserName || !newUserEmail || !newUserRole) {
      setUserFormError('Name, email, and role are required');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
          department: newUserDept
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`Registered university staff: ${data.user.name}`, 'success');
        setNewUserName('');
        setNewUserEmail('');
        setNewUserDept('');
        setShowAddUser(false);
        fetchAllData();
      } else {
        setUserFormError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setUserFormError('Network error adding user');
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadFormError('');
    if (!currentUser) return;
    if (!selectedOffering) return;
    if (!uploadCategory) {
      setUploadFormError('Please select a category');
      return;
    }
    if (!selectedFile && !uploadText) {
      setUploadFormError('Please select a document file (.pdf, .xlsx, or .docx) to upload.');
      return;
    }

    const ext = selectedFile 
      ? (selectedFile.name.split('.').pop()?.toLowerCase() || 'pdf') 
      : (uploadCategory === 'obe_excel' ? 'xlsx' : 'pdf');

    if (selectedFile) {
      const validation = validateFileType(uploadCategory, selectedFile);
      if (!validation.isValid) {
        setUploadFormError(validation.error || 'Invalid file type');
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('offeringId', selectedOffering.id);
      formData.append('category', uploadCategory);
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('textContent', uploadText);
      }

      // Start fake progress interval for UI visual feedback
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 5 : prev));
      }, 150);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Server rejected the upload.');
      }
      const data = await res.json();
      const newDoc = data.document;

      setUploadProgress(100);
      showNotification(`Document Uploaded: ${newDoc ? newDoc.fileName : 'Document'}`, 'success');
      
      // Cleanup & Refresh
      setUploadText('');
      setSelectedFile(null);
      setShowUploadDoc(false);

      // Fetch fresh data
      await fetchAllData();

      // Refresh selected offering detail checklist
      const refreshedOffering = offerings.find(o => o.id === selectedOffering.id);
      if (refreshedOffering) {
        setSelectedOffering(refreshedOffering);
      }
    } catch (err: any) {
      console.error('[Upload Flow Error]', err);
      setUploadFormError(err.message || 'An unexpected error occurred during secure storage upload.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePopulateSamples = async (offeringId: string) => {
    setIsPopulatingSamples(true);
    try {
      const res = await fetch(`/api/offerings/${offeringId}/populate-samples`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`✨ Successfully loaded ${data.count} official sample files & student sub-slots! Portfolio is now 100% complete.`, 'success');
        await fetchAllData();
        if (data.offering) {
          setSelectedOffering(data.offering);
        }
      } else {
        showNotification(data.error || 'Failed to auto-populate sample files', 'error');
      }
    } catch (err) {
      showNotification('Network error loading sample files', 'error');
    } finally {
      setIsPopulatingSamples(false);
    }
  };

  
  const handleDeleteDoc = async (docId: string, fileName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Document',
      message: `Are you sure you want to completely delete "${fileName}"? This action will be logged and the file removed from the database and storage.`,
      confirmLabel: 'Delete File',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Delete failed' }));
            throw new Error(err.error || 'Failed to delete document');
          }
          showNotification(`Document ${fileName} deleted successfully.`, 'success');
          await fetchAllData();
        } catch (err: any) {
          console.error(err);
          showNotification(err.message || 'Delete operation failed', 'error');
        }
      }
    });
  };

  const handleReviewDoc = async (e?: React.FormEvent, sendEmail = false) => {
    if (e) e.preventDefault();
    setReviewError('');
    if (!currentUser) return;
    if (!showReviewDoc) return;

    const targetDoc = showReviewDoc;
    const currentFeedback = reviewFeedback;
    const currentReviewStatus = reviewStatus;

    if (targetDoc.id.startsWith('sim-')) {
      const updatedLocalDocs = localDocuments.map(d => {
        if (d.id === targetDoc.id) {
          return { ...d, status: currentReviewStatus, feedback: currentFeedback };
        }
        return d;
      });
      setLocalDocuments(updatedLocalDocs);
      localStorage.setItem('local_simulated_documents', JSON.stringify(updatedLocalDocs));

      const newLogEntry = {
        id: `log-${Date.now()}`,
        action: currentReviewStatus === 'approved' ? 'APPROVE_DOC' : 'REJECT_DOC',
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        details: `Reviewed local simulation document "${targetDoc.fileName}". Status set to ${currentReviewStatus.toUpperCase()} with feedback: "${currentFeedback || 'No feedback provided'}"`,
      };
      setAuditLogs([newLogEntry, ...auditLogs]);

      showNotification(`Document status updated successfully`, 'success');
      setReviewFeedback('');
      setShowReviewDoc(null);
      if (sendEmail) {
        openDocRevisionEmail(targetDoc, currentFeedback);
      }
      return;
    }

    try {
      const res = await fetch(`/api/documents/${targetDoc.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: currentReviewStatus,
          feedback: currentFeedback
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`Document ${targetDoc.fileName} marked as ${currentReviewStatus.toUpperCase()}`, 'success');
        setReviewFeedback('');
        setShowReviewDoc(null);
        fetchAllData();
        if (sendEmail) {
          openDocRevisionEmail(targetDoc, currentFeedback);
        }
      } else {
        setReviewError(getUserFriendlyErrorMessage(data.error || 'Failed to review document'));
      }
    } catch (err) {
      setReviewError('Network error reviewing document');
    }
  };

  const doExportPackage = async (offering: CourseOffering) => {
    setIsExportingId(offering.id);
    showNotification('Exporting package... This may take a moment.', 'info');
    
    try {
      const res = await fetch(`/api/offerings/${offering.id}/export-package`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(err.error || 'Failed to export package');
      }
      
      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = 'export.zip';
      if (contentDisposition && contentDisposition.includes('filename="')) {
        filename = contentDisposition.split('filename="')[1].split('"')[0];
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showNotification('Package exported successfully', 'success');
      fetchAllData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setIsExportingId(null);
    }
  };

  const handleExportPackage = async (offering: CourseOffering, offDocs: DocumentType[], presentCount: number) => {
    const activeCoreCategories = categoriesList.filter(c => c.isCore && c.isActive !== false).map(c => c.id);
    const coreList = activeCoreCategories.length > 0 ? activeCoreCategories : CORE_16_CATEGORIES;
    if (presentCount < coreList.length) {
      const missingCats = coreList.filter(catVal => 
        !offDocs.some(d => d.category === catVal)
      );
      const missingLabels = missingCats.map(catVal => getCategoryLabel(catVal));
      
      requestConfirmation(
        'Export Incomplete Package?',
        `This course folder is missing ${missingCats.length} required document(s):\n• ${missingLabels.slice(0, 4).join('\n• ')}${missingLabels.length > 4 ? `\n• ...and ${missingLabels.length - 4} more` : ''}\n\nDo you want to continue with the export?`,
        'Export Anyway',
        () => doExportPackage(offering),
        false
      );
      return;
    }
    
    await doExportPackage(offering);
  };

  // Category Slots Handlers
  const handleAddCategorySlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatLabel.trim()) {
      showNotification('Please provide a valid category slot label', 'error');
      return;
    }
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newCatLabel.trim(),
          group: newCatGroup,
          isCore: newCatIsCore,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`Added new requirement slot "${data.category.label}"`, 'success');
        setNewCatLabel('');
        setShowAddCatModal(false);
        fetchAllData();
      } else {
        showNotification(data.error || 'Failed to create category slot', 'error');
      }
    } catch (err) {
      showNotification('Network error creating category slot', 'error');
    }
  };

  const handleToggleCategoryCore = async (cat: CategoryConfig) => {
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isCore: !cat.isCore,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`Slot "${cat.label}" is now ${data.category.isCore ? 'Core Requirement' : 'Optional'}`, 'success');
        fetchAllData();
      } else {
        showNotification(data.error || 'Failed to update category', 'error');
      }
    } catch (err) {
      showNotification('Network error updating category', 'error');
    }
  };

  const handleDeleteCategorySlot = async (cat: CategoryConfig) => {
    requestConfirmation('Deactivate Requirement Slot', `Are you sure you want to deactivate slot "${cat.label}"? Any existing files remain safe, but this slot will no longer be required.`, 'Deactivate Slot', async () => {
      try {
        const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' });
        if (res.ok) {
          showNotification(`Requirement slot "${cat.label}" deactivated`, 'success');
          fetchAllData();
        } else {
          const data = await res.json();
          showNotification(data.error || 'Failed to delete slot', 'error');
        }
      } catch (err) {
        showNotification('Network error deleting slot', 'error');
      }
    }, true);
  };

  // Trash & R2 Purge Handlers
  const handleMoveDocToTrash = async (docId: string, docName: string) => {
    requestConfirmation('Move to Deleted Files', `Move "${docName}" to Deleted Files? You can restore it anytime.`, 'Move to Deleted Files', async () => {
      try {
        const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
        if (res.ok) {
          showNotification(`Moved "${docName}" to Trash`, 'success');
          fetchAllData();
        } else {
          const data = await res.json();
          showNotification(data.error || 'Failed to move document to trash', 'error');
        }
      } catch (err) {
        showNotification('Network error moving document to trash', 'error');
      }
    }, true);
  };

  const handleRestoreTrashDoc = async (docId: string, docName: string) => {
    try {
      const res = await fetch(`/api/trash/${docId}/restore`, { method: 'POST' });
      if (res.ok) {
        showNotification(`Restored document "${docName}" to active portfolio`, 'success');
        fetchAllData();
      } else {
        const data = await res.json();
        showNotification(data.error || 'Failed to restore document', 'error');
      }
    } catch (err) {
      showNotification('Network error restoring document', 'error');
    }
  };

  const handlePurgeTrashDoc = async (docId: string, docName: string) => {
    requestConfirmation('Permanently Delete File', `Are you sure you want to permanently delete "${docName}" from storage? This action cannot be undone.`, 'Permanently Delete', async () => {
      try {
        const res = await fetch(`/api/trash/${docId}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
          showNotification(`Permanently purged "${docName}" ${data.r2Deleted ? 'from Cloudflare R2 storage' : ''}`, 'success');
          fetchAllData();
        } else {
          showNotification(data.error || 'Failed to purge document', 'error');
        }
      } catch (err) {
        showNotification('Network error purging document from R2', 'error');
      }
    }, true);
  };

  const generatePredefinedText = () => {
    const templates: Record<string, string> = {
      course_outline: `COURSE SYLLABUS OUTLINE - CSE412\nTitle: Software Engineering\nCredits: 4.0\nLearning Outcomes:\n1. Model software requirements using UML.\n2. Apply Agile/Scrum process frameworks.\n3. Build modular applications and integrate testing pipelines.\nTopics: Agile SDLC, Requirement Specifications, Design Patterns, CI/CD, Unit Testing.`,
      class_attendance: `CLASS ATTENDANCE RECORD SHEET\nAcademic Year: 2025 | Term: Spring\nSection: 01\nTotal Classes Held: 24\nAverage Attendance: 91.4%\nDetails: Weekly records compiled from lecture logs, signed off by instructor.`,
      midterm_question: `MIDTERM EXAMINATION PAPER - CONFIDENTIAL\nCourse Code: CSE412 | Course Title: Software Engineering\nDuration: 1.5 Hours | Full Marks: 40\n\nQ1 (15 Marks): Discuss software re-engineering and the architectural drift.\nQ2 (15 Marks): Draft a precise use case and sequence diagram for an e-commerce checkout loop.\nQ3 (10 Marks): State testing criteria for MC/DC (Modified Condition/Decision Coverage).`,
      final_grades: `FINAL COURSE GRADESHEET PORTAL EXPORT\nCourse: CSE412 Software Engineering Sec 01\nGrade Distribution Summary:\nA: 11 students | A-: 8 students\nB+: 10 students | B: 5 students\nC+: 3 students | F: 1 student (Incomplete attendance)\n\nApproved and locked for registrar submission.`,
      obe_excel: `OUTCOME BASED EDUCATION (OBE) MATRIX ANALYSIS\nCO-PO Attainment Calculator v2.4\nCO1 (Syllabus Design) -> PO1 (Engineering Knowledge): 84% attainment.\nCO2 (UML Diagrams) -> PO3 (Design/Development of Solutions): 72% attainment.\nCO3 (Team Scrum Project) -> PO9 (Individual & Team Work): 95% attainment.`,
    };
    setUploadText(templates[uploadCategory] || `Simulated course archive text content for category ${uploadCategory.toUpperCase()}.\nCreated: ${new Date().toLocaleString()}\nVerified secure container compilation.`);
  };

  // Unique available years from offerings & documents
  const availableYears = Array.from(
    new Set([
      ...allDocs.map(d => d.offering?.academicYear).filter(Boolean),
      ...offerings.map(o => o.academicYear).filter(Boolean)
    ])
  ).sort((a, b) => Number(b) - Number(a));

  const availableDepts = Array.from(
    new Set(courses.map(c => c.department).filter(Boolean))
  ).sort();

  // Distinct sorted course codes for filter dropdown
  const availableCourseOptions = Array.from(
    new Set(courses.map(c => c.code).filter(Boolean))
  ).sort().map(code => {
    const matched = courses.find(c => c.code === code);
    return {
      code,
      id: matched?.id || code,
      title: matched?.title || ''
    };
  });

  // Reset all filters in Archive Search Hub
  const clearArchiveFilters = () => {
    setArchiveSearch('');
    setArchiveCourseFilter('');
    setArchiveCategoryFilter('');
    setArchiveStatusFilter('');
    setArchiveYearFilter('');
    setArchiveTermFilter('');
    setArchiveDeptFilter('');
  };

  // CSV Export for Filtered Search Results
  const exportFilteredDocsCSV = () => {
    if (filteredDocs.length === 0) {
      showNotification('No documents to export for current search criteria', 'error');
      return;
    }
    const headers = ['Course Code', 'Course Title', 'Department', 'Academic Year', 'Term', 'Category', 'File Name', 'Version', 'Uploaded By', 'Uploaded At', 'Status'];
    const rows = filteredDocs.map(d => [
      `"${d.course?.code || ''}"`,
      `"${(d.course?.title || '').replace(/"/g, '""')}"`,
      `"${(d.course?.department || '').replace(/"/g, '""')}"`,
      `"${d.offering?.academicYear || ''}"`,
      `"${d.offering?.term || ''}"`,
      `"${getCategoryLabel(d.category)}"`,
      `"${(d.fileName || '').replace(/"/g, '""')}"`,
      `"v${d.version || 1}"`,
      `"${d.uploadedBy || ''}"`,
      `"${d.uploadedAt || ''}"`,
      `"${d.status || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Document_Archive_Search_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`Exported ${filteredDocs.length} document metadata records to CSV`, 'success');
  };

  // Robust multi-token and multi-criteria document filtering
  const filteredDocs = allDocs.filter(doc => {
    // Role-based visibility enforcement on Document Catalog
    const allowedOfferings = getAccessibleOfferings();
    const isAccessible = allowedOfferings.some(o => o.id === doc.offeringId);
    if (!isAccessible) return false;

    const offering = doc.offering || offerings.find(o => o.id === doc.offeringId);
    const course = doc.course || (offering ? courses.find(c => c.id === offering.courseId) : null);

    const searchLower = archiveSearch.toLowerCase().trim();
    const courseCode = course?.code?.toLowerCase() || '';
    const courseTitle = course?.title?.toLowerCase() || '';
    const fileName = (doc.fileName || '').toLowerCase();
    const categoryLabel = getCategoryLabel(doc.category).toLowerCase();
    const uploaderName = (doc.uploadedBy || '').toLowerCase();
    const instructorName = (doc.instructor?.name || '').toLowerCase();
    const yearStr = (offering?.academicYear || '').toString().toLowerCase();
    const termStr = (offering?.term || '').toLowerCase();
    const deptStr = (course?.department || '').toLowerCase();

    // Multi-term token matching (all keywords must be matched)
    const searchTokens = searchLower.split(/\s+/).filter(Boolean);
    const matchesSearch = searchTokens.length === 0 || searchTokens.every(token =>
      courseCode.includes(token) ||
      courseTitle.includes(token) ||
      fileName.includes(token) ||
      categoryLabel.includes(token) ||
      uploaderName.includes(token) ||
      instructorName.includes(token) ||
      yearStr.includes(token) ||
      termStr.includes(token) ||
      deptStr.includes(token)
    );

    // Course filter: match by course code or ID
    const matchesCourse = !archiveCourseFilter ||
      (course?.code && course.code.toUpperCase() === archiveCourseFilter.toUpperCase()) ||
      (course?.id && course.id === archiveCourseFilter) ||
      (offering?.courseId && offering.courseId === archiveCourseFilter);

    // Category filter
    const matchesCategory = !archiveCategoryFilter || doc.category === archiveCategoryFilter;

    // Status filter: normalized handling of pending vs pending_review
    const docStatusNorm = (doc.status === 'pending_review' || doc.status === 'pending') ? 'pending_review' : doc.status;
    const filterStatusNorm = (archiveStatusFilter === 'pending_review' || archiveStatusFilter === 'pending') ? 'pending_review' : archiveStatusFilter;
    const matchesStatus = !archiveStatusFilter || docStatusNorm === filterStatusNorm;

    // Year filter
    const matchesYear = !archiveYearFilter || (offering?.academicYear && String(offering.academicYear) === archiveYearFilter);

    // Term filter: case-insensitive
    const matchesTerm = !archiveTermFilter || (offering?.term && offering.term.toLowerCase() === archiveTermFilter.toLowerCase());

    // Department filter: case-insensitive trim
    const matchesDept = !archiveDeptFilter || (course?.department && course.department.toLowerCase().trim() === archiveDeptFilter.toLowerCase().trim());

    return matchesSearch && matchesCourse && matchesCategory && matchesStatus && matchesYear && matchesTerm && matchesDept;
  });

  // Archive pagination slicing & auto-reset
  const archiveTotalPages = Math.max(1, Math.ceil(filteredDocs.length / archivePageSize));
  const paginatedArchiveDocs = filteredDocs.slice((archivePage - 1) * archivePageSize, archivePage * archivePageSize);

  useEffect(() => {
    setArchivePage(1);
  }, [archiveSearch, archiveCourseFilter, archiveCategoryFilter, archiveStatusFilter, archiveYearFilter, archiveTermFilter, archiveDeptFilter]);

  // User Management filtering & pagination slicing
  const filteredUsers = usersList.filter(u => {
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase().trim();
      const matchName = u.name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchDept = u.department?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchDept) return false;
    }
    if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
    if (userStatusFilter === 'active' && u.pendingApproval) return false;
    if (userStatusFilter === 'pending' && !u.pendingApproval) return false;
    return true;
  });
  const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));
  const paginatedUsers = filteredUsers.slice((userPage - 1) * userPageSize, userPage * userPageSize);

  useEffect(() => {
    setUserPage(1);
  }, [userSearch, userRoleFilter, userStatusFilter]);

  // Trash filtering & pagination slicing
  const filteredTrash = trashDocuments.filter(doc => {
    if (!trashSearch.trim()) return true;
    const q = trashSearch.toLowerCase().trim();
    const offering = offerings.find(o => o.id === doc.offeringId);
    const course = offering ? courses.find(c => c.id === offering.courseId) : null;
    return (
      (doc.fileName && doc.fileName.toLowerCase().includes(q)) ||
      (course && course.code.toLowerCase().includes(q)) ||
      (doc.uploadedBy && doc.uploadedBy.toLowerCase().includes(q)) ||
      (doc.category && doc.category.toLowerCase().includes(q))
    );
  });
  const trashTotalPages = Math.max(1, Math.ceil(filteredTrash.length / trashPageSize));
  const paginatedTrash = filteredTrash.slice((trashPage - 1) * trashPageSize, trashPage * trashPageSize);

  useEffect(() => {
    setTrashPage(1);
  }, [trashSearch]);

  const accessibleOfferings = getAccessibleOfferings();

  const uniqueSessions = Array.from(
    new Set(accessibleOfferings.map(o => `${o.academicYear}-${o.term}`))
  ).map(sessionStr => {
    const [yearStr, term] = sessionStr.split('-');
    return {
      value: sessionStr,
      label: `${term.charAt(0).toUpperCase() + term.slice(1).toLowerCase()} ${yearStr}`,
      year: Number(yearStr),
      term
    };
  }).sort((a, b) => b.year - a.year || b.term.localeCompare(a.term));

  const instructorsList = usersList.filter(u => u.role === UserRole.INSTRUCTOR);

  const filteredOfferings = accessibleOfferings.filter(off => {
    if (globalCourseCode) {
      const q = globalCourseCode.toLowerCase().trim();
      const code = off.course?.code?.toLowerCase() || '';
      const title = off.course?.title?.toLowerCase() || '';
      if (!code.includes(q) && !title.includes(q)) {
        return false;
      }
    }

    if (globalSession) {
      const [yearStr, termStr] = globalSession.split('-');
      if (off.academicYear !== Number(yearStr) || off.term?.toLowerCase() !== termStr?.toLowerCase()) {
        return false;
      }
    }

    if (globalInstructor) {
      if (off.instructorId !== globalInstructor) {
        return false;
      }
    }

    if (globalCategory) {
      const offDocs = allDocs.filter(d => d.offeringId === off.id && d.isCurrent);
      const hasCategoryDoc = offDocs.some(d => d.category === globalCategory);

      if (globalCategoryStatus === 'missing') {
        if (hasCategoryDoc) return false;
      } else if (globalCategoryStatus === 'present') {
        if (!hasCategoryDoc) return false;
      }
    }

    if (onlyCore8Filter) {
      const code = off.course?.code?.toUpperCase() || '';
      if (!CORE_8_CSE_COURSE_CODES.includes(code as any)) {
        return false;
      }
    }

    return true;
  });

  // Auto-reset Course Directory pagination on filter change
  useEffect(() => {
    setOfferingsPage(1);
  }, [globalCourseCode, globalSession, globalInstructor, globalCategory, globalCategoryStatus, onlyCore8Filter]);

  const offeringsTotalPages = Math.max(1, Math.ceil(filteredOfferings.length / offeringsPageSize));
  const paginatedOfferings = filteredOfferings.slice((offeringsPage - 1) * offeringsPageSize, offeringsPage * offeringsPageSize);

  const matchingFilteredDocs = allDocs.filter(doc => {
    const matchingOffering = filteredOfferings.find(o => o.id === doc.offeringId);
    if (!matchingOffering) return false;
    if (globalCategory && doc.category !== globalCategory) return false;
    return doc.isCurrent;
  });

  const handleViewFilteredDocsInArchive = () => {
    clearArchiveFilters();
    if (globalCourseCode) {
      setArchiveSearch(globalCourseCode);
    }
    if (globalCategory) {
      setArchiveCategoryFilter(globalCategory);
    }
    if (globalSession) {
      const [yearStr, termStr] = globalSession.split('-');
      setArchiveYearFilter(yearStr);
      setArchiveTermFilter(termStr as Term);
    }
    setActiveTab('archive');
    setSelectedOffering(null);
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-primary-muted">
        <RefreshCw className="w-12 h-12 animate-spin text-brand mb-4" />
        <p className="text-sm font-mono tracking-wider text-tertiary">CONNECTING TO COURSE FILE ARCHIVE...</p>
      </div>
    );
  }

  // --- LOGIN VIEW ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 text-secondary-muted font-sans antialiased">
        <div className="max-w-md w-full mx-auto space-y-4 my-auto">
          {/* Header Theme Toggle */}
          <div className="absolute top-4 right-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-tertiary hover:text-primary transition rounded-full hover:bg-surface-hover shrink-0 cursor-pointer"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-13 h-13 rounded-2xl bg-brand shadow-lg shadow-brand/20 mb-2.5">
              <Database className="w-6.5 h-6.5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-primary tracking-tight">Course File Archive</h2>
            <p className="mt-0.5 text-xs text-tertiary">
              East West University Course Portfolio System
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-surface border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
            
            {/* GOOGLE SIGN-IN SECTION */}
            <div className="flex flex-col items-center justify-center pt-1">
              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleOAuthSuccess}
                  onError={handleOAuthError}
                  theme={theme === 'dark' ? 'filled_black' : 'outline'}
                  size="large"
                  text="continue_with"
                  shape="pill"
                  width="320"
                  auto_select={true}
                  useOneTap={true}
                />
              </div>
            </div>

            {/* DIVIDER */}
            <div className="relative flex items-center justify-center my-2">
              <div className="flex-grow border-t border-slate-300/80 dark:border-slate-700/80"></div>
              <span className="flex-shrink mx-4 text-xs font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase font-medium">
                OR QUICK SELECT A DEMO ROLE
              </span>
              <div className="flex-grow border-t border-slate-300/80 dark:border-slate-700/80"></div>
            </div>

            {/* ERROR BANNER */}
            {loginError && (
              <div className="p-3 bg-error-subtle border border-error-divider rounded-xl text-xs text-error-muted flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-error mt-0.5" />
                <div className="flex-1 font-medium">{loginError}</div>
              </div>
            )}

            {/* DEMO ROLES GRID (2x2) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* System Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@university.edu')}
                className="p-4 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-2xl text-left transition-all duration-150 cursor-pointer group shadow-2xs"
              >
                <div className="font-bold text-primary text-sm tracking-tight group-hover:text-brand transition-colors">
                  System Admin
                </div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                  admin@university.edu
                </div>
              </button>

              {/* Department Head */}
              <button
                type="button"
                onClick={() => handleQuickLogin('head@university.edu')}
                className="p-4 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-2xl text-left transition-all duration-150 cursor-pointer group shadow-2xs"
              >
                <div className="font-bold text-primary text-sm tracking-tight group-hover:text-brand transition-colors">
                  Department Head
                </div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                  head@university.edu
                </div>
              </button>

              {/* Dr. Alice Smith */}
              <button
                type="button"
                onClick={() => handleQuickLogin('alice@university.edu')}
                className="p-4 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-2xl text-left transition-all duration-150 cursor-pointer group shadow-2xs"
              >
                <div className="font-bold text-primary text-sm tracking-tight group-hover:text-brand transition-colors">
                  Dr. Alice Smith
                </div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                  alice@university.edu
                </div>
              </button>

              {/* Board Auditor / Coordinator */}
              <button
                type="button"
                onClick={() => handleQuickLogin('auditor@university.edu')}
                className="p-4 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-2xl text-left transition-all duration-150 cursor-pointer group shadow-2xs"
              >
                <div className="font-bold text-primary text-sm tracking-tight group-hover:text-brand transition-colors">
                  Board Auditor / Coordinator
                </div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                  auditor@university.edu
                </div>
              </button>
            </div>

            {/* EXPANDABLE SECTION FOR MANUAL PASSWORD LOGIN & EWU FACULTY */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowManualLogin(!showManualLogin)}
                className="w-full flex items-center justify-between text-2xs font-medium text-tertiary hover:text-primary transition py-1 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-brand" /> Sign in with Email / Password
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showManualLogin ? 'rotate-180 text-brand' : ''}`} />
              </button>

              {showManualLogin && (
                <div className="mt-3 space-y-4 animate-fade-in pt-1">
                  {/* SIGN IN FORM */}
                  {authMode === 'login' ? (
                    <form onSubmit={handleEmailPasswordLogin} className="space-y-3.5">
                      <div>
                        <label htmlFor="login-email" className="block text-xs font-medium text-secondary mb-1">
                          University Email
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-quaternary text-xs">
                            @
                          </span>
                          <input
                            id="login-email"
                            type="email"
                            required
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="instructor@ewubd.edu"
                            className="w-full bg-background border border-subtle rounded-xl py-2 pl-8 pr-3 text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-xs transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="login-password" className="block text-xs font-medium text-secondary mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-quaternary">
                            <KeyRound className="w-3.5 h-3.5" />
                          </span>
                          <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Enter password"
                            className="w-full bg-background border border-subtle rounded-xl py-2 pl-8 pr-9 text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-xs transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-quaternary hover:text-primary transition cursor-pointer"
                            title={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isAuthSubmitting}
                        className="w-full flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-hover text-white font-semibold py-2.5 px-4 rounded-xl transition shadow-md shadow-brand/15 cursor-pointer text-xs disabled:opacity-50"
                      >
                        {isAuthSubmitting ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                        {isAuthSubmitting ? 'Verifying...' : 'Sign In with Password'}
                      </button>

                      <div className="text-center pt-1 text-xs text-tertiary">
                        Don&apos;t have an account?{' '}
                        <button
                          type="button"
                          onClick={() => { setAuthMode('register'); setLoginError(''); }}
                          className="text-brand hover:text-brand-hover font-semibold hover:underline cursor-pointer"
                        >
                          Create one
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* CREATE ACCOUNT FORM */
                    <form onSubmit={handleRegister} className="space-y-3">
                      <div>
                        <label htmlFor="reg-name" className="block text-xs font-medium text-secondary mb-1">
                          Full Name
                        </label>
                        <input
                          id="reg-name"
                          type="text"
                          required
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          placeholder="e.g. Dr. Jane Doe"
                          className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-xs transition"
                        />
                      </div>

                      <div>
                        <label htmlFor="reg-email" className="block text-xs font-medium text-secondary mb-1">
                          University Email
                        </label>
                        <input
                          id="reg-email"
                          type="email"
                          required
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          placeholder="e.g. jane@ewubd.edu"
                          className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-xs transition"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label htmlFor="reg-role" className="block text-xs font-medium text-secondary mb-1">
                            Role
                          </label>
                          <select
                            id="reg-role"
                            value={registerRole}
                            onChange={(e) => setRegisterRole(e.target.value as UserRole)}
                            className="w-full bg-background border border-subtle rounded-xl py-2 px-2.5 text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-xs transition"
                          >
                            <option value={UserRole.INSTRUCTOR}>Course Instructor</option>
                            <option value={UserRole.DEPT_HEAD}>Department Head</option>
                            <option value={UserRole.AUDITOR}>Auditor</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="reg-dept" className="block text-xs font-medium text-secondary mb-1">
                            Department
                          </label>
                          <input
                            id="reg-dept"
                            type="text"
                            value={registerDept}
                            onChange={(e) => setRegisterDept(e.target.value)}
                            placeholder="e.g. CSE"
                            className="w-full bg-background border border-subtle rounded-xl py-2 px-2.5 text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-xs transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="reg-password" className="block text-xs font-medium text-secondary mb-1">
                          Password <span className="text-3xs text-quaternary">(min 6 chars)</span>
                        </label>
                        <div className="relative">
                          <input
                            id="reg-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-background border border-subtle rounded-xl py-2 pl-3 pr-9 text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-xs transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-quaternary hover:text-primary transition cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isAuthSubmitting}
                        className="w-full flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-hover text-white font-semibold py-2.5 px-4 rounded-xl transition shadow-md shadow-brand/15 cursor-pointer text-xs disabled:opacity-50 mt-1"
                      >
                        {isAuthSubmitting ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                        {isAuthSubmitting ? 'Creating Account...' : 'Register & Sign In'}
                      </button>

                      <div className="text-center pt-1 text-xs text-tertiary">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => { setAuthMode('login'); setLoginError(''); }}
                          className="text-brand hover:text-brand-hover font-semibold hover:underline cursor-pointer"
                        >
                          Sign in
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Data Entry Assistant Quick Login */}
                  <div className="pt-2 border-t border-divider">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('data-entry@ewubd.edu')}
                      className="w-full flex items-center justify-between p-2.5 bg-brand/5 hover:bg-brand/10 border border-brand/20 hover:border-brand/40 rounded-xl text-left transition cursor-pointer text-2xs"
                    >
                      <div>
                        <div className="font-semibold text-brand flex items-center gap-1">⚡ Data Entry Assistant</div>
                        <div className="text-quaternary font-mono text-3xs mt-0.5">Upload access for all courses</div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-brand" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-quaternary font-mono mt-4">
          Course File Archive • University Portfolio & Accreditation Management
        </div>
      </div>
    );
  }

  // --- LOGGED IN INTERFACE ---
  return (
    <div className="min-h-screen bg-background text-primary font-sans flex flex-col antialiased">
      {/* Top Banner Notifications */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl transition duration-300 animate-slide-in ${
          notification.type === 'success' ? 'bg-surface border-l-4 border-success text-primary-muted' :
          notification.type === 'error' ? 'bg-surface border-l-4 border-error text-primary-muted' :
          'bg-surface border-l-4 border-brand text-primary-muted'
        }`}>
          {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-success" />}
          {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-error" />}
          {notification.type === 'info' && <Info className="w-5 h-5 text-brand-muted" />}
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Header Navbar */}
      <header className="bg-surface/90 backdrop-blur-md border-b border-subtle px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-xs min-h-[58px] sm:min-h-[64px] shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile navigation toggle */}
          <button
            type="button"
            onClick={() => setShowMobileMenu(prev => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={showMobileMenu}
            className="md:hidden p-2 text-tertiary hover:text-primary rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center hover:bg-surface-hover transition cursor-pointer shrink-0"
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-500/25 shrink-0">
            <span className="text-xs sm:text-sm">CFA</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-bold leading-tight text-primary truncate">
              Course File Archive
            </h1>
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-quaternary font-semibold truncate hidden xs:block">UNIVERSITY COURSE ARCHIVE MANAGEMENT</p>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 text-tertiary hover:text-primary transition rounded-full hover:bg-surface-hover shrink-0 min-h-[38px] min-w-[38px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Toggle dark/light theme"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotificationDrawer(prev => !prev)}
              className="relative p-2 sm:p-2.5 text-tertiary hover:text-primary transition rounded-full hover:bg-surface-hover shrink-0 cursor-pointer min-h-[38px] min-w-[38px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center"
              aria-label={`Notifications, ${unreadNotifCount} unread`}
              title="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] sm:text-xs font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </span>
              )}
            </button>

            {/* Notification Flyout Drawer */}
            {showNotificationDrawer && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Notification Center"
                className="absolute right-0 mt-3 w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm bg-surface text-primary border border-subtle shadow-2xl rounded-2xl p-4 z-50 animate-slide-in"
              >
                <div className="flex items-center justify-between pb-3 border-b border-subtle">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-brand" />
                    <h3 className="font-bold text-sm text-primary">Notifications</h3>
                    {unreadNotifCount > 0 && (
                      <span className="bg-rose-500/10 text-rose-500 text-xs font-bold font-mono px-2 py-0.5 rounded-full border border-rose-500/20">
                        {unreadNotifCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {notificationsList.length > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                        className="text-xs font-semibold text-brand hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowNotificationDrawer(false)}
                      className="p-1 text-quaternary hover:text-primary rounded-lg cursor-pointer"
                      aria-label="Close notification drawer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 max-h-80 overflow-y-auto space-y-2 pr-1">
                  {notificationsList.length === 0 ? (
                    <div className="py-8 text-center text-tertiary">
                      <Bell className="w-8 h-8 mx-auto opacity-30 mb-2" />
                      <p className="text-xs">No notifications right now.</p>
                    </div>
                  ) : (
                    notificationsList.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkNotificationRead(n.id, n.linkOfferingId)}
                        className={`p-3 rounded-xl border transition flex items-start gap-3 cursor-pointer group ${
                          !n.isRead 
                            ? 'bg-brand/5 border-brand/20 shadow-xs' 
                            : 'bg-background hover:bg-surface-hover border-subtle opacity-75'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {n.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                          {n.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                          {n.type === 'action_required' && <Zap className="w-4 h-4 text-rose-500 animate-bounce" />}
                          {n.type === 'info' && <Info className="w-4 h-4 text-indigo-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className={`text-xs font-bold truncate ${!n.isRead ? 'text-primary' : 'text-secondary'}`}>
                              {n.title}
                            </h4>
                            <span className="text-xs text-quaternary font-mono shrink-0">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-tertiary line-clamp-2 mt-0.5">
                            {n.message}
                          </p>
                          {n.linkOfferingId && (
                            <span className="text-xs text-brand font-bold mt-1 inline-flex items-center gap-1 group-hover:underline">
                              View Course File &rarr;
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(n.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-quaternary hover:text-rose-500 p-1 transition cursor-pointer"
                          title="Dismiss notification"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => openRoleManual(currentUser.role)}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-surface hover:bg-surface-hover text-secondary hover:text-brand border border-subtle rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
            title="Open Role Operating Manual & SOP Guide"
          >
            <HelpCircle className="w-4 h-4 text-brand" />
            <span className="hidden sm:inline">Role Guide</span>
          </button>

          <div 
            onClick={() => openRoleManual(currentUser.role)}
            className="flex items-center gap-2 sm:gap-3 border-l border-subtle pl-2 sm:pl-4 h-9 cursor-pointer hover:opacity-85 transition"
            title="Click to view your Role Manual & Responsibilities"
          >
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-primary truncate max-w-[130px]">{currentUser.name}</p>
              <p className="text-[11px] text-tertiary font-semibold truncate max-w-[130px]">
                {currentUser.role === UserRole.ADMIN ? 'System Administrator' :
                 currentUser.role === UserRole.DEPT_HEAD ? 'Lead Reviewer (Dept Head)' :
                 currentUser.role === UserRole.AUDITOR ? 'Board Auditor' :
                 'Lead Instructor'}
              </p>
            </div>
            {currentUser.avatarUrl && !currentUser.avatarUrl.includes('unsplash.com') ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-border-subtle shadow-sm object-cover" />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/30 text-brand border border-brand/20 flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                {currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 sm:p-2 hover:bg-surface-hover text-quaternary hover:text-primary-muted rounded-lg transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      <div className="flex-grow flex flex-col md:flex-row">
        {/* Mobile Backdrop */}
        {showMobileMenu && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
            onClick={() => setShowMobileMenu(false)}
            aria-hidden="true"
          />
        )}

        {/* Navigation Sidebar */}
        <aside
          aria-label="Sidebar Navigation"
          className={`${
            showMobileMenu
              ? 'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-2xl flex'
              : 'hidden md:flex'
          } w-full md:w-64 bg-slate-900/95 dark:bg-[#0b0f1a] text-slate-300 border-b md:border-b-0 md:border-r border-slate-800 dark:border-white/5 p-4 shrink-0 flex-col justify-between transition-all duration-200`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between md:hidden pb-3 border-b border-slate-700/50">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Navigation Menu</span>
              <button
                type="button"
                onClick={() => setShowMobileMenu(false)}
                className="p-1.5 text-quaternary hover:text-white rounded-lg cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav aria-label="Main Navigation" className="space-y-1">
              <p className="text-xs font-bold text-tertiary uppercase tracking-widest px-3 mb-3">Active Offerings</p>
              
              <button
                onClick={() => {
                  setActiveTab('courses');
                  setSelectedOffering(null);
                  setSelectedYear(null);
                  setSelectedTerm(null);
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'courses' ? 'bg-brand/20 text-white border border-brand/35 shadow-xs shadow-indigo-500/10 font-bold' : 'text-quaternary hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4" /> Course Directory
                </span>
                <span className="bg-white/10 text-quaternary-light px-1.5 py-0.5 rounded text-xs font-mono">{courses.length}</span>
              </button>

              {(currentUser.role === UserRole.INSTRUCTOR || currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DEPT_HEAD || offerings.some(o => o.instructorId === currentUser.id)) && (
                <button
                  onClick={() => { setActiveTab('desk'); setSelectedOffering(null); setShowMobileMenu(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'desk' ? 'bg-brand/20 text-white border border-brand/35 shadow-xs shadow-indigo-500/10 font-bold' : 'text-quaternary hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4" /> My Assigned Courses
                  </span>
                  <span className="bg-success/20 text-success-bold px-1.5 py-0.5 rounded text-xs font-mono">
                    {offerings.filter(o => o.instructorId === currentUser.id).length}
                  </span>
                </button>
              )}

              {(currentUser.role === UserRole.DEPT_HEAD || currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.AUDITOR) && (
                <button
                  onClick={() => { setActiveTab('review'); setSelectedOffering(null); setShowMobileMenu(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'review' ? 'bg-brand/20 text-white border border-brand/35 shadow-xs shadow-indigo-500/10 font-bold' : 'text-quaternary hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <ListChecks className="w-4 h-4" /> Missing Docs & Review
                  </span>
                  {(() => {
                    const accOfferings = getAccessibleOfferings();
                    const pendingRemindersCount = accOfferings.filter(o => getOfferingMissingCategories(o.id).length > 0).length;
                    return pendingRemindersCount > 0 ? (
                      <span className="bg-rose-500/25 text-rose-300 font-bold px-1.5 py-0.5 rounded text-xs font-mono border border-rose-500/30">
                        {pendingRemindersCount} pending
                      </span>
                    ) : (
                      <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono">
                        100% OK
                      </span>
                    );
                  })()}
                </button>
              )}

              <button
                onClick={() => { setActiveTab('archive'); setSelectedOffering(null); setShowMobileMenu(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'archive' ? 'bg-brand/20 text-white border border-brand/35 shadow-xs shadow-indigo-500/10 font-bold' : 'text-quaternary hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4" /> Document Catalog
                </span>
                <span className="bg-white/10 text-quaternary-light px-1.5 py-0.5 rounded text-xs font-mono">{documents.length}</span>
              </button>

              {currentUser.role === UserRole.ADMIN && (
                <button
                  onClick={() => { setActiveTab('ledger'); setSelectedOffering(null); setShowMobileMenu(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'ledger' ? 'bg-brand/20 text-white border border-brand/35 shadow-xs shadow-indigo-500/10 font-bold' : 'text-quaternary hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4" /> Activity Log
                  </span>
                  <span className="bg-white/10 text-quaternary-light px-1.5 py-0.5 rounded text-xs font-mono">{auditLogs.length}</span>
                </button>
              )}

              {currentUser.role === UserRole.ADMIN && (
                <button
                  onClick={() => { setActiveTab('users'); setSelectedOffering(null); setShowMobileMenu(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'users' ? 'bg-brand/20 text-white border border-brand/35 shadow-xs shadow-indigo-500/10 font-bold' : 'text-quaternary hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <User className="w-4 h-4" /> User Directory
                  </span>
                  <span className="bg-white/10 text-quaternary-light px-1.5 py-0.5 rounded text-xs font-mono">{usersList.length}</span>
                </button>
              )}

              {currentUser.role === UserRole.ADMIN && (
                <button
                  onClick={() => { setActiveTab('categories'); setSelectedOffering(null); setShowMobileMenu(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'categories' ? 'bg-brand/20 text-white border border-brand/35 shadow-xs shadow-indigo-500/10 font-bold' : 'text-quaternary hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <SlidersHorizontal className="w-4 h-4" /> Document Categories
                  </span>
                  <span className="bg-white/10 text-quaternary-light px-1.5 py-0.5 rounded text-xs font-mono">
                    {categoriesList.filter(c => c.isActive !== false).length}
                  </span>
                </button>
              )}

              {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DEPT_HEAD) && (
                <button
                  onClick={() => { setActiveTab('trash'); setSelectedOffering(null); setShowMobileMenu(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'trash' ? 'bg-brand/20 text-white border border-brand/35 shadow-xs shadow-indigo-500/10 font-bold' : 'text-quaternary hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Trash2 className="w-4 h-4" /> Deleted Files
                  </span>
                  {trashDocuments.length > 0 ? (
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded text-xs font-mono">
                      {trashDocuments.length}
                    </span>
                  ) : (
                    <span className="bg-white/10 text-quaternary-light px-1.5 py-0.5 rounded text-xs font-mono">0</span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  openRoleManual(currentUser.role);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold text-quaternary hover:text-white hover:bg-white/5 transition cursor-pointer"
                title="View Role Operating Manual & SOP Guide"
              >
                <span className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-indigo-400" /> Role Guide & SOP
                </span>
                <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono">SOP</span>
              </button>
            </nav>
          </div>

          {/* System Status sidebar footer */}
          <div className="mt-auto p-3.5 bg-inverse-surface rounded-xl border border-slate-700/50 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">System Online</span>
            </div>
            <p className="text-xs text-quaternary leading-normal">
              Course File Archive Service • All systems operational
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow p-3.5 sm:p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto overflow-x-hidden">
          
          {currentUser.pendingApproval && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl p-5 mb-6 border border-amber-400/20 shadow-lg shadow-amber-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-150 animate-pulse" />
                  <h3 className="font-bold text-sm tracking-wide uppercase font-mono">Pending Account Approval</h3>
                </div>
                <p className="text-xs text-amber-50">
                  Your academic staff account has been successfully created, but is currently awaiting System Administrator approval before full system activation.
                </p>
                <p className="text-xs text-amber-100/85 font-mono">
                  Default Role Assigned: {currentUser.role.toUpperCase()} • Department: {currentUser.department || 'PENDING ASSIGNMENT'}
                </p>
              </div>
              <span className="bg-white/10 text-white text-xs font-mono font-bold tracking-wider px-3 py-1 rounded-full shrink-0 uppercase border border-white/10">
                Awaiting Verification
              </span>
            </div>
          )}
          
          {/* --- TAB 1: COURSES & OFFERINGS --- */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              {/* Top registration and control section for administrators */}
              {selectedOffering === null && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-primary">University Course Directory</h2>
                    <p className="text-xs text-tertiary mt-1">
                      Manage standard curricula catalog and create academic term offerings for course folders.
                    </p>
                  </div>
                  {currentUser.role === UserRole.ADMIN && (
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <button
                        onClick={() => setShowAddCourse(true)}
                        className="inline-flex items-center gap-2 bg-surface hover:bg-background text-secondary font-semibold px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[44px] rounded-xl text-xs transition border border-subtle shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-tertiary" /> Register Course
                      </button>
                      <button
                        onClick={() => {
                          if (courses.length === 0) {
                             showNotification('Please register a course first', 'info');
                             return;
                          }
                          setShowAddOffering(true);
                        }}
                        className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-semibold px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[44px] rounded-xl text-xs transition shadow-md shadow-indigo-600/10 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Create Term Offering
                      </button>
                      <button
                        onClick={() => {
                          if (selectedOffering) {
                            setGlobalBulkOfferingId((selectedOffering as CourseOffering).id);
                          }
                          setShowBulkUploadModal(true);
                        }}
                        className="inline-flex items-center gap-2 bg-brand/10 hover:bg-brand/20 text-brand-bold font-semibold px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[44px] rounded-xl text-xs transition border border-brand/20 shadow-sm cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4 text-brand" /> Bulk Upload Files
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Compact Core 8 Benchmark Quick Filter Bar */}
              {selectedOffering === null && (
                <div className="flex flex-wrap items-center justify-between gap-2 bg-surface border border-subtle rounded-xl px-3.5 py-2 text-xs shadow-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOnlyCore8Filter(prev => !prev)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition cursor-pointer border ${
                        onlyCore8Filter
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/20'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${onlyCore8Filter ? 'fill-white' : 'text-amber-500 fill-amber-500'}`} />
                      <span>{onlyCore8Filter ? 'Core 8 Active' : 'Filter Core 8'}</span>
                    </button>

                    <div className="h-4 w-px bg-subtle hidden sm:block"></div>

                    <div className="flex flex-wrap items-center gap-1">
                      {CORE_8_CSE_BENCHMARKS.map((item) => {
                        const isSelected = globalCourseCode.toUpperCase() === item.code;
                        return (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setGlobalCourseCode('');
                              } else {
                                setGlobalCourseCode(item.code);
                                setBrowseMode('global');
                              }
                            }}
                            className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold transition-all border cursor-pointer ${
                              isSelected
                                ? 'bg-brand text-white border-brand shadow-xs shadow-indigo-500/25'
                                : 'bg-background/80 hover:bg-surface-hover text-secondary hover:text-primary border-subtle hover:border-subtle-hover'
                            }`}
                            title={`${item.code}: ${item.title}`}
                          >
                            {item.code}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCore8HubModal(true)}
                    className="text-tertiary hover:text-primary text-xs font-semibold flex items-center gap-1 cursor-pointer ml-auto transition"
                    title="View Core 8 Syllabus Matrix & Program Outcomes"
                  >
                    <Info className="w-3.5 h-3.5 text-brand" />
                    <span>Matrix</span>
                  </button>
                </div>
              )}

              {/* Toggle/Switch for Structured vs Global browse mode */}
              {selectedOffering === null && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DEPT_HEAD) && (
                <div className="flex bg-surface-hover/80 p-1 rounded-xl w-fit border border-subtle backdrop-blur-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setBrowseMode('global');
                      setSelectedYear(null);
                      setSelectedTerm(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      browseMode === 'global'
                        ? 'bg-surface text-primary shadow-sm border border-subtle font-bold'
                        : 'text-tertiary hover:text-primary'
                    }`}
                  >
                    Global Search & Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBrowseMode('structured');
                      setSelectedYear(null);
                      setSelectedTerm(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      browseMode === 'structured'
                        ? 'bg-surface text-primary shadow-sm border border-subtle font-bold'
                        : 'text-tertiary hover:text-primary'
                    }`}
                  >
                    Structured Browse (Year/Term)
                  </button>
                </div>
              )}

              {selectedOffering === null && browseMode === 'global' && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DEPT_HEAD) ? (
                <div className="space-y-6">
                  {/* Global search/filter bar component */}
                  <div className="bg-surface border border-subtle rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between border-b border-divider pb-3 gap-3">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-brand-muted" />
                        <span className="text-xs font-bold uppercase tracking-wider text-secondary">Course Portfolio Filters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {(globalCourseCode || globalSession || globalInstructor || globalCategory || globalCategoryStatus !== 'all') && (
                          <button
                            onClick={() => {
                              setGlobalCourseCode('');
                              setGlobalSession('');
                              setGlobalInstructor('');
                              setGlobalCategory('');
                              setGlobalCategoryStatus('all');
                            }}
                            className="text-xs font-bold text-brand hover:text-brand-bolder transition cursor-pointer font-mono min-h-[44px] flex items-center px-2"
                          >
                            CLEAR ALL
                          </button>
                        )}
                        <button 
                           onClick={() => setShowMobileFilters(!showMobileFilters)}
                           className="md:hidden p-2 bg-surface-hover rounded-lg text-secondary-muted min-h-[44px] flex items-center justify-center min-w-[44px]"
                        >
                           <ChevronDown className={`w-4 h-4 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <div className={`md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 ${showMobileFilters ? 'block space-y-4 md:space-y-0' : 'hidden'}`}>
                      {/* Course Code Filter */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-tertiary uppercase tracking-wider">
                          Course Code
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-quaternary" />
                          <input
                            type="text"
                            value={globalCourseCode}
                            onChange={(e) => setGlobalCourseCode(e.target.value)}
                            placeholder="e.g. CSE101"
                            className="w-full bg-background border border-subtle rounded-xl py-2 pl-9 pr-3 text-primary-muted placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>

                      {/* Academic Session Filter */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-tertiary uppercase tracking-wider">
                          Academic Session
                        </label>
                        <select
                          value={globalSession}
                          onChange={(e) => setGlobalSession(e.target.value)}
                          className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary-muted text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="">All Sessions</option>
                          {uniqueSessions.map((session) => (
                            <option key={session.value} value={session.value}>
                              {session.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Instructor Filter */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-tertiary uppercase tracking-wider">
                          Instructor
                        </label>
                        <select
                          value={globalInstructor}
                          onChange={(e) => setGlobalInstructor(e.target.value)}
                          className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary-muted text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="">All Instructors</option>
                          {instructorsList.map((inst) => (
                            <option key={inst.id} value={inst.id}>
                              {inst.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Document Category Filter */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-tertiary uppercase tracking-wider">
                          Course Document Category
                        </label>
                        <select
                          value={globalCategory}
                          onChange={(e) => {
                            setGlobalCategory(e.target.value);
                            if (!e.target.value) {
                              setGlobalCategoryStatus('all');
                            }
                          }}
                          className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary-muted text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="">All Categories</option>
                          {categoriesList.filter(c => c.isActive !== false).map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Document Category Status Filter */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-tertiary uppercase tracking-wider">
                          Category Status
                        </label>
                        <select
                          value={globalCategoryStatus}
                          onChange={(e) => setGlobalCategoryStatus(e.target.value as any)}
                          disabled={!globalCategory}
                          className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary-muted text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="all">Any Status</option>
                          <option value="missing">Missing Category Doc</option>
                          <option value="present">Uploaded/Present Category Doc</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Course offerings list */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-quaternary font-mono">
                        Active Course Offerings ({filteredOfferings.length})
                      </h3>

                      {(globalCourseCode || globalSession || globalInstructor || globalCategory || globalCategoryStatus !== 'all') && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleViewFilteredDocsInArchive}
                            className="flex items-center gap-1.5 bg-brand-subtle hover:bg-brand/20 text-brand font-mono font-bold px-3 py-1.5 rounded-xl text-xs border border-brand/30 transition cursor-pointer shadow-sm"
                            title="View all files matching these filter criteria in the Document Catalog"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View All Matching Files ({matchingFilteredDocs.length})</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {filteredOfferings.length === 0 ? (
                      <div className="text-center py-16 bg-surface rounded-3xl border border-subtle text-tertiary font-medium">
                        <div className="max-w-xs mx-auto space-y-3">
                          <SlidersHorizontal className="w-8 h-8 text-quaternary-light mx-auto animate-pulse" />
                          <p className="text-sm font-bold text-primary-muted">No Matching Offerings Found</p>
                          <p className="text-xs text-quaternary">Try adjusting your filters or search terms to locate specific university portfolios.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedOfferings.map(off => {
                          const offDocs = allDocs.filter(d => d.offeringId === off.id && d.isCurrent);
                          const activeCore = categoriesList.filter(c => c.isCore && c.isActive !== false).map(c => c.id);
                          const coreList = activeCore.length > 0 ? activeCore : CORE_16_CATEGORIES;
                          const presentCount = coreList.filter(catVal => 
                            offDocs.some(d => d.category === catVal)
                          ).length;
                          const percentComplete = Math.round((presentCount / (coreList.length || 1)) * 100);

                          return (
                            <div
                              key={off.id}
                              onClick={() => setSelectedOffering(off)}
                              className="group bg-surface border border-subtle hover:border-brand/40 rounded-2xl p-5 hover:shadow-lg transition duration-200 cursor-pointer flex flex-col justify-between h-auto min-h-[224px]"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono text-xs font-bold bg-brand-subtle text-brand-bold border border-brand-divider px-2.5 py-1 rounded-lg">
                                      {off.course?.code || 'CSE'}
                                    </span>
                                    <span className="text-xs font-bold bg-surface-hover text-secondary-muted px-2 py-1 rounded-lg uppercase">
                                      {off.term} {off.academicYear}
                                    </span>
                                    {off.course?.code && CORE_8_CSE_COURSE_CODES.includes(off.course.code.toUpperCase() as any) && (
                                      <span className="bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20 text-xs font-bold font-mono px-2 py-0.5 rounded-full flex items-center gap-1" title="8 Core Benchmark Subject">
                                        ★ Core 8
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs font-semibold text-tertiary uppercase tracking-wide bg-surface-hover px-2 py-0.5 rounded">
                                    Sec {off.section}
                                  </span>
                                </div>

                                <h4 className="text-sm font-bold text-primary group-hover:text-brand transition truncate">
                                  {off.course?.title || 'Course Details'}
                                </h4>
                                <p className="text-xs text-tertiary mt-1 truncate">
                                  Instructor: <span className="font-semibold text-secondary">{off.instructor?.name || 'Unassigned'}</span>
                                </p>

                                {globalCategory && (
                                  <div className="mt-3 p-2 bg-background border border-divider rounded-xl flex items-center justify-between text-xs font-semibold">
                                    <span className="text-tertiary font-medium text-xs truncate max-w-[130px]" title={getCategoryLabel(globalCategory)}>
                                      {getCategoryLabel(globalCategory)}
                                    </span>
                                    {(() => {
                                      const catDoc = allDocs.find(d => d.offeringId === off.id && d.category === globalCategory && d.isCurrent);
                                      if (catDoc) {
                                        return (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setShowReviewDoc(catDoc);
                                            }}
                                            className="inline-flex items-center gap-1 text-success-muted font-bold bg-success-subtle hover:bg-success-subtle/80 border border-success-subtle px-2 py-0.5 rounded text-xs uppercase font-mono cursor-pointer transition"
                                            title="Click to view file details"
                                          >
                                            <CheckCircle className="w-3 h-3 text-emerald-500" /> Uploaded (View)
                                          </button>
                                        );
                                      } else {
                                        return (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedOffering(off);
                                              setUploadCategory(globalCategory as DocumentCategory);
                                              setShowUploadDoc(true);
                                            }}
                                            className="inline-flex items-center gap-1 text-error-muted font-bold bg-error-subtle hover:bg-error-subtle/80 border border-error-subtle px-2 py-0.5 rounded text-xs uppercase font-mono cursor-pointer transition"
                                            title="Click to upload missing file"
                                          >
                                            <AlertCircle className="w-3 h-3 text-rose-400" /> Missing (Upload)
                                          </button>
                                        );
                                      }
                                    })()}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2 pt-4 border-t border-divider mt-4">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-tertiary font-medium">Core Checklist</span>
                                  <span className="font-mono text-brand font-bold">{presentCount}/16 Items</span>
                                </div>
                                <div className="w-full bg-surface-hover h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full transition-all duration-300"
                                    style={{ width: `${Math.max(4, percentComplete)}%` }}
                                  ></div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-tertiary font-mono mt-1">
                                  <span>{percentComplete}% Uploaded</span>
                                  <span className="flex items-center gap-0.5 group-hover:text-brand transition font-sans font-semibold">
                                    Open Portfolio <ChevronRight className="w-3 h-3" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {filteredOfferings.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-subtle">
                        <Pagination
                          currentPage={offeringsPage}
                          totalPages={offeringsTotalPages}
                          totalItems={filteredOfferings.length}
                          pageSize={offeringsPageSize}
                          pageSizeOptions={[6, 12, 24, 48]}
                          itemLabel="course offerings"
                          onPageChange={setOfferingsPage}
                          onPageSizeChange={(size) => {
                            setOfferingsPageSize(size);
                            setOfferingsPage(1);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* STEP 1: Academic Year List */}
                  {selectedYear === null && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-quaternary font-mono mb-4">
                          Academic Folders By Year
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {Array.from(new Set(accessibleOfferings.map(o => o.academicYear))).sort((a, b) => Number(b) - Number(a)).map(year => {
                            const yearOfferings = accessibleOfferings.filter(o => o.academicYear === year);
                            const totalOfferings = yearOfferings.length;
                            return (
                              <div
                                key={year}
                                onClick={() => setSelectedYear(year)}
                                className="group bg-surface border border-subtle hover:border-brand/40 rounded-2xl p-6 hover:shadow-lg transition duration-200 cursor-pointer flex flex-col justify-between h-40"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-xs font-bold bg-brand-subtle text-brand-bold border border-brand-divider px-2.5 py-1 rounded-lg">
                                    ACADEMIC SESSION
                                  </span>
                                  <span className="text-xs font-semibold text-tertiary uppercase bg-surface-hover px-2 py-0.5 rounded">
                                    {totalOfferings} {totalOfferings === 1 ? 'Offering' : 'Offerings'}
                                  </span>
                                </div>
                                <div className="mt-4">
                                  <h4 className="text-2xl font-bold text-primary group-hover:text-brand transition flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-brand-muted" /> {year}
                                  </h4>
                                  <p className="text-xs text-tertiary mt-1">
                                    Explore course syllabi, test items, and grades for this year.
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          {accessibleOfferings.length === 0 && (
                            <div className="col-span-full text-center py-12 bg-surface rounded-2xl border border-subtle text-tertiary font-medium">
                              No active academic year sessions recorded.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Term List within Year */}
                  {selectedYear !== null && selectedTerm === null && (
                    <div className="space-y-6">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                          onClick={() => setSelectedYear(null)}
                          className="inline-flex items-center gap-1.5 bg-surface hover:bg-background text-secondary font-semibold px-3 py-1.5 min-h-[44px] rounded-xl text-xs border border-subtle shadow-sm cursor-pointer transition"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Back to Years
                        </button>
                        <div className="h-4 w-px bg-slate-300"></div>
                        <span className="text-xs font-mono font-bold text-quaternary">ACADEMIC YEAR {selectedYear}</span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-quaternary font-mono mb-4">
                          Select Semester Term
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {Array.from(new Set(accessibleOfferings.filter(o => o.academicYear === selectedYear).map(o => o.term))).map(term => {
                            const termOfferings = accessibleOfferings.filter(o => o.academicYear === selectedYear && o.term === term);
                            const totalOfferings = termOfferings.length;
                            return (
                              <div
                                key={term}
                                onClick={() => setSelectedTerm(term as Term)}
                                className="group bg-surface border border-subtle hover:border-brand/40 rounded-2xl p-6 hover:shadow-lg transition duration-200 cursor-pointer flex flex-col justify-between h-40"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-xs font-bold bg-brand-subtle text-brand-bold border border-brand-divider px-2.5 py-1 rounded-lg">
                                    SEMESTER
                                  </span>
                                  <span className="text-xs font-semibold text-tertiary uppercase bg-surface-hover px-2 py-0.5 rounded">
                                    {totalOfferings} {totalOfferings === 1 ? 'Offering' : 'Offerings'}
                                  </span>
                                </div>
                                <div className="mt-4">
                                  <h4 className="text-xl font-bold text-primary group-hover:text-brand transition flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-brand-muted" /> {term} {selectedYear}
                                  </h4>
                                  <p className="text-xs text-tertiary mt-1">
                                    Access portfolio checklists, files and quality audits.
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Course Offering list within term */}
                  {selectedYear !== null && selectedTerm !== null && selectedOffering === null && (
                    <div className="space-y-6">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                          onClick={() => setSelectedTerm(null)}
                          className="inline-flex items-center gap-1.5 bg-surface hover:bg-background text-secondary font-semibold px-3 py-1.5 min-h-[44px] rounded-xl text-xs border border-subtle shadow-sm cursor-pointer transition"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Back to Terms
                        </button>
                        <div className="h-4 w-px bg-slate-300"></div>
                        <span className="text-xs font-mono font-bold text-quaternary">
                          {selectedYear} • {selectedTerm.toUpperCase()} SEMESTER
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-quaternary font-mono mb-4">
                          Active Course Offerings
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {accessibleOfferings
                            .filter(o => o.academicYear === selectedYear && o.term?.toLowerCase() === selectedTerm?.toLowerCase() && (!onlyCore8Filter || CORE_8_CSE_COURSE_CODES.includes(o.course?.code?.toUpperCase() as any)))
                            .map(off => {
                              const offDocs = allDocs.filter(d => d.offeringId === off.id && d.isCurrent);
                              const activeCore = categoriesList.filter(c => c.isCore && c.isActive !== false).map(c => c.id);
                              const coreList = activeCore.length > 0 ? activeCore : CORE_16_CATEGORIES;
                              const presentCount = coreList.filter(catVal => 
                                offDocs.some(d => d.category === catVal)
                              ).length;
                              const percentComplete = Math.round((presentCount / (coreList.length || 1)) * 100);

                              return (
                                <div
                                  key={off.id}
                                  onClick={() => setSelectedOffering(off)}
                                  className="group bg-surface border border-subtle hover:border-brand/40 rounded-2xl p-5 hover:shadow-lg transition duration-200 cursor-pointer flex flex-col justify-between h-56"
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-mono text-xs font-bold bg-brand-subtle text-brand-bold border border-brand-divider px-2.5 py-1 rounded-lg">
                                          {off.course?.code || 'CSE'}
                                        </span>
                                        {off.course?.code && CORE_8_CSE_COURSE_CODES.includes(off.course.code.toUpperCase() as any) && (
                                          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20 text-xs font-bold font-mono px-2 py-0.5 rounded-full flex items-center gap-1" title="8 Core Benchmark Subject">
                                            ★ Core 8
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs font-semibold text-tertiary uppercase tracking-wide bg-surface-hover px-2 py-0.5 rounded">
                                        Section {off.section}
                                      </span>
                                    </div>

                                    <h4 className="text-sm font-bold text-primary group-hover:text-brand transition truncate">
                                      {off.course?.title || 'Course Details'}
                                    </h4>
                                    <p className="text-xs text-tertiary mt-1 truncate">
                                      Instructor: <span className="font-semibold text-secondary">{off.instructor?.name || 'Unassigned'}</span>
                                    </p>
                                  </div>

                                  
                                  
                                  <div className="space-y-2 pt-4 border-t border-divider">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-tertiary font-medium">Core Checklist</span>
                                      <span className="font-mono text-brand font-bold">{presentCount}/16 Items</span>
                                    </div>
                                    <div className="w-full bg-surface-hover h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="bg-brand h-full transition-all duration-300"
                                        style={{ width: `${Math.max(4, percentComplete)}%` }}
                                      ></div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-xs text-tertiary font-mono mt-1">
                                      <span>{percentComplete}% Uploaded</span>
                                      <span className="flex items-center gap-0.5 group-hover:text-brand transition font-sans font-semibold">
                                        Open Portfolio <ChevronRight className="w-3 h-3" />
                                      </span>
                                    </div>
                                    
                                    {/* Quick Actions */}
                                    <div className="pt-3 flex gap-2">
                                      {(currentUser?.role === UserRole.INSTRUCTOR || currentUser?.role === UserRole.ADMIN) && off.instructorId === currentUser?.id && (
                                        <button 
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setSelectedOffering(off); 
                                            setTimeout(() => {
                                              const fileInput = document.getElementById('real-file-upload');
                                              if (fileInput) fileInput.click();
                                            }, 50);
                                          }}
                                          className="flex-1 bg-surface-hover hover:bg-brand-subtle text-brand hover:text-brand-bold text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1 transition"
                                        >
                                          <Plus className="w-3 h-3" /> Quick Upload
                                        </button>
                                      )}
                                      {(currentUser?.role === UserRole.DEPT_HEAD || currentUser?.role === UserRole.ADMIN) && (
                                        <button 
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            handleExportPackage(off, offDocs, presentCount); 
                                          }}
                                          className="flex-1 bg-surface-hover hover:bg-brand-subtle text-brand hover:text-brand-bold text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1 transition"
                                        >
                                          <FileUp className="w-3 h-3" /> Export
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>

                              );
                            })}
                          {accessibleOfferings.filter(o => o.academicYear === selectedYear && o.term === selectedTerm).length === 0 && (
                            <div className="col-span-full text-center py-12 bg-surface rounded-2xl border border-subtle text-tertiary font-medium">
                              No registered offerings found for this semester.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* STEP 4: Course Offering detail page */}
              {selectedOffering !== null && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => setSelectedOffering(null)}
                      className="inline-flex items-center gap-1.5 bg-surface hover:bg-background text-secondary font-semibold px-3 py-1.5 min-h-[44px] rounded-xl text-xs border border-subtle shadow-sm cursor-pointer transition"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Back to Offerings
                    </button>
                    <div className="h-4 w-px bg-slate-300"></div>
                    <span className="text-xs font-mono font-bold text-quaternary">
                      {selectedOffering.course?.code} • SECTION {selectedOffering.section}
                    </span>
                  </div>

                  {/* Completeness Indicator Block */}
                  {(() => {
                    const offDocs = allDocs.filter(d => d.offeringId === selectedOffering.id && d.isCurrent);
                    const activeCore = categoriesList.filter(c => c.isCore && c.isActive !== false).map(c => c.id);
                    const coreList = activeCore.length > 0 ? activeCore : CORE_16_CATEGORIES;
                    const presentCount = coreList.filter(catVal => 
                      offDocs.some(d => d.category === catVal)
                    ).length;
                    const percentComplete = Math.round((presentCount / (coreList.length || 1)) * 100);

                    return (
                      <div className="space-y-6">
                        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-5 sm:space-y-6">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold bg-brand/20 text-brand-muted px-3 py-1 rounded-xl border border-brand/20">
                                  {selectedOffering.course?.code}
                                </span>
                                <h3 className="text-base sm:text-lg font-bold">{selectedOffering.course?.title}</h3>
                              </div>
                              <p className="text-xs text-slate-300 mt-2">
                                Academic Session: <span className="font-semibold text-white">{selectedOffering.term} {selectedOffering.academicYear}</span> • Section: <span className="font-semibold text-white">{selectedOffering.section}</span> • Department: <span className="font-semibold text-slate-200">{selectedOffering.course?.department}</span>
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 flex-wrap">
                              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-3 sm:px-3.5 py-1.5 rounded-xl">
                                <User className="w-4 h-4 text-indigo-400 shrink-0" />
                                <div className="text-left min-w-0">
                                  <p className="text-[10px] sm:text-xs text-brand-muted font-bold tracking-wider uppercase">INSTRUCTOR</p>
                                  <p className="text-xs font-semibold text-white truncate">{selectedOffering.instructor?.name || 'Unassigned'}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-3 sm:px-3.5 py-1.5 rounded-xl">
                                <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                                <div className="text-left min-w-0">
                                  <p className="text-[10px] sm:text-xs text-amber-300 font-bold tracking-wider uppercase">BOARD AUDITOR</p>
                                  {currentUser.role === UserRole.ADMIN ? (
                                    <select
                                      value={selectedOffering.auditorId || ''}
                                      onChange={async (e) => {
                                        const audId = e.target.value;
                                        try {
                                          const res = await fetch(`/api/offerings/${selectedOffering.id}/auditor`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ auditorId: audId || null })
                                          });
                                          const data = await res.json();
                                          if (res.ok) {
                                            showNotification('Assigned board auditor/coordinator successfully', 'success');
                                            fetchAllData();
                                            setSelectedOffering({ ...selectedOffering, auditorId: audId || undefined });
                                          } else {
                                            showNotification(data.error || 'Failed to assign auditor', 'error');
                                          }
                                        } catch (err) {
                                          showNotification('Network error assigning auditor', 'error');
                                        }
                                      }}
                                      className="bg-inverse-surface border border-slate-700 text-white rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer mt-0.5 max-w-[150px] truncate"
                                    >
                                      <option value="">-- Assign Auditor --</option>
                                      {usersList
                                        .filter(u => u.role === UserRole.AUDITOR)
                                        .map(u => (
                                          <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                  ) : (
                                    <p className="text-xs font-semibold text-white truncate">
                                      {usersList.find(u => u.id === selectedOffering.auditorId)?.name || 'Unassigned'}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                {currentUser && (currentUser.role === UserRole.INSTRUCTOR || currentUser.role === UserRole.ADMIN) && (
                                  <button
                                    onClick={() => {
                                      setGlobalBulkOfferingId(selectedOffering.id);
                                      setShowBulkUploadModal(true);
                                    }}
                                    className="bg-brand/20 hover:bg-brand/30 text-white border border-brand/40 rounded-xl px-3.5 sm:px-4 py-2 text-xs font-semibold flex items-center gap-1.5 sm:gap-2 shadow-sm transition cursor-pointer"
                                  >
                                    <UploadCloud className="w-4 h-4 text-brand-muted" /> Bulk Upload Files
                                  </button>
                                )}

                                {currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DEPT_HEAD) && (
                                  <button
                                    onClick={() => handleExportPackage(selectedOffering, offDocs, presentCount)}
                                    disabled={isExportingId === selectedOffering.id}
                                    className="bg-brand hover:bg-brand-subtle0 text-white border border-brand rounded-xl px-3.5 sm:px-4 py-2 text-xs font-semibold flex items-center gap-1.5 sm:gap-2 shadow-sm transition disabled:opacity-50"
                                  >
                                    {isExportingId === selectedOffering.id ? <Clock className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />} {isExportingId === selectedOffering.id ? 'Exporting...' : 'Export Package'}
                                  </button>
                                )}

                                {/* Signature Action Buttons */}
                                {selectedOffering.submissionStatus !== 'approved' && currentUser && (currentUser.id === selectedOffering.instructorId || currentUser.role === UserRole.ADMIN) && (
                                  <button
                                    onClick={() => openSignatureModal('submit')}
                                    disabled={presentCount < 16}
                                    title={presentCount < 16 ? "All 16 core items must be present to submit." : ""}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-700 rounded-xl px-3.5 sm:px-4 py-2 text-xs font-semibold flex items-center gap-1.5 sm:gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
                                  >
                                    <Shield className="w-4 h-4" /> {selectedOffering.submissionStatus === 'submitted' ? 'Update Submission' : 'Sign & Submit Portfolio'}
                                  </button>
                                )}

                                {selectedOffering.submissionStatus === 'submitted' && currentUser && (currentUser.role === UserRole.DEPT_HEAD || currentUser.role === UserRole.ADMIN) && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        requestConfirmation(
                                          'Request Portfolio Revisions',
                                          'Are you sure you want to send this course portfolio back to the instructor for revisions?',
                                          'Request Revisions',
                                          async () => {
                                            try {
                                              const res = await fetch(`/api/offerings/${selectedOffering.id}/reject`, { method: 'PUT' });
                                              if (res.ok) {
                                                showNotification('Portfolio rejected successfully', 'success');
                                                fetchAllData();
                                                const updated = await res.json();
                                                setSelectedOffering(updated.offering);
                                              }
                                            } catch (e) {
                                              showNotification('Failed to reject portfolio', 'error');
                                            }
                                          },
                                          true
                                        );
                                      }}
                                      className="bg-red-600/20 text-red-500 hover:bg-red-600/30 border border-red-500/30 rounded-xl px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                                    >
                                      <XCircle className="w-4 h-4" /> Reject
                                    </button>
                                    <button
                                      onClick={() => openSignatureModal('approve')}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-700 rounded-xl px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                                    >
                                      <CheckCircle className="w-4 h-4" /> Endorse & Sign
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Signature Status Banner */}
                          {selectedOffering.submissionStatus === 'submitted' && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-4">
                              <Shield className="w-8 h-8 text-amber-500 shrink-0" />
                              <div className="flex-1">
                                <h4 className="text-amber-500 font-bold text-sm">Portfolio Submitted for Review</h4>
                                <p className="text-xs text-amber-200 mt-1">This course portfolio has been digitally signed and submitted by the instructor on <span className="font-semibold">{new Date(selectedOffering.submittedAt || '').toLocaleString()}</span>. It is locked for editing pending Department Head approval.</p>
                              </div>
                              {selectedOffering.submitterSignatureUrl && (
                                <div className="shrink-0 bg-white rounded p-1">
                                  <img src={selectedOffering.submitterSignatureUrl} alt="Instructor Signature" className="h-10 object-contain" />
                                </div>
                              )}
                            </div>
                          )}

                          {selectedOffering.submissionStatus === 'approved' && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-4">
                              <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />
                              <div className="flex-1">
                                <h4 className="text-emerald-500 font-bold text-sm">Portfolio Officially Endorsed & Sealed</h4>
                                <p className="text-xs text-emerald-200 mt-1">This course portfolio was formally endorsed by the Department Head on <span className="font-semibold">{new Date(selectedOffering.approvedAt || '').toLocaleString()}</span>. It is permanently archived.</p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                {selectedOffering.submitterSignatureUrl && (
                                  <div className="bg-white rounded p-1 flex flex-col items-center border border-slate-300">
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Instructor</span>
                                    <img src={selectedOffering.submitterSignatureUrl} alt="Instructor Signature" className="h-8 object-contain" />
                                  </div>
                                )}
                                {selectedOffering.approverSignatureUrl && (
                                  <div className="bg-white rounded p-1 flex flex-col items-center border border-slate-300">
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Dept Head</span>
                                    <img src={selectedOffering.approverSignatureUrl} alt="Approver Signature" className="h-8 object-contain" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {selectedOffering.submissionStatus === 'rejected' && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
                              <XCircle className="w-6 h-6 text-red-500 shrink-0" />
                              <div>
                                <h4 className="text-red-500 font-bold text-sm">Portfolio Revisions Requested</h4>
                                <p className="text-xs text-red-200 mt-0.5">The Department Head has requested revisions for this course file.</p>
                              </div>
                            </div>
                          )}

                          <div className="bg-indigo-950/50 border border-indigo-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="space-y-1">
                              <span className="text-xs uppercase tracking-wider font-bold text-indigo-300 font-mono">
                                Portfolio Completeness
                              </span>
                              <h3 className="text-2xl font-bold text-white font-mono flex items-center gap-2">
                                {presentCount} / 16 items present
                              </h3>
                              <p className="text-xs text-indigo-200">
                                {presentCount === 16 
                                  ? '🎉 Beautiful! All 16 course folder elements are present and compiled!' 
                                  : 'Ensure all 16 core course folder categories are populated for approval.'}
                              </p>
                            </div>
                            <div className="w-full md:w-64 space-y-2 shrink-0">
                              <div className="flex justify-between items-center text-xs font-mono text-indigo-300 font-semibold">
                                <span>Completion Progress</span>
                                <span>{percentComplete}%</span>
                              </div>
                              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
                                  style={{ width: `${percentComplete}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hidden file input for slot picker */}
                        <input
                          type="file"
                          ref={slotFileInputRef}
                          className="hidden"
                          onChange={handleSlotFileChange}
                          accept=".pdf,application/pdf,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        />

                        {/* Empty State First-Time Guidance */}
                        {presentCount === 0 && (
                          <div className="bg-brand/5 border border-brand/20 rounded-2xl p-5 text-center space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto">
                              <FileUp className="w-6 h-6" />
                            </div>
                            <div className="max-w-md mx-auto space-y-1">
                              <h4 className="text-sm font-bold text-primary">Get Started with Your Course Folder</h4>
                              <p className="text-xs text-secondary-muted leading-relaxed">
                                No documents have been uploaded yet. Start by uploading your <strong>Course Outline / Syllabus</strong> or recent assessment questions using the requirement slots below.
                              </p>
                            </div>
                            {currentUser && (currentUser.id === selectedOffering.instructorId || currentUser.role === UserRole.ADMIN) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadCategory('course_outline');
                                  setShowUploadDoc(true);
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition min-h-[44px]"
                              >
                                <Plus className="w-4 h-4" /> Upload Course Outline
                              </button>
                            )}
                          </div>
                        )}

                        {/* Checklist Section */}
                        <div className="bg-surface border border-subtle rounded-2xl p-6 shadow-sm space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-subtle">
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-quaternary flex items-center gap-1.5 font-mono">
                                <Layers className="w-4 h-4 text-brand" /> Course Portfolio Core Requirements (16 slots)
                              </h4>
                              <p className="text-xs text-tertiary mt-0.5">
                                Verify each required slot has an approved item. Use filters below to locate specific requirements.
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {/* 1-Col vs 2-Col View Mode Toggle */}
                              <div className="flex items-center bg-background border border-subtle rounded-xl p-0.5 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => setPortfolioViewColumns('1-col')}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                                    portfolioViewColumns === '1-col'
                                      ? 'bg-brand text-white shadow-xs'
                                      : 'text-secondary hover:text-primary'
                                  }`}
                                  title="1-Column Full Width View"
                                >
                                  <List className="w-3.5 h-3.5" /> 1-Col
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPortfolioViewColumns('2-col')}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                                    portfolioViewColumns === '2-col'
                                      ? 'bg-brand text-white shadow-xs'
                                      : 'text-secondary hover:text-primary'
                                  }`}
                                  title="2-Column Compact Grid (View All 16 Slots on One Screen)"
                                >
                                  <LayoutGrid className="w-3.5 h-3.5" /> 2-Col Grid
                                </button>
                              </div>

                              <div className="relative">
                                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-quaternary" />
                                <input
                                  type="text"
                                  value={portfolioCategorySearch}
                                  onChange={(e) => setPortfolioCategorySearch(e.target.value)}
                                  placeholder="Filter requirements..."
                                  className="bg-background border border-subtle rounded-xl py-1.5 pl-8 pr-7 text-xs text-primary placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand w-36 sm:w-44"
                                />
                                {portfolioCategorySearch && (
                                  <button
                                    onClick={() => setPortfolioCategorySearch('')}
                                    className="absolute right-2 top-2 text-quaternary hover:text-primary cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              <select
                                value={portfolioStatusFilter}
                                onChange={(e) => setPortfolioStatusFilter(e.target.value as any)}
                                className="bg-background border border-subtle rounded-xl py-1.5 px-2.5 text-xs text-secondary focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
                              >
                                <option value="all">All Requirements (16)</option>
                                <option value="uploaded">Uploaded Only</option>
                                <option value="missing">Missing Only</option>
                                <option value="approved">Approved Only</option>
                                <option value="pending">Pending Review</option>
                                <option value="rejected">Rejected Only</option>
                              </select>

                              {(portfolioCategorySearch || portfolioStatusFilter !== 'all') && (
                                <button
                                  onClick={() => {
                                    setPortfolioCategorySearch('');
                                    setPortfolioStatusFilter('all');
                                  }}
                                  className="text-xs text-rose-500 hover:text-rose-600 font-bold underline cursor-pointer px-1"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Selective Batch Selection Toolbar */}
                          <div className="bg-background/80 border border-subtle rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2">
                              <Download className="w-4 h-4 text-brand" />
                              <span className="text-xs font-bold text-primary">Quick Batch Selection:</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const availableDocs = allDocs.filter(d => d.offeringId === selectedOffering.id && d.isCurrent && !d.isDeleted);
                                  setSelectedDocIdsForBatch(new Set(availableDocs.map(d => d.id)));
                                }}
                                className="px-2.5 py-1 text-xs font-semibold bg-surface hover:bg-surface-hover border border-subtle rounded-lg text-primary transition cursor-pointer"
                              >
                                ☑️ Select All Available
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const questionDocs = allDocs.filter(d => 
                                    d.offeringId === selectedOffering.id && d.isCurrent && !d.isDeleted &&
                                    (d.category.includes('question') || d.category === 'projects_list' || d.category === 'lab_experiments_list')
                                  );
                                  setSelectedDocIdsForBatch(new Set(questionDocs.map(d => d.id)));
                                }}
                                className="px-2.5 py-1 text-xs font-semibold bg-surface hover:bg-surface-hover border border-subtle rounded-lg text-primary transition cursor-pointer"
                              >
                                📝 Exam Questions Only
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const sampleDocs = allDocs.filter(d => 
                                    d.offeringId === selectedOffering.id && d.isCurrent && !d.isDeleted && d.category.includes('sample')
                                  );
                                  setSelectedDocIdsForBatch(new Set(sampleDocs.map(d => d.id)));
                                }}
                                className="px-2.5 py-1 text-xs font-semibold bg-surface hover:bg-surface-hover border border-subtle rounded-lg text-primary transition cursor-pointer"
                              >
                                📄 Student Answer Scripts
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const obeDocs = allDocs.filter(d => 
                                    d.offeringId === selectedOffering.id && d.isCurrent && !d.isDeleted &&
                                    ['obe_excel', 'co_attainment', 'po_attainment', 'grade_summary_cqi', 'instructor_feedback'].includes(d.category)
                                  );
                                  setSelectedDocIdsForBatch(new Set(obeDocs.map(d => d.id)));
                                }}
                                className="px-2.5 py-1 text-xs font-semibold bg-surface hover:bg-surface-hover border border-subtle rounded-lg text-primary transition cursor-pointer"
                              >
                                📊 OBE & CQI Reports
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const attDocs = allDocs.filter(d => 
                                    d.offeringId === selectedOffering.id && d.isCurrent && !d.isDeleted && d.category.includes('attendance')
                                  );
                                  setSelectedDocIdsForBatch(new Set(attDocs.map(d => d.id)));
                                }}
                                className="px-2.5 py-1 text-xs font-semibold bg-surface hover:bg-surface-hover border border-subtle rounded-lg text-primary transition cursor-pointer"
                              >
                                🗓️ Attendance Sheets
                              </button>
                              {selectedDocIdsForBatch.size > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedDocIdsForBatch(new Set())}
                                  className="px-2.5 py-1 text-xs font-bold text-rose-500 hover:text-rose-600 underline cursor-pointer"
                                >
                                  Clear ({selectedDocIdsForBatch.size})
                                </button>
                              )}
                            </div>
                          </div>

                          <div className={portfolioViewColumns === '2-col' ? "grid grid-cols-1 lg:grid-cols-2 gap-3" : "space-y-4"}>
                            {OFFICIAL_16_COURSE_FILE_STRUCTURE.filter(slot => {
                              // Check search filter against slot label, id, and all sub-slots
                              if (portfolioCategorySearch) {
                                const q = portfolioCategorySearch.toLowerCase().trim();
                                const matchesMain = slot.label.toLowerCase().includes(q) || slot.id.toLowerCase().includes(q) || slot.number.includes(q);
                                const matchesSub = slot.subSlots?.some(sub => sub.label.toLowerCase().includes(q) || sub.id.toLowerCase().includes(q));
                                const mainDoc = allDocs.find(d => d.offeringId === selectedOffering.id && d.category === slot.id && d.isCurrent);
                                const matchesFile = mainDoc?.fileName?.toLowerCase().includes(q);
                                const matchesSubFile = slot.subSlots?.some(sub => {
                                  const subDoc = allDocs.find(d => d.offeringId === selectedOffering.id && d.category === sub.id && d.isCurrent);
                                  return subDoc?.fileName?.toLowerCase().includes(q);
                                });
                                if (!matchesMain && !matchesSub && !matchesFile && !matchesSubFile) return false;
                              }

                              // Check status filter
                              if (portfolioStatusFilter !== 'all') {
                                const mainDoc = allDocs.find(d => d.offeringId === selectedOffering.id && d.category === slot.id && d.isCurrent);
                                const subDocs = (slot.subSlots || []).map(sub => allDocs.find(d => d.offeringId === selectedOffering.id && d.category === sub.id && d.isCurrent));
                                const allDocsInSlot = [mainDoc, ...subDocs];

                                if (portfolioStatusFilter === 'uploaded') {
                                  if (!allDocsInSlot.some(Boolean)) return false;
                                } else if (portfolioStatusFilter === 'missing') {
                                  if (!allDocsInSlot.some(d => !d)) return false;
                                } else if (portfolioStatusFilter === 'approved') {
                                  if (!allDocsInSlot.some(d => d && d.status === 'approved')) return false;
                                } else if (portfolioStatusFilter === 'pending') {
                                  if (!allDocsInSlot.some(d => d && d.status === 'pending_review')) return false;
                                } else if (portfolioStatusFilter === 'rejected') {
                                  if (!allDocsInSlot.some(d => d && d.status === 'rejected')) return false;
                                }
                              }

                              return true;
                            }).map(slot => {
                              const mainDoc = allDocs.find(d => d.offeringId === selectedOffering.id && d.category === slot.id && d.isCurrent);
                              const mainVersions = allDocs.filter(d => d.offeringId === selectedOffering.id && d.category === slot.id);
                              const sortedMainVersions = [...mainVersions].sort((a, b) => b.version - a.version);
                              const isExpanded = !!expandedSubSlots[slot.number];
                              const hasSubSlots = !!(slot.subSlots && slot.subSlots.length > 0);

                              const subDocs = hasSubSlots 
                                ? slot.subSlots!.map(sub => allDocs.find(d => d.offeringId === selectedOffering.id && d.category === sub.id && d.isCurrent))
                                : [];
                              const uploadedSubCount = subDocs.filter(Boolean).length;

                              return (
                                <div
                                  key={slot.number}
                                  className={`rounded-2xl border transition shadow-xs overflow-hidden ${
                                    portfolioViewColumns === '2-col' ? 'flex flex-col justify-between' : ''
                                  } ${
                                    mainDoc
                                      ? mainDoc.status === 'approved' ? 'bg-success-subtle/25 border-success-subtle' :
                                        mainDoc.status === 'rejected' ? 'bg-error-subtle/25 border-error-subtle' :
                                        'bg-warning-subtle/25 border-warning-subtle'
                                      : 'bg-surface border-subtle'
                                  }`}
                                >
                                  {/* Main Slot Container */}
                                  <div className={portfolioViewColumns === '2-col' ? "p-3 sm:p-3.5" : "p-4 sm:p-5"}>
                                    <div className={`flex flex-col ${portfolioViewColumns === '2-col' ? 'sm:flex-row sm:items-start' : 'lg:flex-row lg:items-center'} justify-between gap-3`}>
                                      
                                      {/* Left: Checkbox + Number Badge + Details */}
                                      <div className="flex items-start gap-3.5 min-w-0 flex-grow">
                                        {mainDoc && (
                                          <input
                                            type="checkbox"
                                            checked={selectedDocIdsForBatch.has(mainDoc.id)}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              setSelectedDocIdsForBatch(prev => {
                                                const next = new Set(prev);
                                                if (e.target.checked) next.add(mainDoc.id);
                                                else next.delete(mainDoc.id);
                                                return next;
                                              });
                                            }}
                                            className="w-4 h-4 rounded border-slate-400 text-brand focus:ring-brand cursor-pointer shrink-0 mt-2.5"
                                            title="Select for batch download or print"
                                          />
                                        )}
                                        <div 
                                          className={`w-9 h-9 rounded-xl font-mono font-bold flex items-center justify-center text-xs shrink-0 shadow-xs ${
                                            hasSubSlots ? 'cursor-pointer select-none hover:scale-105 transition-transform' : ''
                                          } ${
                                            mainDoc 
                                              ? mainDoc.status === 'approved' ? 'bg-emerald-600 text-white' :
                                                mainDoc.status === 'rejected' ? 'bg-rose-600 text-white' :
                                                'bg-amber-600 text-white'
                                              : 'bg-brand/10 text-brand border border-brand/20'
                                          }`}
                                          onClick={() => hasSubSlots && toggleSlotExpansion(slot.number)}
                                          title={hasSubSlots ? "Click to expand/collapse representative sub-slots" : undefined}
                                        >
                                          {slot.number}
                                        </div>

                                          <div className="min-w-0 flex-1 space-y-1">
                                            <div 
                                              className={`flex items-center gap-2 flex-wrap ${hasSubSlots ? 'cursor-pointer' : ''}`}
                                              onClick={() => hasSubSlots && toggleSlotExpansion(slot.number)}
                                            >
                                              <h4 className="text-xs sm:text-sm font-bold text-primary truncate" title={slot.label}>
                                                {slot.label}
                                              </h4>
                                              {slot.isCore ? (
                                                <span className="bg-brand/10 text-brand px-1.5 py-0.5 rounded text-xs uppercase font-bold font-mono">Core</span>
                                              ) : (
                                                <span className="bg-surface-hover text-quaternary px-1.5 py-0.5 rounded text-xs uppercase font-bold font-mono">Optional</span>
                                              )}
                                              {hasSubSlots && (
                                                <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-xs uppercase font-bold font-mono border border-indigo-500/20">
                                                  Question Paper / Spec
                                                </span>
                                              )}
                                              {hasSubSlots && (
                                                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                                  <FolderTree className="w-3 h-3" /> {uploadedSubCount}/{slot.subSlots!.length} Samples Uploaded
                                                </span>
                                              )}
                                            </div>

                                            {slot.filenameExample && (
                                              <p className="text-xs font-mono text-tertiary">
                                                Filename Example: <span className="font-bold text-rose-600 dark:text-rose-400">{slot.filenameExample}</span>
                                              </p>
                                            )}

                                            <div className="flex flex-wrap items-center gap-2 text-xs text-tertiary font-mono pt-0.5">
                                              <span className="bg-border-subtle/75 text-secondary-muted px-1.5 py-0.5 rounded text-xs uppercase font-bold">
                                                {slot.group}
                                              </span>
                                              {mainDoc ? (
                                                <>
                                                  <span className="text-success-muted font-bold bg-success-subtle px-1.5 py-0.5 rounded text-xs uppercase">Uploaded</span>
                                                  <span className="text-quaternary">• v{mainDoc.version}</span>
                                                  <span className="text-quaternary truncate max-w-[200px] font-semibold" title={mainDoc.fileName}>
                                                    • {mainDoc.fileName}
                                                  </span>
                                                  <button 
                                                    type="button"
                                                    onClick={() => setPreviewDoc(mainDoc)} 
                                                    className="text-brand hover:text-brand-bolder font-bold underline flex items-center justify-center gap-1 shrink-0 ml-1 cursor-pointer"
                                                    title="Open Document Preview"
                                                  >
                                                    <Eye className="w-3 h-3" /> View
                                                  </button>
                                                  {sortedMainVersions.length > 0 && (
                                                    <button
                                                      type="button"
                                                      onClick={() => { setHistoryModalCategory(slot.id); setHistoryModalOfferingId(selectedOffering.id); }}
                                                      className="text-tertiary hover:text-brand font-bold flex items-center justify-center gap-1 shrink-0 ml-1 cursor-pointer"
                                                      title="View Full Version History Modal"
                                                    >
                                                      <History className="w-3 h-3 text-brand" /> History ({sortedMainVersions.length})
                                                    </button>
                                                  )}
                                                </>
                                              ) : (
                                                <>
                                                  <span className="text-error-muted font-bold bg-error-subtle px-1.5 py-0.5 rounded text-xs uppercase">Missing</span>
                                                  <span className="text-quaternary">• Empty slot {hasSubSlots ? '(Question Paper)' : ''}</span>
                                                </>
                                              )}
                                            </div>

                                            {mainDoc && mainDoc.feedback && (
                                              <div className="text-xs text-error-muted bg-error-subtle border border-error-divider rounded-xl p-2.5 mt-2 font-sans flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                  <strong className="font-bold uppercase tracking-wider text-xs block font-mono text-rose-600 dark:text-rose-400">Reviewer Change Request:</strong>
                                                  <span className="italic font-medium">"{mainDoc.feedback}"</span>
                                                </div>
                                                {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DEPT_HEAD) && (
                                                  <button
                                                    type="button"
                                                    onClick={() => openDocRevisionEmail(mainDoc)}
                                                    className="inline-flex items-center gap-1 text-xs font-bold uppercase font-mono px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shrink-0 cursor-pointer shadow-xs"
                                                    title="Send or preview revision email to instructor"
                                                  >
                                                    <Mail className="w-3 h-3" /> Email Faculty
                                                  </button>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Right: Slot Controls */}
                                        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                                          {mainDoc ? (
                                            <div className="flex items-center gap-2">
                                              <div className="text-right">
                                                <span className="block text-xs font-bold text-quaternary uppercase tracking-widest font-mono">STATUS</span>
                                                {mainDoc.status === 'approved' && (
                                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-success-bold font-mono">
                                                    <CheckCircle className="w-3.5 h-3.5 text-success" /> APPROVED
                                                  </span>
                                                )}
                                                {mainDoc.status === 'rejected' && (
                                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-error-bold font-mono">
                                                    <XCircle className="w-3.5 h-3.5 text-error" /> REJECTED
                                                  </span>
                                                )}
                                                {mainDoc.status === 'pending_review' && (
                                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-warning-bold font-mono">
                                                    <Clock className="w-3.5 h-3.5 text-warning animate-pulse" /> PENDING
                                                  </span>
                                                )}
                                              </div>

                                              {((currentUser.id === selectedOffering.instructorId || currentUser.role === UserRole.ADMIN || currentUser.email === 'data-entry@ewubd.edu') && (mainDoc.status === 'rejected' || mainDoc.status === 'pending_review')) && (
                                                <button
                                                  onClick={() => {
                                                    setUploadCategory(slot.id);
                                                    setUploadText('');
                                                    setSelectedFile(null);
                                                    setUploadFormError('');
                                                    if (slotFileInputRef.current) slotFileInputRef.current.value = '';
                                                    slotFileInputRef.current?.click();
                                                  }}
                                                  className="min-w-[40px] min-h-[40px] flex items-center justify-center bg-surface-hover hover:bg-border-subtle text-secondary-muted hover:text-brand rounded-xl transition cursor-pointer"
                                                  title={hasSubSlots ? "Update Question Paper Submission" : "Update File Submission"}
                                                >
                                                  <FileUp className="w-4 h-4" />
                                                </button>
                                              )}

                                              {(currentUser.role === UserRole.DEPT_HEAD || currentUser.role === UserRole.ADMIN) && (
                                                <button
                                                  onClick={() => {
                                                    setReviewStatus(mainDoc.status === 'rejected' ? 'rejected' : 'approved');
                                                    setReviewFeedback(mainDoc.feedback || '');
                                                    setShowReviewDoc(mainDoc);
                                                  }}
                                                  className="min-w-[40px] min-h-[40px] flex items-center justify-center bg-surface-hover hover:bg-border-subtle text-secondary-muted hover:text-brand rounded-xl transition cursor-pointer"
                                                  title="Review Submission"
                                                >
                                                  <Settings className="w-4 h-4" />
                                                </button>
                                              )}

                                              {(currentUser.role === UserRole.ADMIN || currentUser.id === selectedOffering.instructorId || currentUser.email === 'data-entry@ewubd.edu') && (
                                                <button
                                                  onClick={() => handleDeleteDoc(mainDoc.id, mainDoc.fileName)}
                                                  className="min-w-[40px] min-h-[40px] flex items-center justify-center bg-surface-hover hover:bg-border-subtle text-error hover:text-error-bolder rounded-xl transition cursor-pointer"
                                                  title="Delete Document"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-bold text-quaternary font-mono uppercase bg-surface-hover px-2 py-1 rounded">
                                                MISSING
                                              </span>
                                              {(currentUser.id === selectedOffering.instructorId || currentUser.role === UserRole.ADMIN || currentUser.email === 'data-entry@ewubd.edu') && (
                                                <button
                                                  onClick={() => {
                                                    setUploadCategory(slot.id);
                                                    setUploadText('');
                                                    setSelectedFile(null);
                                                    setUploadFormError('');
                                                    if (slotFileInputRef.current) slotFileInputRef.current.value = '';
                                                    slotFileInputRef.current?.click();
                                                  }}
                                                  className="inline-flex items-center justify-center gap-1 bg-brand hover:bg-brand-hover text-white font-semibold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer shadow-sm shadow-brand/10"
                                                >
                                                  <Plus className="w-3.5 h-3.5" /> {hasSubSlots ? 'Upload Question' : 'Upload'}
                                                </button>
                                              )}
                                            </div>
                                          )}

                                          {hasSubSlots && (
                                            <button
                                              type="button"
                                              onClick={() => toggleSlotExpansion(slot.number)}
                                              className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition cursor-pointer border ${
                                                isExpanded 
                                                  ? 'bg-brand text-white border-brand shadow-sm' 
                                                  : 'bg-surface-hover hover:bg-brand/10 text-secondary border-subtle'
                                              }`}
                                              title={isExpanded ? "Collapse Sub-slots" : "Expand Sub-slots (a, b, c)"}
                                            >
                                              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                          )}
                                        </div>
                                    </div>
                                  </div>

                                  {/* Expandable Representative Samples Sub-Slots (for 08, 09, 10, 11) */}
                                  {hasSubSlots && isExpanded && (
                                    <div className="border-t border-subtle bg-slate-50/50 dark:bg-slate-900/30 p-4 sm:p-5 space-y-3 animate-fade-in">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider font-mono text-brand flex items-center gap-1.5">
                                          <FolderTree className="w-3.5 h-3.5" /> 2) Representative Samples of Answer Scripts / Reports ({uploadedSubCount}/3 Uploaded):
                                        </span>
                                        <span className="text-xs text-quaternary font-mono">
                                          Click upload on each sub-category
                                        </span>
                                      </div>

                                      <div className="space-y-2.5 pl-2 sm:pl-4 border-l-2 border-brand/30">
                                        {slot.subSlots!.map(sub => {
                                          const subDoc = allDocs.find(d => d.offeringId === selectedOffering.id && d.category === sub.id && d.isCurrent);
                                          const subVersions = allDocs.filter(d => d.offeringId === selectedOffering.id && d.category === sub.id);
                                          const sortedSubVersions = [...subVersions].sort((a, b) => b.version - a.version);

                                          return (
                                            <div
                                              key={sub.id}
                                              className={`rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                                                subDoc
                                                  ? subDoc.status === 'approved' ? 'bg-success-subtle/30 border-success-subtle' :
                                                    subDoc.status === 'rejected' ? 'bg-error-subtle/30 border-error-subtle' :
                                                    'bg-warning-subtle/30 border-warning-subtle'
                                                  : 'bg-surface border-subtle'
                                              }`}
                                            >
                                              <div className="min-w-0 flex-1 space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                  {subDoc && (
                                                    <input
                                                      type="checkbox"
                                                      checked={selectedDocIdsForBatch.has(subDoc.id)}
                                                      onChange={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedDocIdsForBatch(prev => {
                                                          const next = new Set(prev);
                                                          if (e.target.checked) next.add(subDoc.id);
                                                          else next.delete(subDoc.id);
                                                          return next;
                                                        });
                                                      }}
                                                      className="w-3.5 h-3.5 rounded border-slate-400 text-brand focus:ring-brand cursor-pointer shrink-0"
                                                      title="Select for batch download or print"
                                                    />
                                                  )}
                                                  <span className="w-6 h-6 rounded-lg bg-brand/10 text-brand font-mono font-bold flex items-center justify-center text-xs shrink-0 border border-brand/20">
                                                    {sub.subNumber})
                                                  </span>
                                                  <p className="text-xs font-bold text-primary truncate" title={sub.label}>
                                                    {sub.label}
                                                  </p>
                                                  <span className="bg-brand/10 text-brand px-1 py-0.2 rounded text-xs uppercase font-bold font-mono">Core</span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 text-xs text-tertiary font-mono pt-0.5 pl-8">
                                                  {subDoc ? (
                                                    <>
                                                      <span className="text-success-muted font-bold bg-success-subtle px-1 py-0.2 rounded text-xs uppercase">Uploaded</span>
                                                      <span className="text-quaternary">• v{subDoc.version}</span>
                                                      <span className="text-quaternary truncate max-w-[180px] font-semibold" title={subDoc.fileName}>
                                                        • {subDoc.fileName}
                                                      </span>
                                                      <button
                                                        type="button"
                                                        onClick={() => setPreviewDoc(subDoc)}
                                                        className="text-brand hover:text-brand-bolder font-bold underline flex items-center gap-1 cursor-pointer"
                                                        title="Open Document Preview"
                                                      >
                                                        <Eye className="w-3 h-3" /> View
                                                      </button>
                                                      {sortedSubVersions.length > 0 && (
                                                        <button
                                                          type="button"
                                                          onClick={() => { setHistoryModalCategory(sub.id); setHistoryModalOfferingId(selectedOffering.id); }}
                                                          className="text-tertiary hover:text-brand font-bold flex items-center gap-1 cursor-pointer"
                                                          title="View Version History"
                                                        >
                                                          <History className="w-3 h-3 text-brand" /> History ({sortedSubVersions.length})
                                                        </button>
                                                      )}
                                                    </>
                                                  ) : (
                                                    <>
                                                      <span className="text-error-muted font-bold bg-error-subtle px-1 py-0.2 rounded text-xs uppercase">Missing</span>
                                                      <span className="text-quaternary">• Empty slot</span>
                                                    </>
                                                  )}
                                                </div>

                                                {subDoc && subDoc.feedback && (
                                                  <div className="text-xs text-error-muted bg-error-subtle border border-error-divider rounded-lg p-2 mt-1.5 font-sans flex items-center justify-between gap-2 ml-8">
                                                    <span><strong>Feedback:</strong> {subDoc.feedback}</span>
                                                    {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DEPT_HEAD) && (
                                                      <button
                                                        type="button"
                                                        onClick={() => openDocRevisionEmail(subDoc)}
                                                        className="text-xs font-bold uppercase font-mono px-2 py-0.5 bg-rose-600 text-white rounded cursor-pointer shrink-0"
                                                      >
                                                        Email
                                                      </button>
                                                    )}
                                                  </div>
                                                )}
                                              </div>

                                              {/* Sub-slot Actions */}
                                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                {subDoc ? (
                                                  <div className="flex items-center gap-1.5">
                                                    <div className="text-right">
                                                      {subDoc.status === 'approved' && (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-success-bold font-mono">
                                                          <CheckCircle className="w-3 h-3 text-success" /> APPROVED
                                                        </span>
                                                      )}
                                                      {subDoc.status === 'rejected' && (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-error-bold font-mono">
                                                          <XCircle className="w-3 h-3 text-error" /> REJECTED
                                                        </span>
                                                      )}
                                                      {subDoc.status === 'pending_review' && (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-warning-bold font-mono">
                                                          <Clock className="w-3 h-3 text-warning animate-pulse" /> PENDING
                                                        </span>
                                                      )}
                                                    </div>

                                                    {((currentUser.id === selectedOffering.instructorId || currentUser.role === UserRole.ADMIN || currentUser.email === 'data-entry@ewubd.edu') && (subDoc.status === 'rejected' || subDoc.status === 'pending_review')) && (
                                                      <button
                                                        onClick={() => {
                                                          setUploadCategory(sub.id);
                                                          setUploadText('');
                                                          setSelectedFile(null);
                                                          setUploadFormError('');
                                                          if (slotFileInputRef.current) slotFileInputRef.current.value = '';
                                                          slotFileInputRef.current?.click();
                                                        }}
                                                        className="p-1.5 bg-surface-hover hover:bg-border-subtle text-secondary-muted hover:text-brand rounded-lg transition cursor-pointer"
                                                        title="Update File Submission"
                                                      >
                                                        <FileUp className="w-3.5 h-3.5" />
                                                      </button>
                                                    )}

                                                    {(currentUser.role === UserRole.DEPT_HEAD || currentUser.role === UserRole.ADMIN) && (
                                                      <button
                                                        onClick={() => {
                                                          setReviewStatus(subDoc.status === 'rejected' ? 'rejected' : 'approved');
                                                          setReviewFeedback(subDoc.feedback || '');
                                                          setShowReviewDoc(subDoc);
                                                        }}
                                                        className="p-1.5 bg-surface-hover hover:bg-border-subtle text-secondary-muted hover:text-brand rounded-lg transition cursor-pointer"
                                                        title="Review Submission"
                                                      >
                                                        <Settings className="w-3.5 h-3.5" />
                                                      </button>
                                                    )}

                                                    {(currentUser.role === UserRole.ADMIN || currentUser.id === selectedOffering.instructorId || currentUser.email === 'data-entry@ewubd.edu') && (
                                                      <button
                                                        onClick={() => handleDeleteDoc(subDoc.id, subDoc.fileName)}
                                                        className="p-1.5 bg-surface-hover hover:bg-border-subtle text-error hover:text-error-bolder rounded-lg transition cursor-pointer"
                                                        title="Delete Document"
                                                      >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                      </button>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-bold text-quaternary font-mono uppercase bg-surface-hover px-1.5 py-0.5 rounded">
                                                      MISSING
                                                    </span>
                                                    {(currentUser.id === selectedOffering.instructorId || currentUser.role === UserRole.ADMIN || currentUser.email === 'data-entry@ewubd.edu') && (
                                                      <button
                                                        onClick={() => {
                                                          setUploadCategory(sub.id);
                                                          setUploadText('');
                                                          setSelectedFile(null);
                                                          setUploadFormError('');
                                                          if (slotFileInputRef.current) slotFileInputRef.current.value = '';
                                                          slotFileInputRef.current?.click();
                                                        }}
                                                        className="inline-flex items-center justify-center gap-1 bg-brand hover:bg-brand-hover text-white font-semibold px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-xs"
                                                      >
                                                        <Plus className="w-3 h-3" /> Upload
                                                      </button>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
          {/* --- TAB 2: MY DESK WORKLIST --- */}
          {activeTab === 'desk' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-primary">My Instructor Workbench</h2>
                <p className="text-xs text-tertiary mt-1">
                  Submissions desk specifically tailored for you. Select your assigned courses below to upload mandatory folder components.
                </p>
              </div>

              {/* Faculty Missing Documents Notice Alert Banner */}
              {(() => {
                const myOfferings = offerings.filter(o => o.instructorId === currentUser.id);
                let totalMissingCount = 0;
                const missingOfferingsList: { offering: any; missingCats: DocumentCategory[] }[] = [];
                
                myOfferings.forEach(off => {
                  const missingCats = getOfferingMissingCategories(off.id);
                  if (missingCats.length > 0) {
                    totalMissingCount += missingCats.length;
                    missingOfferingsList.push({ offering: off, missingCats });
                  }
                });

                if (totalMissingCount === 0) return null;

                return (
                  <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg">
                            <FileWarning className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-sm text-primary">
                            Course File Notice: You have {totalMissingCount} missing course file submission{totalMissingCount === 1 ? '' : 's'}
                          </h3>
                        </div>
                        <p className="text-xs text-secondary-muted">
                          Requirements are currently pending submission across {missingOfferingsList.length} course portfolio{missingOfferingsList.length === 1 ? '' : 's'}. Click on an offering below to review and upload the missing items.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/20">
                      {missingOfferingsList.map(({ offering, missingCats }) => (
                        <button
                          key={offering.id}
                          onClick={() => {
                            setSelectedOffering(offering);
                            setSelectedYear(offering.academicYear);
                            setSelectedTerm(offering.term);
                            setActiveTab('courses');
                            setPortfolioStatusFilter('missing');
                          }}
                          className="inline-flex items-center gap-2 bg-surface hover:bg-surface-hover text-secondary border border-amber-500/40 hover:border-amber-500 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer shadow-sm"
                        >
                          <span className="font-mono text-brand">{offering.course?.code || 'Course'} ({offering.term} {offering.academicYear})</span>
                          <span className="bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs px-1.5 py-0.5 rounded font-mono font-bold">
                            {missingCats.length} missing
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Assigned offerings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offerings
                  .filter(o => o.instructorId === currentUser.id)
                  .map(off => {
                    const offDocs = allDocs.filter(d => d.offeringId === off.id && d.isCurrent);
                    const approvedCount = offDocs.filter(d => d.status === 'approved').length;
                    const totalCategories = 28;

                    return (
                      <div 
                        key={off.id}
                        onClick={() => {
                          setSelectedOffering(off);
                          setSelectedYear(off.academicYear);
                          setSelectedTerm(off.term);
                          setActiveTab('courses'); // Navigate to courses list detail
                        }}
                        className="bg-surface border border-subtle hover:border-brand/40 rounded-2xl p-5 hover:shadow-lg transition cursor-pointer flex items-center justify-between"
                      >
                        <div className="space-y-2">
                          <span className="font-mono text-xs font-bold bg-brand-subtle text-brand-bold border border-brand-divider px-2.5 py-1 rounded-lg">
                            {off.course?.code}
                          </span>
                          <h3 className="text-sm font-bold text-primary mt-1">{off.course?.title}</h3>
                          <p className="text-xs text-tertiary">Section {off.section} • {off.term} {off.academicYear}</p>
                        </div>

                        <div className="text-right space-y-1 font-mono">
                          <p className="text-xs text-tertiary">Checklist Attainment</p>
                          <p className="text-sm font-bold text-brand">{approvedCount}/{totalCategories} Verified</p>
                          <span className="text-xs bg-surface-hover text-tertiary px-1.5 py-0.5 rounded font-semibold">CLICK TO PREVIEW</span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Rejected Documents Attention list */}
              {allDocs.filter(d => d.uploadedBy === currentUser.email && d.status === 'rejected' && d.isCurrent).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-error-muted uppercase font-mono flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-error" /> Submissions Requiring Attention (Rejections)
                  </h3>

                  <div className="bg-error-subtle border border-rose-150 rounded-2xl p-4 space-y-3">
                    {allDocs
                      .filter(d => d.uploadedBy === currentUser.email && d.status === 'rejected' && d.isCurrent)
                      .map(doc => (
                        <div key={doc.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-surface border border-error-subtle rounded-xl gap-4">
                          <div>
                            <p className="text-xs font-bold text-primary-muted">{doc.course?.code}: {getCategoryLabel(doc.category)}</p>
                            <p className="text-xs text-tertiary font-mono mt-1">File: {doc.fileName} • Ref: {doc.id}</p>
                            <div className="mt-2 text-xs text-error-bolder font-sans italic bg-rose-100/50 p-2 rounded border border-error-subtle/50">
                              Feedback from reviewer: "{doc.feedback || 'Please review syllabus guidelines and re-submit.'}"
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              const matchingOffering = offerings.find(o => o.id === doc.offeringId);
                              if (matchingOffering) {
                                setSelectedOffering(matchingOffering);
                                setUploadCategory(doc.category);
                                setUploadText('');
                                setShowUploadDoc(true);
                              }
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg transition shrink-0 cursor-pointer shadow-sm shadow-rose-600/10"
                          >
                            Upload Correction
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- TAB: COMPLIANCE & FACULTY MISSING REVIEW (FOR ADMIN, DEPT HEAD, AUDITOR) --- */}
          {activeTab === 'review' && (() => {
            const accessibleOfferings = getAccessibleOfferings();

            // Calculate Metrics
            let totalOfferingsCount = accessibleOfferings.length;
            let fullyCompleteCount = 0;
            let totalMissingFilesCount = 0;
            let offeringsWithMissingList: typeof accessibleOfferings = [];

            accessibleOfferings.forEach(off => {
              const missingCats = getOfferingMissingCategories(off.id);
              if (missingCats.length === 0) {
                fullyCompleteCount++;
              } else {
                totalMissingFilesCount += missingCats.length;
                offeringsWithMissingList.push(off);
              }
            });

            // Filter offerings
            const filteredOfferings = accessibleOfferings.filter(off => {
              const instructor = off.instructor || usersList.find(u => u.id === off.instructorId);
              const course = off.course || courses.find(c => c.id === off.courseId);
              const missingCats = getOfferingMissingCategories(off.id);

              if (reviewSearch) {
                const q = reviewSearch.toLowerCase().trim();
                const matchCourse = course?.code?.toLowerCase().includes(q) || course?.title?.toLowerCase().includes(q);
                const matchInstructor = instructor?.name?.toLowerCase().includes(q) || instructor?.email?.toLowerCase().includes(q);
                if (!matchCourse && !matchInstructor) return false;
              }

              if (reviewYearFilter && String(off.academicYear) !== reviewYearFilter) {
                return false;
              }

              if (reviewTermFilter && off.term?.toLowerCase() !== reviewTermFilter.toLowerCase()) {
                return false;
              }

              if (reviewDeptFilter && course?.department?.toLowerCase().trim() !== reviewDeptFilter.toLowerCase().trim()) {
                return false;
              }

              if (reviewStatusFilter === 'missing' && missingCats.length === 0) {
                return false;
              }

              if (reviewStatusFilter === 'complete' && missingCats.length > 0) {
                return false;
              }

              return true;
            });

            const uniqueYears = Array.from(new Set(offerings.map(o => o.academicYear))).sort((a, b) => b - a);
            const uniqueDepts = Array.from(new Set(courses.map(c => c.department))).filter(Boolean);

            return (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-brand" /> Faculty Compliance & Missing Documents Hub
                    </h2>
                    <p className="text-xs text-tertiary mt-1">
                      Audit course portfolio completeness across faculty members and dispatch pre-composed reminder notices with 1-click Personal Gmail integration.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-brand-subtle text-brand font-bold text-xs px-3 py-1.5 rounded-xl border border-brand/20">
                      {filteredOfferings.length} {filteredOfferings.length === 1 ? 'Offering' : 'Offerings'} Filtered
                    </span>
                  </div>
                </div>

                {/* Summary Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-surface border border-subtle rounded-2xl p-4 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-quaternary uppercase font-mono">Total Offerings</p>
                      <p className="text-lg font-bold text-primary">{totalOfferingsCount}</p>
                    </div>
                  </div>

                  <div className="bg-surface border border-subtle rounded-2xl p-4 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-quaternary uppercase font-mono">100% Complete</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-emerald-600">{fullyCompleteCount}</span>
                        <span className="text-xs text-tertiary">({totalOfferingsCount > 0 ? Math.round((fullyCompleteCount / totalOfferingsCount) * 100) : 0}%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface border border-subtle rounded-2xl p-4 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-quaternary uppercase font-mono">Pending Portfolios</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-rose-600">{offeringsWithMissingList.length}</span>
                        <span className="text-xs text-tertiary">Need Attention</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface border border-subtle rounded-2xl p-4 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <FileWarning className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-quaternary uppercase font-mono">Missing Files Total</p>
                      <p className="text-lg font-bold text-amber-600">{totalMissingFilesCount} <span className="text-xs text-tertiary font-normal">items</span></p>
                    </div>
                  </div>
                </div>

                {/* Filter Toolbar */}
                <div className="bg-surface border border-subtle rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 justify-between">
                    {/* Search bar */}
                    <div className="relative flex-grow max-w-md">
                      <Search className="w-4 h-4 text-quaternary absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search instructor name, email, course code..."
                        value={reviewSearch}
                        onChange={(e) => setReviewSearch(e.target.value)}
                        className="w-full bg-background border border-subtle rounded-xl pl-9 pr-8 py-2 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-brand shadow-inner"
                      />
                      {reviewSearch && (
                        <button
                          onClick={() => setReviewSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-quaternary hover:text-primary cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Filter dropdowns */}
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={reviewTermFilter}
                        onChange={(e) => setReviewTermFilter(e.target.value)}
                        className="bg-background border border-subtle rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
                      >
                        <option value="">All Terms</option>
                        <option value={Term.SPRING}>Spring</option>
                        <option value={Term.SUMMER}>Summer</option>
                        <option value={Term.FALL}>Fall</option>
                      </select>

                      <select
                        value={reviewYearFilter}
                        onChange={(e) => setReviewYearFilter(e.target.value)}
                        className="bg-background border border-subtle rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
                      >
                        <option value="">All Academic Years</option>
                        {uniqueYears.map(yr => (
                          <option key={yr} value={String(yr)}>{yr}</option>
                        ))}
                      </select>

                      {currentUser.role === UserRole.ADMIN && uniqueDepts.length > 1 && (
                        <select
                          value={reviewDeptFilter}
                          onChange={(e) => setReviewDeptFilter(e.target.value)}
                          className="bg-background border border-subtle rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer max-w-[180px] truncate"
                        >
                          <option value="">All Departments</option>
                          {uniqueDepts.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      )}

                      {/* Status Pills */}
                      <div className="flex items-center bg-surface-hover p-1 rounded-xl border border-subtle">
                        <button
                          type="button"
                          onClick={() => setReviewStatusFilter('all')}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                            reviewStatusFilter === 'all'
                              ? 'bg-surface text-primary font-bold shadow-sm'
                              : 'text-quaternary hover:text-primary'
                          }`}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewStatusFilter('missing')}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                            reviewStatusFilter === 'missing'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold shadow-sm'
                              : 'text-quaternary hover:text-primary'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Missing Only
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewStatusFilter('complete')}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                            reviewStatusFilter === 'complete'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                              : 'text-quaternary hover:text-primary'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Complete
                        </button>
                      </div>

                      {(reviewSearch || reviewTermFilter || reviewYearFilter || reviewDeptFilter || reviewStatusFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setReviewSearch('');
                            setReviewTermFilter('');
                            setReviewYearFilter('');
                            setReviewDeptFilter('');
                            setReviewStatusFilter('all');
                          }}
                          className="text-xs text-rose-500 hover:text-rose-600 font-bold underline px-2 cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Offerings Review List */}
                <div className="space-y-4">
                  {filteredOfferings.length === 0 ? (
                    <div className="text-center py-16 bg-surface rounded-2xl border border-subtle shadow-sm space-y-2">
                      <ListChecks className="w-10 h-10 text-quaternary mx-auto opacity-50" />
                      <h3 className="text-sm font-bold text-primary">No course offerings match your filter criteria</h3>
                      <p className="text-xs text-tertiary">Try adjusting your keyword search or changing the semester / status filters above.</p>
                    </div>
                  ) : (
                    filteredOfferings.map(off => {
                      const instructor = off.instructor || usersList.find(u => u.id === off.instructorId);
                      const course = off.course || courses.find(c => c.id === off.courseId);
                      const missingCats = getOfferingMissingCategories(off.id);
                      const activeCoreCount = categoriesList.filter(c => c.isCore && c.isActive !== false).length;
                      const totalCore = activeCoreCount > 0 ? activeCoreCount : CORE_16_CATEGORIES.length;
                      const uploadedCoreCount = Math.max(0, totalCore - missingCats.length);
                      const completionPercent = Math.round((uploadedCoreCount / totalCore) * 100);
                      const isComplete = missingCats.length === 0;

                      // Find last reminder audit log entry if exists
                      const lastReminder = auditLogs.find(l => 
                        l.action === 'FACULTY_REMINDER_SENT' && 
                        (l.targetDocumentId === off.id || (course && l.details.includes(course.code)))
                      );

                      const isExpanded = expandedMissingOfferingId === off.id;

                      return (
                        <div
                          key={off.id}
                          className={`bg-surface rounded-2xl border transition shadow-sm hover:shadow-md ${
                            isComplete 
                              ? 'border-subtle' 
                              : 'border-amber-500/30 hover:border-amber-500/50'
                          }`}
                        >
                          <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                            {/* Course & Faculty Info */}
                            <div className="flex items-start gap-4 min-w-0 flex-1">
                              {instructor?.avatarUrl && !instructor.avatarUrl.includes('unsplash.com') ? (
                                <img
                                  src={instructor.avatarUrl}
                                  alt={instructor.name}
                                  className="w-12 h-12 rounded-2xl bg-border-subtle shadow-sm shrink-0 object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-500/25 text-brand font-bold flex items-center justify-center text-sm border border-brand/20 shrink-0">
                                  {instructor?.name ? instructor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'FC'}
                                </div>
                              )}

                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs font-bold bg-brand-subtle text-brand-bold border border-brand-divider px-2.5 py-0.5 rounded-lg">
                                    {course?.code || 'Course'}
                                  </span>
                                  <span className="text-xs font-semibold text-tertiary">
                                    Section {off.section} • {off.term} {off.academicYear}
                                  </span>
                                  {course?.department && (
                                    <span className="text-xs text-quaternary font-medium bg-surface-hover px-2 py-0.5 rounded-md">
                                      {course.department}
                                    </span>
                                  )}
                                </div>

                                <h3 className="text-sm font-bold text-primary truncate" title={course?.title}>
                                  {course?.title || 'Untitled Course'}
                                </h3>

                                {off.instructorId === currentUser.id && (
                                  <span className="inline-flex items-center gap-1 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold font-mono text-xs px-2 py-0.5 rounded border border-indigo-500/25">
                                    ★ Your Teaching Course (Self-Review / Admin Review)
                                  </span>
                                )}

                                <div className="flex flex-wrap items-center gap-3 text-xs text-secondary-muted pt-0.5">
                                  <span className="flex items-center gap-1 font-semibold text-primary">
                                    <User className="w-3.5 h-3.5 text-brand" /> {instructor?.name || 'Unassigned Instructor'}
                                  </span>
                                  <span className="text-tertiary font-mono text-xs">
                                    ({instructor?.email || 'No email registered'})
                                  </span>
                                  {lastReminder && (
                                    <span className="inline-flex items-center gap-1 text-xs text-brand bg-brand/10 px-2 py-0.5 rounded-md font-mono font-semibold" title={lastReminder.details}>
                                      <Clock className="w-3 h-3" /> Reminded: {new Date(lastReminder.timestamp).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Progress Bar & Status */}
                            <div className="w-full lg:w-64 space-y-2 shrink-0">
                              <div className="flex items-center justify-between text-xs font-mono">
                                <span className="text-tertiary font-semibold">Attainment Progress:</span>
                                <span className={`font-bold ${isComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {uploadedCoreCount} / {totalCore} ({completionPercent}%)
                                </span>
                              </div>

                              <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden border border-subtle">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isComplete
                                      ? 'bg-emerald-500'
                                      : completionPercent >= 75
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${completionPercent}%` }}
                                ></div>
                              </div>

                              <div className="flex items-center justify-between">
                                {isComplete ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 font-mono">
                                    <CheckCircle className="w-3.5 h-3.5" /> All 16 Files Verified
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setExpandedMissingOfferingId(isExpanded ? null : off.id)}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 font-mono cursor-pointer transition"
                                  >
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>{missingCats.length} Document{missingCats.length === 1 ? '' : 's'} Missing</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                              {!isComplete && (
                                <button
                                  onClick={() => openReminderModal(off)}
                                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-md shadow-rose-600/15 cursor-pointer min-h-[38px]"
                                  title="Open pre-composed reminder email preview in Gmail Web or Mail client"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>Send Reminder Email</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedOffering(off);
                                  setSelectedYear(off.academicYear);
                                  setSelectedTerm(off.term);
                                  setActiveTab('courses');
                                }}
                                className="inline-flex items-center gap-1 bg-surface hover:bg-surface-hover text-secondary hover:text-primary font-semibold px-3 py-2 rounded-xl text-xs transition border border-subtle shadow-sm cursor-pointer min-h-[38px]"
                                title="Open Course Portfolio Folder"
                              >
                                <span>Inspect Folder</span>
                                <ChevronRight className="w-3.5 h-3.5 text-quaternary" />
                              </button>
                            </div>
                          </div>

                          {/* Expandable Missing Categories Chip List */}
                          {!isComplete && (
                            <div className={`px-5 pb-4 pt-2 border-t border-amber-500/20 bg-amber-500/5 ${isExpanded ? 'block' : 'hidden'}`}>
                              <p className="text-xs font-bold text-quaternary uppercase font-mono mb-2">
                                Missing Course Folder Components ({missingCats.length}):
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                {missingCats.map(cat => {
                                  return (
                                    <span
                                      key={cat}
                                      className="inline-flex items-center gap-1 bg-surface border border-rose-500/30 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                      {getCategoryLabel(cat)}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}

          {/* --- TAB 3: DOCUMENT ARCHIVE & MULTI-CRITERIA SEARCH HUB --- */}
          {activeTab === 'archive' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header & Quick Export */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Search className="w-5 h-5 text-brand" /> Document Catalog Search Engine
                  </h2>
                  <p className="text-xs text-tertiary mt-1">
                    Multi-criteria instant search across course codes, academic years (e.g. 2025), requirement categories, and approval states.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportFilteredDocsCSV}
                    className="flex items-center gap-1.5 bg-surface border border-subtle hover:border-brand/40 text-secondary hover:text-brand px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
                    title="Export filtered document records to CSV"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <span>Export CSV</span>
                  </button>
                  <div className="bg-brand-subtle text-brand px-3 py-2 rounded-xl text-xs font-mono font-bold border border-brand/20">
                    {filteredDocs.length} {filteredDocs.length === 1 ? 'File' : 'Files'} Found
                  </div>
                </div>
              </div>

              {/* Quick Smart Search Shortcuts Bar */}
              <div className="bg-surface border border-subtle rounded-2xl p-3.5 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-quaternary uppercase font-mono tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Search Presets:
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      clearArchiveFilters();
                      setArchiveYearFilter('2025');
                      setArchiveCategoryFilter('course_outline');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                      archiveYearFilter === '2025' && archiveCategoryFilter === 'course_outline'
                        ? 'bg-brand text-white border-brand shadow-sm'
                        : 'bg-background text-secondary hover:bg-surface-hover border-subtle'
                    }`}
                  >
                    <span>🎓</span> 2025 Course Outlines
                  </button>

                  <button
                    onClick={() => {
                      clearArchiveFilters();
                      setArchiveYearFilter('2025');
                      setArchiveSearch('question');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                      archiveYearFilter === '2025' && archiveSearch === 'question'
                        ? 'bg-brand text-white border-brand shadow-sm'
                        : 'bg-background text-secondary hover:bg-surface-hover border-subtle'
                    }`}
                  >
                    <span>📝</span> 2025 Exam Questions
                  </button>

                  <button
                    onClick={() => {
                      clearArchiveFilters();
                      setArchiveStatusFilter('pending_review');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                      archiveStatusFilter === 'pending_review'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-background text-secondary hover:bg-surface-hover border-subtle'
                    }`}
                  >
                    <span>⏳</span> Pending Reviews
                  </button>

                  <button
                    onClick={() => {
                      clearArchiveFilters();
                      setArchiveStatusFilter('approved');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                      archiveStatusFilter === 'approved'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-background text-secondary hover:bg-surface-hover border-subtle'
                    }`}
                  >
                    <span>✅</span> Approved Archives
                  </button>

                  {currentUser?.department && (
                    <button
                      onClick={() => {
                        clearArchiveFilters();
                        setArchiveDeptFilter(currentUser.department || '');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                        archiveDeptFilter === currentUser.department
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-background text-secondary hover:bg-surface-hover border-subtle'
                      }`}
                    >
                      <span>🏢</span> My Department ({currentUser.department})
                    </button>
                  )}

                  {(archiveSearch || archiveCourseFilter || archiveCategoryFilter || archiveStatusFilter || archiveYearFilter || archiveTermFilter || archiveDeptFilter) && (
                    <button
                      onClick={clearArchiveFilters}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer flex items-center gap-1 border border-rose-200 dark:border-rose-900/50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Multi-Criteria Filters Grid Panel */}
              <div className="bg-surface border border-subtle rounded-2xl p-4 space-y-3 shadow-sm">
                {/* Search Bar */}
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-quaternary">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={archiveSearch}
                    onChange={(e) => setArchiveSearch(e.target.value)}
                    placeholder="Full-text search: Course Code (e.g. CSE101), Title, Year (2025), File Name, Category, Uploader..."
                    className="w-full bg-background border border-subtle rounded-xl py-2.5 pl-10 pr-10 text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 text-xs font-medium"
                  />
                  {archiveSearch && (
                    <button
                      onClick={() => setArchiveSearch('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-quaternary hover:text-primary cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dropdowns Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                  {/* Academic Year */}
                  <div className="flex items-center gap-1 bg-background border border-subtle rounded-xl px-2.5 py-1.5 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-brand shrink-0" />
                    <select
                      value={archiveYearFilter}
                      onChange={(e) => setArchiveYearFilter(e.target.value)}
                      className="bg-transparent text-secondary outline-none text-xs w-full cursor-pointer font-medium"
                    >
                      <option value="">All Years</option>
                      {availableYears.map(y => (
                        <option key={y} value={String(y)} className="text-primary">Year {y}</option>
                      ))}
                    </select>
                  </div>

                  {/* Term */}
                  <div className="flex items-center gap-1 bg-background border border-subtle rounded-xl px-2.5 py-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <select
                      value={archiveTermFilter}
                      onChange={(e) => setArchiveTermFilter(e.target.value)}
                      className="bg-transparent text-secondary outline-none text-xs w-full cursor-pointer font-medium"
                    >
                      <option value="">All Terms</option>
                      <option value="Spring" className="text-primary">Spring</option>
                      <option value="Summer" className="text-primary">Summer</option>
                      <option value="Fall" className="text-primary">Fall</option>
                    </select>
                  </div>

                  {/* Department */}
                  <div className="flex items-center gap-1 bg-background border border-subtle rounded-xl px-2.5 py-1.5 text-xs">
                    <Layers className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <select
                      value={archiveDeptFilter}
                      onChange={(e) => setArchiveDeptFilter(e.target.value)}
                      className="bg-transparent text-secondary outline-none text-xs w-full cursor-pointer font-medium"
                    >
                      <option value="">All Depts</option>
                      {availableDepts.map(d => (
                        <option key={d} value={d} className="text-primary">{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Course Code */}
                  <div className="flex items-center gap-1 bg-background border border-subtle rounded-xl px-2.5 py-1.5 text-xs">
                    <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <select
                      value={archiveCourseFilter}
                      onChange={(e) => setArchiveCourseFilter(e.target.value)}
                      className="bg-transparent text-secondary outline-none text-xs w-full cursor-pointer font-medium"
                    >
                      <option value="">All Courses</option>
                      {availableCourseOptions.map(c => (
                        <option key={c.code} value={c.code} className="text-primary">{c.code} {c.title ? `— ${c.title}` : ''}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div className="flex items-center gap-1 bg-background border border-subtle rounded-xl px-2.5 py-1.5 text-xs">
                    <Filter className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <select
                      value={archiveCategoryFilter}
                      onChange={(e) => setArchiveCategoryFilter(e.target.value)}
                      className="bg-transparent text-secondary outline-none text-xs w-full cursor-pointer font-medium"
                    >
                      <option value="">All Requirements</option>
                      {categoriesList.filter(c => c.isActive !== false).map(cat => (
                        <option key={cat.id} value={cat.id} className="text-primary">{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-1 bg-background border border-subtle rounded-xl px-2.5 py-1.5 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <select
                      value={archiveStatusFilter}
                      onChange={(e) => setArchiveStatusFilter(e.target.value)}
                      className="bg-transparent text-secondary outline-none text-xs w-full cursor-pointer font-medium"
                    >
                      <option value="">All Statuses</option>
                      <option value="approved" className="text-primary">Approved</option>
                      <option value="pending_review" className="text-primary">Pending Review</option>
                      <option value="rejected" className="text-primary">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Active Filter Chips & View Mode Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-subtle rounded-xl p-3 shadow-sm">
                {/* Active Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-xs uppercase font-mono font-bold text-quaternary">Active Filters:</span>
                  {archiveSearch && (
                    <span className="bg-brand-subtle text-brand border border-brand/20 px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono text-xs">
                      Search: "{archiveSearch}"
                      <button onClick={() => setArchiveSearch('')} className="hover:text-rose-500 cursor-pointer"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {archiveYearFilter && (
                    <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono text-xs">
                      Year: {archiveYearFilter}
                      <button onClick={() => setArchiveYearFilter('')} className="hover:text-rose-500 cursor-pointer"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {archiveTermFilter && (
                    <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono text-xs">
                      Term: {archiveTermFilter}
                      <button onClick={() => setArchiveTermFilter('')} className="hover:text-rose-500 cursor-pointer"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {archiveDeptFilter && (
                    <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900 px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono text-xs">
                      Dept: {archiveDeptFilter}
                      <button onClick={() => setArchiveDeptFilter('')} className="hover:text-rose-500 cursor-pointer"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {archiveCourseFilter && (
                    <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono text-xs">
                      Course: {archiveCourseFilter}
                      <button onClick={() => setArchiveCourseFilter('')} className="hover:text-rose-500 cursor-pointer"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {archiveCategoryFilter && (
                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono text-xs">
                      Requirement: {getCategoryLabel(archiveCategoryFilter)}
                      <button onClick={() => setArchiveCategoryFilter('')} className="hover:text-rose-500 cursor-pointer"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {archiveStatusFilter && (
                    <span className="bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900 px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono text-xs">
                      Status: {archiveStatusFilter.replace('_', ' ')}
                      <button onClick={() => setArchiveStatusFilter('')} className="hover:text-rose-500 cursor-pointer"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {!archiveSearch && !archiveYearFilter && !archiveTermFilter && !archiveDeptFilter && !archiveCourseFilter && !archiveCategoryFilter && !archiveStatusFilter && (
                    <span className="text-tertiary italic text-xs">None (Showing full archive)</span>
                  )}
                </div>

                {/* View Layout Switcher */}
                <div className="flex items-center gap-1 bg-background border border-subtle p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setArchiveViewLayout('table')}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                      archiveViewLayout === 'table' ? 'bg-surface text-brand shadow-sm border border-subtle' : 'text-tertiary hover:text-primary'
                    }`}
                    title="Table View"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-xs">Table</span>
                  </button>

                  <button
                    onClick={() => setArchiveViewLayout('cards')}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                      archiveViewLayout === 'cards' ? 'bg-surface text-brand shadow-sm border border-subtle' : 'text-tertiary hover:text-primary'
                    }`}
                    title="Cards View"
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-xs">Cards</span>
                  </button>

                  <button
                    onClick={() => setArchiveViewLayout('grouped_course')}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                      archiveViewLayout === 'grouped_course' ? 'bg-surface text-brand shadow-sm border border-subtle' : 'text-tertiary hover:text-primary'
                    }`}
                    title="Group by Course"
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-xs">By Course</span>
                  </button>

                  <button
                    onClick={() => setArchiveViewLayout('grouped_category')}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                      archiveViewLayout === 'grouped_category' ? 'bg-surface text-brand shadow-sm border border-subtle' : 'text-tertiary hover:text-primary'
                    }`}
                    title="Group by Category"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-xs">By Category</span>
                  </button>
                </div>
              </div>

              {/* Documents Content Render */}
              {filteredDocs.length === 0 ? (
                <div className="bg-surface border border-subtle rounded-2xl p-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-300">
                  <div className="w-16 h-16 bg-brand-subtle rounded-full flex items-center justify-center mb-4">
                    <Database className="w-8 h-8 text-brand" />
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-2">No Matching Documents</h3>
                  <p className="text-secondary-muted text-sm max-w-md mx-auto mb-4">
                    There are no documents matching your specific search criteria or applied filters.
                  </p>
                  <button
                    onClick={clearArchiveFilters}
                    className="bg-brand hover:bg-brand-bolder text-white text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset Search & Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* LAYOUT 1: TABLE VIEW */}
                  {archiveViewLayout === 'table' && (
                    <div className="bg-surface border border-subtle rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[640px]">
                          <thead>
                            <tr className="border-b border-subtle bg-background text-xs font-mono uppercase text-quaternary tracking-wider">
                              <th className="py-3 px-4">Course & Academic Session</th>
                              <th className="py-3 px-4">Category & File Name</th>
                              <th className="py-3 px-4">Uploaded By</th>
                              <th className="py-3 px-4 text-center">Status</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-secondary">
                            {paginatedArchiveDocs.map(doc => {
                              const categoryLabel = getCategoryLabel(doc.category);
                              return (
                                <tr key={doc.id} className="hover:bg-background/80 transition group">
                                  <td className="py-3 px-4">
                                    <p className="font-mono font-bold text-brand">{doc.course?.code}</p>
                                    <p className="text-xs text-tertiary font-mono mt-0.5">
                                      {doc.offering?.term} {doc.offering?.academicYear} {doc.course?.department ? `• ${doc.course.department}` : ''}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="font-semibold text-primary">{categoryLabel}</p>
                                    <p className="text-xs text-tertiary font-mono mt-0.5 max-w-[220px] truncate" title={doc.fileName}>{doc.fileName}</p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="font-medium text-secondary">{doc.uploadedBy.split('@')[0]}</p>
                                    <p className="text-xs text-tertiary font-mono">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}</p>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {doc.status === 'approved' ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-success-subtle text-success-bold border border-success-subtle">
                                        <CheckCircle className="w-3.5 h-3.5" /> Approved
                                      </span>
                                    ) : doc.status === 'rejected' ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-error-subtle text-error-bold border border-error-subtle">
                                        <AlertCircle className="w-3.5 h-3.5" /> Rejected
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-warning-subtle text-warning-bold border border-warning-subtle">
                                        <Clock className="w-3.5 h-3.5" /> Pending
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewDoc(doc)}
                                        className="text-brand hover:text-brand-bolder p-1.5 hover:bg-brand-subtle rounded-lg transition cursor-pointer"
                                        title="Preview Document"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setHistoryModalCategory(doc.category);
                                          setHistoryModalOfferingId(doc.offeringId);
                                        }}
                                        className="text-quaternary hover:text-primary p-1.5 hover:bg-surface-hover rounded-lg transition cursor-pointer"
                                        title="View File Version History"
                                      >
                                        <History className="w-4 h-4" />
                                      </button>
                                      {(currentUser?.role === UserRole.ADMIN || currentUser?.email === doc.uploadedBy) && (
                                        <button
                                          onClick={() => handleDeleteDoc(doc.id, doc.fileName)}
                                          className="text-error hover:text-error-bolder p-1.5 hover:bg-error-subtle rounded-lg transition cursor-pointer"
                                          title="Delete Document"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* LAYOUT 2: CARDS VIEW */}
                  {archiveViewLayout === 'cards' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedArchiveDocs.map(doc => {
                        const categoryLabel = getCategoryLabel(doc.category);
                        const statusColors = doc.status === 'approved' ? 'bg-success-subtle text-success-bold border-success-subtle' :
                          doc.status === 'rejected' ? 'bg-error-subtle text-error-bold border-error-subtle' :
                          'bg-warning-subtle text-warning-bold border-warning-subtle';

                        return (
                          <div key={doc.id} className="bg-surface border border-subtle hover:border-brand/40 rounded-2xl p-4 shadow-sm hover:shadow transition flex flex-col justify-between space-y-3">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-mono font-bold text-sm text-brand">
                                    {doc.course?.code}: {doc.course?.title}
                                  </div>
                                  <div className="text-xs text-tertiary font-mono">
                                    {doc.offering?.term} {doc.offering?.academicYear} {doc.course?.department ? `• ${doc.course.department}` : ''}
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider border shrink-0 ${statusColors}`}>
                                  {doc.status.replace('_', ' ')}
                                </span>
                              </div>

                              <div className="pt-1">
                                <div className="text-xs font-semibold text-primary">
                                  {categoryLabel}
                                </div>
                                <div className="text-xs text-tertiary truncate font-mono bg-background p-2 rounded-xl border border-divider mt-1" title={doc.fileName}>
                                  {doc.fileName}
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-subtle flex items-center justify-between text-xs">
                                <div className="text-xs text-quaternary font-mono flex items-center gap-1">
                                  <span className="text-xs text-tertiary">v{doc.version}</span>
                                </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc(doc)}
                                  className="flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-bolder cursor-pointer"
                                  title="Preview Document"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View
                                </button>
                                <button
                                  onClick={() => {
                                    setHistoryModalCategory(doc.category);
                                    setHistoryModalOfferingId(doc.offeringId);
                                  }}
                                  className="text-tertiary hover:text-primary cursor-pointer"
                                  title="History"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </button>
                                {(currentUser?.role === UserRole.ADMIN || currentUser?.email === doc.uploadedBy) && (
                                  <button onClick={() => handleDeleteDoc(doc.id, doc.fileName)} className="text-error hover:text-error-bolder cursor-pointer">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* LAYOUT 3: GROUPED BY COURSE VIEW */}
                  {archiveViewLayout === 'grouped_course' && (() => {
                    type DocType = (typeof filteredDocs)[number];
                    const groupedByCourse = filteredDocs.reduce<Record<string, DocType[]>>((acc, doc) => {
                      const courseKey = `${doc.course?.code || 'UNKNOWN'} - ${doc.course?.title || ''} (${doc.offering?.term || ''} ${doc.offering?.academicYear || ''})`;
                      if (!acc[courseKey]) acc[courseKey] = [];
                      acc[courseKey].push(doc);
                      return acc;
                    }, {});

                    return (
                      <div className="space-y-4">
                        {Object.entries(groupedByCourse).map(([courseHeader, docsInCourse]) => (
                          <div key={courseHeader} className="bg-surface border border-subtle rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-background px-4 py-3 border-b border-subtle flex items-center justify-between">
                              <h3 className="text-xs font-bold font-mono text-brand flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-brand" /> {courseHeader}
                              </h3>
                              <span className="text-xs font-mono bg-brand-subtle text-brand px-2 py-0.5 rounded-full font-bold">
                                {docsInCourse.length} {docsInCourse.length === 1 ? 'file' : 'files'}
                              </span>
                            </div>
                            <div className="divide-y divide-subtle">
                              {docsInCourse.map((doc: DocType) => (
                                <div key={doc.id} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-background/50 transition">
                                  <div>
                                    <span className="text-xs font-bold text-primary">
                                      {getCategoryLabel(doc.category)}
                                    </span>
                                    <p className="text-xs text-tertiary font-mono truncate max-w-md">{doc.fileName}</p>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                      doc.status === 'approved' ? 'bg-success-subtle text-success-bold' :
                                      doc.status === 'rejected' ? 'bg-error-subtle text-error-bold' : 'bg-warning-subtle text-warning-bold'
                                    }`}>
                                      {doc.status.replace('_', ' ')}
                                    </span>
                                    <button 
                                      type="button"
                                      onClick={() => setPreviewDoc(doc)} 
                                      className="text-xs font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                                      title="Preview Document"
                                    >
                                      <Eye className="w-3.5 h-3.5" /> View
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* LAYOUT 4: GROUPED BY CATEGORY VIEW */}
                  {archiveViewLayout === 'grouped_category' && (() => {
                    type DocType = (typeof filteredDocs)[number];
                    const groupedByCategory = filteredDocs.reduce<Record<string, DocType[]>>((acc, doc) => {
                      const catLabel = getCategoryLabel(doc.category);
                      if (!acc[catLabel]) acc[catLabel] = [];
                      acc[catLabel].push(doc);
                      return acc;
                    }, {});

                    return (
                      <div className="space-y-4">
                        {Object.entries(groupedByCategory).map(([catHeader, docsInCat]) => (
                          <div key={catHeader} className="bg-surface border border-subtle rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-background px-4 py-3 border-b border-subtle flex items-center justify-between">
                              <h3 className="text-xs font-bold font-mono text-purple-600 dark:text-purple-400 flex items-center gap-2">
                                <Filter className="w-4 h-4 text-purple-500" /> {catHeader}
                              </h3>
                              <span className="text-xs font-mono bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold">
                                {docsInCat.length} {docsInCat.length === 1 ? 'file' : 'files'}
                              </span>
                            </div>
                            <div className="divide-y divide-subtle">
                              {docsInCat.map((doc: DocType) => (
                                <div key={doc.id} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-background/50 transition">
                                  <div>
                                    <span className="text-xs font-bold text-brand font-mono">
                                      {doc.course?.code} ({doc.offering?.term} {doc.offering?.academicYear})
                                    </span>
                                    <p className="text-xs text-tertiary font-mono truncate max-w-md">{doc.fileName}</p>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                      doc.status === 'approved' ? 'bg-success-subtle text-success-bold' :
                                      doc.status === 'rejected' ? 'bg-error-subtle text-error-bold' : 'bg-warning-subtle text-warning-bold'
                                    }`}>
                                      {doc.status.replace('_', ' ')}
                                    </span>
                                    <button 
                                      type="button"
                                      onClick={() => setPreviewDoc(doc)} 
                                      className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                                      title="Preview Document"
                                    >
                                      <Eye className="w-3.5 h-3.5" /> View
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Document Archive Pagination Toolbar */}
                  <Pagination
                    currentPage={archivePage}
                    totalPages={archiveTotalPages}
                    totalItems={filteredDocs.length}
                    pageSize={archivePageSize}
                    onPageChange={setArchivePage}
                    onPageSizeChange={setArchivePageSize}
                    pageSizeOptions={[12, 24, 48, 96]}
                    itemLabel="documents"
                    className="mt-6"
                  />
                </div>
              )}
            </div>
          )}



          {/* --- TAB 4: AUDIT LOG (ADMIN ONLY) --- */}
          {activeTab === 'ledger' && currentUser.role === UserRole.ADMIN && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header & Quick Export */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                    <History className="w-5 h-5 text-brand" /> System Audit Log & Compliance Ledger
                  </h2>
                  <p className="text-xs text-tertiary mt-1">
                    Immutable chronological audit trail of administrative events, file uploads, reviews, clearances, and security records.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={exportLedgerCSV}
                    className="flex items-center gap-1.5 bg-surface border border-subtle hover:border-brand/40 text-secondary hover:text-brand px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
                    title="Export filtered audit trail to CSV for ABET / institutional compliance"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <span>Export CSV</span>
                  </button>
                  <div className="bg-brand-subtle text-brand px-3 py-2 rounded-xl text-xs font-mono font-bold border border-brand/20">
                    {ledgerTotal} {ledgerTotal === 1 ? 'Event' : 'Events'} Logged
                  </div>
                </div>
              </div>

              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-surface border border-subtle rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-subtle text-brand flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-quaternary uppercase font-mono tracking-wider">Total Events</p>
                    <p className="text-base font-bold text-primary font-mono">{ledgerTotal}</p>
                  </div>
                </div>

                <div className="bg-surface border border-subtle rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FileUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-quaternary uppercase font-mono tracking-wider">Uploads & Files</p>
                    <p className="text-base font-bold text-primary font-mono">
                      {auditLogs.filter(l => l.action.includes('UPLOAD') || l.action.includes('DOCUMENT')).length}
                    </p>
                  </div>
                </div>

                <div className="bg-surface border border-subtle rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-quaternary uppercase font-mono tracking-wider">Approvals & Reviews</p>
                    <p className="text-base font-bold text-primary font-mono">
                      {auditLogs.filter(l => l.action.includes('APPROVE') || l.action.includes('REJECT')).length}
                    </p>
                  </div>
                </div>

                <div className="bg-surface border border-subtle rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-quaternary uppercase font-mono tracking-wider">Clearance & Security</p>
                    <p className="text-base font-bold text-primary font-mono">
                      {auditLogs.filter(l => l.action.includes('ROLE') || l.action.includes('USER') || l.action.includes('REMINDER')).length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Filter & Search Toolbar */}
              <div className="bg-surface border border-subtle rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-quaternary">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      value={ledgerSearch}
                      onChange={(e) => {
                        setLedgerSearch(e.target.value);
                        setLedgerPage(1);
                      }}
                      placeholder="Search activity by actor, action, file name, course code, or details..."
                      className="w-full bg-background border border-subtle rounded-xl py-2 pl-9 pr-8 text-primary placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                    />
                    {ledgerSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setLedgerSearch('');
                          setLedgerPage(1);
                        }}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-quaternary hover:text-primary cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Action Category Dropdown */}
                  <div className="flex items-center gap-1.5 bg-background border border-subtle rounded-xl px-2.5 py-1.5 text-xs shrink-0">
                    <Filter className="w-3.5 h-3.5 text-brand shrink-0" />
                    <select
                      value={ledgerAction}
                      onChange={(e) => {
                        setLedgerAction(e.target.value);
                        setLedgerPage(1);
                      }}
                      className="bg-transparent text-secondary outline-none text-xs w-full cursor-pointer font-medium"
                    >
                      <option value="">All Action Types</option>
                      <option value="CREATE_DOCUMENT">Document Upload</option>
                      <option value="UPLOAD_NEW_VERSION">New Version Upload</option>
                      <option value="BULK_UPLOAD">Bulk Upload Batch</option>
                      <option value="APPROVE_DOCUMENT">Document Approved</option>
                      <option value="REJECT_DOCUMENT">Document Rejected</option>
                      <option value="DELETE_DOCUMENT">Soft Deleted (Trash)</option>
                      <option value="RESTORE_DOCUMENT">Restored from Trash</option>
                      <option value="PURGE_DOCUMENT">Purged from R2 Storage</option>
                      <option value="APPROVE_OFFERING">Portfolio Approved</option>
                      <option value="SUBMIT_OFFERING">Portfolio Submitted</option>
                      <option value="FACULTY_REMINDER_SENT">Compliance Reminder</option>
                      <option value="USER_ROLE_UPDATED">Security Role Changed</option>
                      <option value="USER_APPROVED">Staff Clearance Approved</option>
                      <option value="SYSTEM_INIT">System Initialization</option>
                    </select>
                  </div>

                  {/* Layout View Switcher */}
                  <div className="flex items-center gap-1 bg-background border border-subtle p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setLedgerLayout('table')}
                      className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                        ledgerLayout === 'table' ? 'bg-surface text-brand shadow-xs border border-subtle' : 'text-tertiary hover:text-primary'
                      }`}
                      title="High-Density Table View"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-xs">Table</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLedgerLayout('cards')}
                      className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                        ledgerLayout === 'cards' ? 'bg-surface text-brand shadow-xs border border-subtle' : 'text-tertiary hover:text-primary'
                      }`}
                      title="Cards View"
                    >
                      <Grid className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-xs">Cards</span>
                    </button>
                  </div>
                </div>

                {/* Date Presets & Reset Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-divider text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs uppercase font-mono font-bold text-quaternary">Time Range:</span>
                    {(['all', 'today', '7d', '30d'] as const).map((range) => {
                      const label = range === 'all' ? 'All Time' : range === 'today' ? 'Today' : range === '7d' ? 'Past 7 Days' : 'Past 30 Days';
                      const isSelected = ledgerDateRange === range;
                      return (
                        <button
                          key={range}
                          type="button"
                          onClick={() => {
                            setLedgerDateRange(range);
                            setLedgerPage(1);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition border cursor-pointer ${
                            isSelected
                              ? 'bg-brand text-white border-brand shadow-xs'
                              : 'bg-background hover:bg-surface-hover text-secondary hover:text-primary border-subtle'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {(ledgerSearch || ledgerAction || ledgerDateRange !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setLedgerSearch('');
                        setLedgerAction('');
                        setLedgerDateRange('all');
                        setLedgerPage(1);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer flex items-center gap-1 border border-rose-200 dark:border-rose-900/40"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Logs Content Render */}
              {ledgerLoading ? (
                <div className="bg-surface border border-subtle rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-brand animate-spin mb-3" />
                  <p className="text-xs text-secondary font-mono">Querying indexed audit trail...</p>
                </div>
              ) : ledgerLogs.length === 0 ? (
                <div className="bg-surface border border-subtle rounded-2xl p-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-300">
                  <div className="w-16 h-16 bg-brand-subtle rounded-full flex items-center justify-center mb-4">
                    <History className="w-8 h-8 text-brand" />
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-2">No Matching Activity Recorded</h3>
                  <p className="text-secondary-muted text-sm max-w-md mx-auto mb-4">
                    {ledgerSearch || ledgerAction || ledgerDateRange !== 'all'
                      ? 'No audit entries match the current filter criteria. Try resetting or adjusting your search terms.'
                      : 'The system audit log is currently empty. Actions like document uploads, reviews, and role changes will be recorded here.'}
                  </p>
                  {(ledgerSearch || ledgerAction || ledgerDateRange !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setLedgerSearch('');
                        setLedgerAction('');
                        setLedgerDateRange('all');
                        setLedgerPage(1);
                      }}
                      className="bg-brand hover:bg-brand-bolder text-white text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* LAYOUT 1: HIGH-DENSITY TABLE VIEW */}
                  {ledgerLayout === 'table' && (
                    <div className="bg-surface border border-subtle rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[760px]">
                          <thead>
                            <tr className="border-b border-subtle bg-background text-xs font-mono uppercase text-quaternary tracking-wider">
                              <th className="py-3 px-4">Timestamp</th>
                              <th className="py-3 px-4">Action Type</th>
                              <th className="py-3 px-4">Actor</th>
                              <th className="py-3 px-4">Target Resource</th>
                              <th className="py-3 px-4">Details</th>
                              <th className="py-3 px-4 text-center">Security Integrity</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-secondary">
                            {ledgerLogs.map((log) => {
                              const isSystemInit = log.action === 'SYSTEM_INIT';
                              const actionBadgeStyle = isSystemInit
                                ? 'bg-surface-hover text-secondary-muted border-subtle'
                                : log.action.includes('UPLOAD') || log.action.includes('CREATE')
                                ? 'bg-brand-subtle text-brand-bold border-brand-divider'
                                : log.action.includes('APPROVE')
                                ? 'bg-success-subtle text-success-bold border-emerald-100 dark:border-emerald-900/40'
                                : log.action.includes('REJECT')
                                ? 'bg-error-subtle text-error-bold border-error-divider'
                                : log.action.includes('DELETE') || log.action.includes('PURGE')
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'
                                : log.action.includes('REMINDER')
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
                                : log.action.includes('ROLE') || log.action.includes('USER')
                                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/40'
                                : 'bg-brand-subtle text-brand-bold border-brand-divider';

                              return (
                                <tr key={log.id} className="hover:bg-background/80 transition group">
                                  <td className="py-3 px-4 whitespace-nowrap font-mono text-quaternary text-xs">
                                    <div className="font-semibold text-secondary">
                                      {new Date(log.timestamp).toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-tertiary">
                                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold font-mono tracking-wider border ${actionBadgeStyle}`}>
                                      {log.action}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-semibold text-primary">{log.actorName || log.actorEmail.split('@')[0]}</div>
                                    <div className="text-xs text-tertiary font-mono">{log.actorEmail}</div>
                                  </td>
                                  <td className="py-3 px-4">
                                    {log.targetDocumentName ? (
                                      <div className="font-mono text-brand font-semibold max-w-[200px] truncate" title={log.targetDocumentName}>
                                        {log.targetDocumentName}
                                      </div>
                                    ) : (
                                      <span className="text-quaternary font-mono text-xs">—</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="text-xs text-primary max-w-[340px] line-clamp-2" title={log.details}>
                                      {log.details}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4 text-center whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 px-2 py-0.5 rounded-full text-xs font-mono font-bold" title={log.entryHash ? `SHA-256 Hash: ${log.entryHash}` : 'Audit Record Verified'}>
                                      <Shield className="w-3 h-3 text-emerald-500" />
                                      <span>Verified</span>
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* LAYOUT 2: CARDS VIEW */}
                  {ledgerLayout === 'cards' && (
                    <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                      {ledgerLogs.map((log) => {
                        const isSystemInit = log.action === 'SYSTEM_INIT';
                        const actionBadgeStyle = isSystemInit
                          ? 'bg-surface-hover text-secondary-muted border-subtle'
                          : log.action.includes('UPLOAD') || log.action.includes('CREATE')
                          ? 'bg-brand-subtle text-brand-bold border-brand-divider'
                          : log.action.includes('APPROVE')
                          ? 'bg-success-subtle text-success-bold border-emerald-100 dark:border-emerald-900/40'
                          : log.action.includes('REJECT')
                          ? 'bg-error-subtle text-error-bold border-error-divider'
                          : log.action.includes('DELETE') || log.action.includes('PURGE')
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'
                          : log.action.includes('REMINDER')
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
                          : log.action.includes('ROLE') || log.action.includes('USER')
                          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/40'
                          : 'bg-brand-subtle text-brand-bold border-brand-divider';

                        return (
                          <div 
                            key={log.id} 
                            className="bg-surface border border-subtle rounded-2xl p-4 hover:border-subtle-hover transition duration-150 space-y-2.5 shadow-xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-divider pb-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono tracking-wider border ${actionBadgeStyle}`}>
                                  {log.action}
                                </span>
                                <span className="text-xs text-quaternary font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                                {log.targetDocumentName && (
                                  <span className="bg-background text-brand font-mono text-xs px-2 py-0.5 rounded border border-subtle truncate max-w-[240px]">
                                    {log.targetDocumentName}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-tertiary">Actor:</span>
                                <span className="font-semibold text-secondary font-mono">{log.actorEmail}</span>
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded text-xs font-mono font-bold border border-emerald-200 dark:border-emerald-900/40 ml-1">
                                  <Shield className="w-2.5 h-2.5" /> Verified
                                </span>
                              </div>
                            </div>

                            <p className="text-xs sm:text-sm text-primary font-medium">{log.details}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Activity Log Server-Side Pagination Toolbar */}
                  <Pagination
                    currentPage={ledgerPage}
                    totalPages={ledgerTotalPages}
                    totalItems={ledgerTotal}
                    pageSize={ledgerLimit}
                    onPageChange={(newPage) => {
                      setLedgerPage(newPage);
                      fetchLedgerLogs(newPage, ledgerLimit, ledgerSearch, ledgerAction, ledgerDateRange);
                    }}
                    onPageSizeChange={(newLimit) => {
                      setLedgerLimit(newLimit);
                      setLedgerPage(1);
                      fetchLedgerLogs(1, newLimit, ledgerSearch, ledgerAction, ledgerDateRange);
                    }}
                    pageSizeOptions={[10, 25, 50, 100]}
                    itemLabel="events"
                    className="mt-6"
                  />
                </div>
              )}
            </div>
          )}

          {/* --- TAB 5: USERS LIST MANAGEMENT --- */}
          {activeTab === 'users' && currentUser.role === UserRole.ADMIN && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-primary">Registered University Personnel</h2>
                  <p className="text-xs text-tertiary mt-1">
                    Provision Central Department Staff and Board Auditor / Coordinator access clearances.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-semibold px-4 py-2.5 min-h-[44px] rounded-xl text-xs transition shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Register University Staff
                </button>
              </div>

              {/* User Search & Filter Toolbar */}
              <div className="bg-surface border border-subtle rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-quaternary">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setUserPage(1);
                      }}
                      placeholder="Search personnel by name, email, or department..."
                      className="w-full bg-background border border-subtle rounded-xl py-2 pl-9 pr-8 text-primary placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                    />
                    {userSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserSearch('');
                          setUserPage(1);
                        }}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-quaternary hover:text-primary cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Role filter */}
                  <div className="flex items-center gap-1.5 bg-background border border-subtle rounded-xl px-2.5 py-1.5 text-xs shrink-0">
                    <Shield className="w-3.5 h-3.5 text-brand shrink-0" />
                    <select
                      value={userRoleFilter}
                      onChange={(e) => {
                        setUserRoleFilter(e.target.value);
                        setUserPage(1);
                      }}
                      className="bg-transparent text-secondary outline-none text-xs w-full cursor-pointer font-medium"
                    >
                      <option value="all">All Clearance Roles</option>
                      <option value={UserRole.INSTRUCTOR}>INSTRUCTOR</option>
                      <option value={UserRole.DEPT_HEAD}>DEPARTMENT HEAD</option>
                      <option value={UserRole.AUDITOR}>BOARD AUDITOR</option>
                      <option value={UserRole.ADMIN}>SYSTEM ADMIN</option>
                    </select>
                  </div>

                  {/* Status filter */}
                  <div className="flex items-center gap-1.5 bg-background border border-subtle rounded-xl px-2.5 py-1.5 text-xs shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <select
                      value={userStatusFilter}
                      onChange={(e) => {
                        setUserStatusFilter(e.target.value as any);
                        setUserPage(1);
                      }}
                      className="bg-transparent text-secondary outline-none text-xs w-full cursor-pointer font-medium"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Approved Staff</option>
                      <option value="pending">Pending Approval</option>
                    </select>
                  </div>

                  {(userSearch || userRoleFilter !== 'all' || userStatusFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserSearch('');
                        setUserRoleFilter('all');
                        setUserStatusFilter('all');
                        setUserPage(1);
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer flex items-center gap-1 border border-rose-200 dark:border-rose-900/40"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="bg-surface border border-subtle rounded-2xl p-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-300">
                  <div className="w-16 h-16 bg-brand-subtle rounded-full flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-brand" />
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-2">No Matching Personnel Found</h3>
                  <p className="text-secondary-muted text-sm max-w-md mx-auto mb-4">
                    No university personnel match your filter criteria. Try adjusting your search query or role filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setUserSearch('');
                      setUserRoleFilter('all');
                      setUserStatusFilter('all');
                      setUserPage(1);
                    }}
                    className="bg-brand hover:bg-brand-bolder text-white text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  {/* Grid of Users */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedUsers.map(u => {
                      const isEditing = editingUserId === u.id;
                  return (
                    <div key={u.id} className="bg-surface border border-subtle rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-350 hover:shadow-md transition duration-150 shadow-sm space-y-4">
                      <div className="flex items-start gap-4">
                        {u.avatarUrl && !u.avatarUrl.includes('unsplash.com') ? (
                          <img src={u.avatarUrl} alt={u.name} className="w-12 h-12 rounded-xl border border-subtle object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/25 border border-brand/20 font-bold text-brand text-sm flex items-center justify-center shrink-0">
                            {u.name ? u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-primary truncate">{u.name}</h3>
                          <p className="text-xs text-tertiary truncate">{u.email}</p>
                          {u.pendingApproval && (
                            <span className="inline-flex items-center gap-1 bg-warning-subtle text-warning-bold border border-warning-subtle rounded px-1.5 py-0.5 text-xs font-bold font-mono tracking-wider mt-1.5">
                              <Clock className="w-3 h-3 text-warning animate-pulse" /> PENDING APPROVAL
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Role & Dept Editing and display section */}
                      <div className="bg-background border border-divider rounded-xl p-3.5 space-y-3">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-bold text-quaternary uppercase font-mono tracking-wide mb-1">Clearance Role</label>
                              <select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value as UserRole)}
                                className="w-full bg-surface border border-subtle rounded-lg py-1 px-2 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                              >
                                <option value={UserRole.INSTRUCTOR}>INSTRUCTOR</option>
                                <option value={UserRole.DEPT_HEAD}>DEPARTMENT HEAD</option>
                                <option value={UserRole.AUDITOR}>BOARD AUDITOR / COORDINATOR</option>
                                <option value={UserRole.ADMIN}>SYSTEM ADMIN</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-quaternary uppercase font-mono tracking-wide mb-1">Assigned Department</label>
                              <input
                                type="text"
                                value={editDept}
                                onChange={(e) => setEditDept(e.target.value)}
                                placeholder="e.g. CSE"
                                className="w-full bg-surface border border-subtle rounded-lg py-1 px-2 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-quaternary uppercase font-mono tracking-wide">Security Clearance</p>
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold font-mono tracking-wider border mt-1 ${
                                u.role === UserRole.ADMIN ? 'bg-error-subtle text-error-bold border-error-divider' :
                                u.role === UserRole.DEPT_HEAD ? 'bg-brand-subtle text-brand-bold border-brand-divider' :
                                u.role === UserRole.AUDITOR ? 'bg-brand-subtle text-brand-bold border-brand-divider' :
                                'bg-success-subtle text-success-bold border-emerald-100'
                              }`}>
                                {u.role.toUpperCase()}
                              </span>
                            </div>

                            <div className="text-right">
                              <p className="text-xs font-bold text-quaternary uppercase font-mono tracking-wide">Department</p>
                              <span className="text-xs text-secondary font-semibold mt-1 block">
                                {u.department || 'CENTRAL'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions Footer */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="px-2.5 py-1.5 border border-subtle hover:border-subtle-hover text-tertiary hover:text-secondary rounded-lg text-xs transition cursor-pointer bg-surface"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdateUserRoleAndDept(u.id, editRole, editDept, u.pendingApproval || false, u.name)}
                              className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-white font-semibold rounded-lg text-xs transition cursor-pointer"
                            >
                              Save Changes
                            </button>
                          </>
                        ) : (
                          <>
                            {u.pendingApproval && (
                              <button
                                onClick={() => handleUpdateUserRoleAndDept(u.id, u.role, u.department || '', false, u.name || u.email)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-sm shadow-emerald-600/10 mr-auto font-sans"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve Staff
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingUserId(u.id);
                                setEditRole(u.role);
                                setEditDept(u.department || '');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-subtle hover:bg-background text-secondary-muted hover:text-primary-muted rounded-lg text-xs transition cursor-pointer bg-surface"
                            >
                              <Settings className="w-3.5 h-3.5" /> Manage Clearance
                            </button>
                            {currentUser?.role === UserRole.ADMIN && u.id !== currentUser.id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold transition cursor-pointer"
                                title={`Delete ${u.name} from directory`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* User Management Pagination */}
              <Pagination
                currentPage={userPage}
                totalPages={userTotalPages}
                totalItems={filteredUsers.length}
                pageSize={userPageSize}
                onPageChange={setUserPage}
                onPageSizeChange={setUserPageSize}
                pageSizeOptions={[6, 12, 24, 48]}
                itemLabel="staff members"
                className="mt-6"
              />
            </>
          )}
        </div>
      )}

          {/* --- TAB 6: DYNAMIC CATEGORY REQUIREMENT SLOTS --- */}
          {activeTab === 'categories' && currentUser.role === UserRole.ADMIN && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-primary">Document Requirement Slots (Portfolio Config)</h2>
                  <p className="text-xs text-tertiary mt-1">
                    Dynamically configure requirement slots for all course file portfolios across the university. Slots marked as "Core" impact faculty completion percentage.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddCatModal(true)}
                  className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-semibold px-4 py-2.5 min-h-[44px] rounded-xl text-xs transition shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Requirement Slot
                </button>
              </div>

              {/* List of Requirement Slots */}
              <div className="bg-surface border border-subtle rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-surface-hover/50 border-b border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-brand" />
                    <span className="text-xs font-bold text-primary uppercase font-mono tracking-wider">Active Document Slots ({categoriesList.filter(c => c.isActive !== false).length})</span>
                  </div>
                  <span className="text-xs text-quaternary font-mono">
                    {categoriesList.filter(c => c.isCore && c.isActive !== false).length} Core Mandatory • {categoriesList.filter(c => !c.isCore && c.isActive !== false).length} Optional
                  </span>
                </div>

                <div className="divide-y divide-subtle">
                  {categoriesList.filter(c => c.isActive !== false).map(cat => (
                    <div key={cat.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-hover/30 transition duration-150">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-sm font-bold text-primary">{cat.label}</h4>
                          <span className="bg-subtle/40 text-secondary font-mono text-xs px-2 py-0.5 rounded border border-subtle">
                            {cat.group}
                          </span>
                          {cat.isCore ? (
                            <span className="bg-brand-subtle text-brand-bold border border-brand-divider text-xs font-bold font-mono px-2 py-0.5 rounded uppercase">
                              Core Mandatory
                            </span>
                          ) : (
                            <span className="bg-surface-hover text-quaternary text-xs font-bold font-mono px-2 py-0.5 rounded uppercase border border-subtle">
                              Optional Slot
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-quaternary">
                          Internal Key: <code className="bg-background px-1 py-0.5 rounded text-tertiary">{cat.id}</code>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleToggleCategoryCore(cat)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                            cat.isCore 
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20' 
                              : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/20'
                          }`}
                          title="Toggle whether this category is required for 100% completion"
                        >
                          {cat.isCore ? 'Make Optional' : 'Make Core'}
                        </button>
                        <button
                          onClick={() => handleDeleteCategorySlot(cat)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 rounded-lg text-xs font-semibold transition cursor-pointer"
                          title="Deactivate this requirement slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Deactivate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- TAB 7: TRASH & CLOUDFLARE R2 PURGE HUB --- */}
          {activeTab === 'trash' && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DEPT_HEAD) && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-rose-500" /> Document Trash & Cloudflare R2 Storage Purge
                  </h2>
                  <p className="text-xs text-tertiary mt-1">
                    Manage deleted course files. Faculty & Department Heads can restore documents. System Admins can permanently purge files from Cloudflare R2 storage.
                  </p>
                </div>
              </div>

              {trashDocuments.length === 0 ? (
                <div className="text-center py-16 bg-surface rounded-2xl border border-subtle shadow-sm space-y-3">
                  <Trash2 className="w-10 h-10 text-quaternary mx-auto opacity-40" />
                  <h3 className="text-sm font-bold text-primary">Trash is Empty</h3>
                  <p className="text-xs text-tertiary max-w-sm mx-auto">No soft-deleted documents found. Any documents deleted from portfolios will be safely held here prior to permanent storage purging.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Trash Search Toolbar */}
                  <div className="bg-surface border border-subtle rounded-2xl p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-quaternary">
                          <Search className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="text"
                          value={trashSearch}
                          onChange={(e) => {
                            setTrashSearch(e.target.value);
                            setTrashPage(1);
                          }}
                          placeholder="Search trash by file name, course code, category, or uploader..."
                          className="w-full bg-background border border-subtle rounded-xl py-2 pl-9 pr-8 text-primary placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                        />
                        {trashSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setTrashSearch('');
                              setTrashPage(1);
                            }}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-quaternary hover:text-primary cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {trashSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setTrashSearch('');
                            setTrashPage(1);
                          }}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer flex items-center gap-1 border border-rose-200 dark:border-rose-900/40 shrink-0"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredTrash.length === 0 ? (
                    <div className="text-center py-16 bg-surface rounded-2xl border border-subtle shadow-sm space-y-3">
                      <Trash2 className="w-10 h-10 text-quaternary mx-auto opacity-40" />
                      <h3 className="text-sm font-bold text-primary">No Matching Deleted Files</h3>
                      <p className="text-xs text-tertiary max-w-sm mx-auto">No soft-deleted files match your search "{trashSearch}".</p>
                      <button
                        type="button"
                        onClick={() => {
                          setTrashSearch('');
                          setTrashPage(1);
                        }}
                        className="bg-brand hover:bg-brand-bolder text-white text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 mx-auto"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Clear Search
                      </button>
                    </div>
                  ) : (
                    <div className="bg-surface border border-subtle rounded-2xl overflow-hidden shadow-sm">
                      <div className="p-4 bg-rose-500/5 border-b border-rose-500/15 flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-700 uppercase font-mono tracking-wider">
                          Soft-Deleted Archives ({filteredTrash.length})
                        </span>
                        <span className="text-xs text-tertiary font-mono">Protected by 30-day Retention Guard</span>
                      </div>

                      <div className="divide-y divide-subtle">
                        {paginatedTrash.map(doc => {
                          const offering = offerings.find(o => o.id === doc.offeringId);
                          const course = offering ? courses.find(c => c.id === offering.courseId) : null;
                          const catMeta = categoriesList.find(c => c.id === doc.category);
                          
                          return (
                            <div key={doc.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-hover/30 transition duration-150">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-primary">{doc.fileName}</span>
                                  <span className="bg-subtle/50 text-secondary text-xs font-mono px-2 py-0.5 rounded">
                                    {catMeta?.label || doc.category}
                                  </span>
                                </div>
                                <p className="text-xs text-tertiary">
                                  Course: <span className="font-semibold text-secondary">{course?.code || 'N/A'}</span> ({offering?.term} {offering?.academicYear}) • Uploaded by: {doc.uploadedBy}
                                </p>
                                {doc.deletedAt && (
                                  <p className="text-xs font-mono text-quaternary">
                                    Deleted At: {new Date(doc.deletedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 self-end md:self-center">
                                <button
                                  onClick={() => handleRestoreTrashDoc(doc.id, doc.fileName)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 border border-emerald-600/20 rounded-lg text-xs font-semibold transition cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Restore
                                </button>
                                {currentUser.role === UserRole.ADMIN && (
                                  <button
                                    onClick={() => handlePurgeTrashDoc(doc.id, doc.fileName)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-sm shadow-rose-600/10"
                                    title="Permanently delete this object from Cloudflare R2 bucket"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Purge R2 Storage
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Trash Pagination */}
                      <Pagination
                        currentPage={trashPage}
                        totalPages={trashTotalPages}
                        totalItems={filteredTrash.length}
                        pageSize={trashPageSize}
                        onPageChange={setTrashPage}
                        onPageSizeChange={setTrashPageSize}
                        pageSizeOptions={[10, 15, 30, 50]}
                        itemLabel="soft-deleted files"
                        className="border-t border-subtle rounded-none border-x-0 border-b-0"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

      {/* Floating Bottom Action Bar for Selective Export & Print */}
      {selectedDocIdsForBatch.size > 0 && selectedOffering && (
        <div className="fixed bottom-4 sm:bottom-6 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-950/95 text-white border border-slate-700/80 shadow-2xl rounded-2xl p-3 sm:px-5 sm:py-3.5 flex flex-wrap items-center justify-between sm:justify-start gap-2.5 sm:gap-4 backdrop-blur-md animate-slide-up max-w-full sm:max-w-xl">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
              {selectedDocIdsForBatch.size}
            </span>
            <span className="text-xs font-semibold">
              {selectedDocIdsForBatch.size} artifact{selectedDocIdsForBatch.size > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="hidden sm:block h-5 w-px bg-slate-700"></div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <button
              onClick={handleBatchSelectiveExport}
              disabled={isExportingSelective}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isExportingSelective ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{isExportingSelective ? 'Exporting...' : 'ZIP Export'}</span>
            </button>

            <button
              onClick={() => setShowPrintManifestModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Manifest</span>
            </button>

            <button
              onClick={() => setSelectedDocIdsForBatch(new Set())}
              className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 transition cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Batch Print / Transmittal Manifest Modal */}
      {showPrintManifestModal && selectedOffering && (
        <div role="dialog" aria-modal="true" aria-label="Print Portfolio Manifest Modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setShowPrintManifestModal(false)}></div>
          <div className="bg-surface text-primary border border-subtle shadow-2xl rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col z-10 overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-subtle flex items-center justify-between bg-surface shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-brand" />
                <h3 className="font-bold text-base text-primary">Consolidated Batch Print & Document Manifest</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print / Save as PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintManifestModal(false)}
                  className="p-2 text-quaternary hover:text-primary rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Manifest Body */}
            <div className="p-6 overflow-y-auto space-y-6 print:p-0 print:overflow-visible print-container">
              {/* Institutional Header */}
              <div className="border-b-2 border-primary/20 pb-4 text-center space-y-1">
                <span className="text-xs font-bold tracking-widest text-quaternary uppercase font-mono">
                  DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
                </span>
                <h2 className="text-xl font-extrabold text-primary tracking-tight">
                  OFFICIAL COURSE PORTFOLIO TRANSMITTAL MANIFEST
                </h2>
                <p className="text-xs text-secondary font-mono">
                  Continuous Quality Improvement (CQI) & Institutional Accreditation Documentation
                </p>
              </div>

              {/* Course & Instructor Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-background p-4 rounded-xl border border-subtle text-xs">
                <div>
                  <span className="text-xs uppercase font-bold text-quaternary font-mono block">Course Code</span>
                  <span className="font-bold text-primary">{selectedOffering.course?.code || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-quaternary font-mono block">Course Title</span>
                  <span className="font-bold text-primary truncate block">{selectedOffering.course?.title || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-quaternary font-mono block">Academic Session</span>
                  <span className="font-bold text-primary">{selectedOffering.term} {selectedOffering.academicYear} (Sec {selectedOffering.section})</span>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-quaternary font-mono block">Lead Instructor</span>
                  <span className="font-bold text-primary">{selectedOffering.instructor?.name || 'Dr. Alice Smith'}</span>
                </div>
              </div>

              {/* Selected Artifacts Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-quaternary font-mono">
                    Selected Items for Transmittal & Review ({selectedDocIdsForBatch.size} Artifacts)
                  </h4>
                  <span className="text-xs text-tertiary font-mono">
                    Generated: {new Date().toLocaleString()}
                  </span>
                </div>

                <div className="border border-subtle rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-background text-quaternary uppercase font-mono text-xs border-b border-subtle">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Requirement Item</th>
                        <th className="py-2.5 px-3">Archived Filename</th>
                        <th className="py-2.5 px-3">Version</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {documents
                        .filter(d => selectedDocIdsForBatch.has(d.id) && d.offeringId === selectedOffering.id && d.isCurrent)
                        .map((doc, idx) => (
                          <tr key={doc.id} className="hover:bg-background/50">
                            <td className="py-2 px-3 font-mono text-tertiary font-bold">{idx + 1}</td>
                            <td className="py-2 px-3 font-semibold text-primary">{getCategoryLabel(doc.category)}</td>
                            <td className="py-2 px-3 font-mono text-secondary text-xs truncate max-w-[220px]">{doc.fileName}</td>
                            <td className="py-2 px-3 font-mono text-tertiary">v{doc.version}</td>
                            <td className="py-2 px-3">
                              <span className={`inline-flex items-center gap-1 font-mono text-xs font-bold uppercase px-1.5 py-0.5 rounded ${
                                doc.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' :
                                doc.status === 'rejected' ? 'bg-rose-500/10 text-rose-600' :
                                'bg-amber-500/10 text-amber-600'
                              }`}>
                                {doc.status === 'approved' ? 'Verified' : doc.status === 'rejected' ? 'Rejected' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Endorsement & Signature Badges */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-subtle">
                <div className="p-3 bg-background rounded-xl border border-subtle space-y-1">
                  <span className="text-xs uppercase font-bold text-quaternary font-mono block">Instructor Verification</span>
                  <p className="text-xs text-secondary font-semibold">{selectedOffering.instructor?.name || 'Lead Instructor'}</p>
                  {selectedOffering.submitterSignatureUrl ? (
                    <div className="bg-white rounded p-1 inline-block border border-slate-200 mt-1">
                      <img src={selectedOffering.submitterSignatureUrl} alt="Signature" className="h-7 object-contain" />
                    </div>
                  ) : (
                    <span className="text-xs text-tertiary font-mono italic">Signature Pending</span>
                  )}
                </div>

                <div className="p-3 bg-background rounded-xl border border-subtle space-y-1">
                  <span className="text-xs uppercase font-bold text-quaternary font-mono block">Department Head Endorsement</span>
                  <p className="text-xs text-secondary font-semibold">Department Head / Chair</p>
                  {selectedOffering.approverSignatureUrl ? (
                    <div className="bg-white rounded p-1 inline-block border border-slate-200 mt-1">
                      <img src={selectedOffering.approverSignatureUrl} alt="Signature" className="h-7 object-contain" />
                    </div>
                  ) : (
                    <span className="text-xs text-tertiary font-mono italic">Endorsement Pending</span>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-background border-t border-subtle flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleBatchSelectiveExport}
                className="text-xs font-semibold text-brand hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download as ZIP instead
              </button>
              <button
                type="button"
                onClick={() => setShowPrintManifestModal(false)}
                className="px-4 py-1.5 bg-surface hover:bg-surface-hover text-secondary border border-subtle font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Core 8 CSE Accreditation Benchmark Matrix Modal */}
      {showCore8HubModal && (
        <div role="dialog" aria-modal="true" aria-label="Core 8 Hub Benchmark Matrix Modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setShowCore8HubModal(false)}></div>
          <div className="bg-surface text-primary border border-subtle shadow-2xl rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col z-10 overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-subtle flex items-center justify-between bg-surface shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-primary">8 Core CSE Benchmark Courses</h3>
                  <p className="text-xs text-tertiary">Foundational curriculum pillars evaluated for Outcome-Based Education (OBE)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCore8HubModal(false)}
                className="p-2 text-quaternary hover:text-primary rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-200">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Why are these 8 subjects prioritized?
                </p>
                <p className="opacity-90 leading-relaxed">
                  Departmental heads and review coordinators systematically audit course files from these 8 foundational subjects to verify progression across all 12 Program Outcomes (PO1 to PO12), question paper cognitive levels (Bloom&apos;s Taxonomy), continuous quality improvement (CQI), and authentic representative student scripts.
                </p>
              </div>

              <div className="border border-subtle rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-background text-quaternary uppercase font-mono text-xs border-b border-subtle">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Course Code</th>
                      <th className="py-2.5 px-3">Official Title</th>
                      <th className="py-2.5 px-3">Curriculum Pillar</th>
                      <th className="py-2.5 px-3">Evaluation Focus</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle font-sans">
                    {CORE_8_CSE_BENCHMARKS.map((item, idx) => (
                      <tr key={item.code} className="hover:bg-background/50">
                        <td className="py-3 px-3 font-mono text-tertiary font-bold">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-bold text-brand">{item.code}</td>
                        <td className="py-3 px-3 font-semibold text-primary">{item.title}</td>
                        <td className="py-3 px-3">
                          <span className="bg-surface-hover text-secondary px-2 py-0.5 rounded text-xs font-mono font-medium">
                            {item.pillar}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-tertiary text-xs max-w-[220px]">{item.focus}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setGlobalCourseCode(item.code);
                              setBrowseMode('global');
                              setShowCore8HubModal(false);
                            }}
                            className="text-xs font-bold text-brand hover:underline cursor-pointer"
                          >
                            Filter &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-background border-t border-subtle flex items-center justify-between shrink-0">
              <span className="text-xs text-tertiary font-mono">
                University Curriculum Standard Benchmark Map
              </span>
              <button
                type="button"
                onClick={() => setShowCore8HubModal(false)}
                className="px-4 py-1.5 bg-surface hover:bg-surface-hover text-secondary border border-subtle font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
      </div>

      {/* --- FORM MODALS --- */}

      {/* Modal 1: Register Course */}
      {showAddCourse && (
        <div role="dialog" aria-modal="true" aria-label="Add Course Modal" className="fixed inset-0 bg-inverse-surface-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-subtle w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-sm font-bold text-primary uppercase font-mono tracking-wider">Register Syllabus Course</h3>
              <p className="text-xs text-tertiary mt-1">Register a standard university curriculum catalog item.</p>
            </div>

            <form onSubmit={handleAddCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Course Code</label>
                <input
                  type="text"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  placeholder="e.g. CSE407"
                  className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Syllabus Title</label>
                <input
                  type="text"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder="e.g. Software Engineering"
                  className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Offering Department</label>
                <input
                  type="text"
                  value={newCourseDept}
                  onChange={(e) => setNewCourseDept(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {courseFormError && (
                <p className="text-xs text-error-muted flex items-center gap-1 font-mono"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {courseFormError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourse(false)}
                  className="px-4 py-2 border border-subtle rounded-xl text-tertiary hover:text-primary-muted text-xs transition cursor-pointer hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white font-semibold rounded-xl text-xs transition cursor-pointer shadow-sm shadow-indigo-600/10"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Term Offering */}
      {showAddOffering && (
        <div className="fixed inset-0 bg-inverse-surface-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-subtle w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-sm font-bold text-primary uppercase font-mono tracking-wider">Create Course Offering</h3>
              <p className="text-xs text-tertiary mt-1">Assign an active course to an academic term section and an instructor.</p>
            </div>

            <form onSubmit={handleAddOffering} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Select Course</label>
                <select
                  value={newOffCourseId}
                  onChange={(e) => setNewOffCourseId(e.target.value)}
                  className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Syllabus Item --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code}: {c.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Academic Year</label>
                  <input
                    type="number"
                    value={newOffYear}
                    onChange={(e) => setNewOffYear(Number(e.target.value))}
                    className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Term</label>
                  <select
                    value={newOffTerm}
                    onChange={(e) => setNewOffTerm(e.target.value as Term)}
                    className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={Term.SPRING}>{Term.SPRING}</option>
                    <option value={Term.SUMMER}>{Term.SUMMER}</option>
                    <option value={Term.FALL}>{Term.FALL}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Section</label>
                  <input
                    type="text"
                    value={newOffSection}
                    onChange={(e) => setNewOffSection(e.target.value)}
                    placeholder="e.g. 01"
                    className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Instructor</label>
                  <select
                    value={newOffInstructorId}
                    onChange={(e) => setNewOffInstructorId(e.target.value)}
                    className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Assign Staff --</option>
                    {usersList
                      .filter(u => u.role === UserRole.INSTRUCTOR || u.role === UserRole.DEPT_HEAD || u.role === UserRole.ADMIN)
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role === UserRole.DEPT_HEAD ? 'Dept Head' : u.role === UserRole.ADMIN ? 'Admin' : 'Faculty'})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Board Auditor / Coordinator (Optional)</label>
                <select
                  value={newOffAuditorId}
                  onChange={(e) => setNewOffAuditorId(e.target.value)}
                  className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Assign Board Auditor / Coordinator (Optional) --</option>
                  {usersList
                    .filter(u => u.role === UserRole.AUDITOR)
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
              </div>

              {offeringFormError && (
                <p className="text-xs text-error-muted flex items-center gap-1 font-mono"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {offeringFormError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddOffering(false)}
                  className="px-4 py-2 border border-subtle rounded-xl text-tertiary hover:text-primary-muted text-xs transition cursor-pointer hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white font-semibold rounded-xl text-xs transition cursor-pointer shadow-sm shadow-indigo-600/10"
                >
                  Create Offering
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add Staff User */}
      {showAddUser && (
        <div className="fixed inset-0 bg-inverse-surface-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-subtle w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-sm font-bold text-primary uppercase font-mono tracking-wider">Register staff user</h3>
              <p className="text-xs text-tertiary mt-1">Provision a standard role in the relational database.</p>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Dr. Alice Smith"
                  className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Email ID</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="staff@university.edu"
                  className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Role Clearance</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={UserRole.INSTRUCTOR}>INSTRUCTOR</option>
                    <option value={UserRole.DEPT_HEAD}>DEPARTMENT HEAD</option>
                    <option value={UserRole.AUDITOR}>BOARD AUDITOR / COORDINATOR</option>
                    <option value={UserRole.ADMIN}>SYSTEM ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Department</label>
                  <input
                    type="text"
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {userFormError && (
                <p className="text-xs text-error-muted flex items-center gap-1 font-mono"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {userFormError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 border border-subtle rounded-xl text-tertiary hover:text-primary-muted text-xs transition cursor-pointer hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white font-semibold rounded-xl text-xs transition cursor-pointer shadow-sm shadow-indigo-600/10"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Add Requirement Slot */}
      {showAddCatModal && (
        <div className="fixed inset-0 bg-inverse-surface-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-subtle w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-sm font-bold text-primary uppercase font-mono tracking-wider">Add Requirement Slot</h3>
              <p className="text-xs text-tertiary mt-1">Add a new dynamic document slot requirement to university portfolios.</p>
            </div>

            <form onSubmit={handleAddCategorySlot} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Slot Display Label</label>
                <input
                  type="text"
                  value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  placeholder="e.g. Continuous Quality Improvement Report"
                  required
                  className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Group / Section</label>
                <select
                  value={newCatGroup}
                  onChange={(e) => setNewCatGroup(e.target.value)}
                  className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Syllabus & Info">Syllabus & Info</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Class Tests">Class Tests</option>
                  <option value="Midterms">Midterms</option>
                  <option value="Finals">Finals</option>
                  <option value="Labs & Projects">Labs & Projects</option>
                  <option value="Grades & Attainment">Grades & Attainment</option>
                  <option value="Custom Requirements">Custom Requirements</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-surface-hover p-3 rounded-xl border border-subtle">
                <div>
                  <span className="text-xs font-bold text-primary block">Mandatory Core Requirement</span>
                  <span className="text-xs text-tertiary block">If enabled, this slot is required for 100% completion.</span>
                </div>
                <input
                  type="checkbox"
                  checked={newCatIsCore}
                  onChange={(e) => setNewCatIsCore(e.target.checked)}
                  className="w-4 h-4 rounded text-brand focus:ring-brand cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-subtle">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-4 py-2 border border-subtle hover:bg-background text-secondary rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md"
                >
                  Save Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Bulk Upload & Auto-Categorization Processing Drawer */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-inverse-surface-dark/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-subtle w-full max-w-4xl rounded-3xl p-6 shadow-2xl space-y-5 max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-subtle pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand/10 border border-brand/20 text-brand rounded-2xl">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-primary">Bulk Course File Ingestion</h3>
                    <span className="bg-brand/15 text-brand-bold text-xs font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-brand/30">
                      <Zap className="w-3 h-3 text-amber-500" /> Auto-Categorization Active
                    </span>
                  </div>
                  <p className="text-xs text-tertiary mt-0.5">
                    Select multiple course files at once. System automatically detects document categories from file naming patterns.
                  </p>
                </div>
              </div>

              <button
                disabled={isBulkProcessing}
                onClick={() => setShowBulkUploadModal(false)}
                className="p-2 text-tertiary hover:text-primary rounded-xl hover:bg-surface-hover transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hidden Input for Multi-file Browse */}
            <input
              type="file"
              ref={bulkFileInputRef}
              multiple
              className="hidden"
              accept=".pdf,application/pdf,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  addFilesToBulkQueue(e.target.files);
                  e.target.value = '';
                }
              }}
            />

            <div className="space-y-4 overflow-y-auto pr-1 flex-grow">
              
              {/* Controls Bar: Default Offering Selection & Quick Batch Generator */}
              <div className="bg-background/80 border border-subtle rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-auto flex-grow flex flex-col sm:flex-row items-center gap-3">
                  <label className="text-xs font-bold text-secondary shrink-0 font-mono">Target Offering:</label>
                  <select
                    value={globalBulkOfferingId || selectedOffering?.id || ''}
                    onChange={(e) => applyGlobalOfferingToAllQueueItems(e.target.value)}
                    className="w-full sm:w-auto bg-surface border border-subtle rounded-xl py-2 px-3 text-primary text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {offerings.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.course?.code} — {o.course?.title} ({o.term} {o.academicYear})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={isBulkProcessing}
                    onClick={addMockSampleBatchToQueue}
                    className="bg-brand/10 hover:bg-brand/20 text-brand-bold border border-brand/30 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Load 5 Sample Files
                  </button>
                  <button
                    type="button"
                    disabled={isBulkProcessing}
                    onClick={() => bulkFileInputRef.current?.click()}
                    className="bg-brand hover:bg-brand-hover text-white rounded-xl px-4 py-2 text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Browse Multi-Files
                  </button>
                </div>
              </div>

              {/* Drag & Drop Multi-file Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setBulkDragActive(true);
                }}
                onDragLeave={() => setBulkDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setBulkDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    addFilesToBulkQueue(e.dataTransfer.files);
                  }
                }}
                onClick={() => bulkFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                  bulkDragActive 
                    ? 'border-brand bg-brand/10' 
                    : 'border-subtle-hover hover:border-brand/50 bg-background/50'
                }`}
              >
                <UploadCloud className="w-8 h-8 text-brand mb-2 animate-bounce" />
                <p className="text-xs font-bold text-primary">
                  Drag & drop multiple course files here, or <span className="text-brand underline">browse your device</span>
                </p>
                <p className="text-xs text-tertiary mt-1 font-mono">
                  Supported formats: PDF, Word (.docx), Excel (.xlsx) • Select 5, 10, or 20+ files at once
                </p>
              </div>

              {/* Progress bar when processing bulk queue */}
              {isBulkProcessing && (
                <div className="bg-brand/10 border border-brand/20 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-brand">
                    <span>PROCESSING BULK QUEUE IN PROGRESS...</span>
                    <span>{bulkOverallProgress}%</span>
                  </div>
                  <div className="w-full bg-surface-hover h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand h-full transition-all duration-300 rounded-full" 
                      style={{ width: `${bulkOverallProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Queue Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold text-secondary uppercase font-mono tracking-wider flex items-center gap-2">
                    <span>Processing Queue</span>
                    <span className="bg-surface-hover border border-subtle px-2 py-0.5 rounded-full text-xs text-primary">
                      {bulkQueue.length} files
                    </span>
                  </h4>

                  {bulkQueue.length > 0 && (
                    <div className="flex items-center gap-3 text-xs text-tertiary font-mono">
                      <span className="text-success-bold">✓ {bulkQueue.filter(q => q.status === 'completed').length} completed</span>
                      {bulkQueue.filter(q => q.status === 'error').length > 0 && (
                        <span className="text-error-bold">✕ {bulkQueue.filter(q => q.status === 'error').length} error</span>
                      )}
                    </div>
                  )}
                </div>

                {bulkQueue.length === 0 ? (
                  <div className="text-center py-10 bg-background/40 border border-subtle rounded-2xl space-y-2">
                    <FileText className="w-10 h-10 text-quaternary mx-auto" />
                    <p className="text-xs font-bold text-secondary">No files in queue yet</p>
                    <p className="text-xs text-tertiary max-w-sm mx-auto">
                      Drop files into the zone above or click "Browse Multi-Files" or "Load 5 Sample Files" to populate the auto-categorization queue.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-subtle border border-subtle rounded-2xl bg-surface overflow-hidden">
                    {bulkQueue.map((item) => (
                      <div key={item.id} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-background/40 transition">
                        
                        {/* File Details & Match Info */}
                        <div className="flex items-start gap-3 min-w-0 flex-grow">
                          <div className={`p-2.5 rounded-xl border shrink-0 ${
                            item.status === 'completed' ? 'bg-success-subtle border-success-subtle text-success-bold' :
                            item.status === 'error' ? 'bg-error-subtle border-error-subtle text-error-bold' :
                            item.status === 'uploading' ? 'bg-brand/10 border-brand/20 text-brand' :
                            'bg-surface-hover border-subtle text-tertiary'
                          }`}>
                            <FileText className="w-5 h-5" />
                          </div>

                          <div className="min-w-0 flex-grow space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-primary truncate max-w-xs">{item.fileName}</span>
                              <span className="text-xs text-tertiary font-mono">({item.fileSizeFormatted})</span>
                              
                              {/* Confidence Badge */}
                              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                item.confidence === 'high' ? 'bg-success-subtle text-success-bolder border border-success-subtle' :
                                item.confidence === 'medium' ? 'bg-warning-subtle text-warning-bolder border border-warning-subtle' :
                                'bg-surface-hover text-tertiary border border-subtle'
                              }`}>
                                <Zap className="w-2.5 h-2.5" /> {item.matchedPattern}
                              </span>
                            </div>

                            {/* Status Message / Error */}
                            {item.status === 'error' && item.errorMessage && (
                              <p className="text-xs text-error font-mono flex items-center gap-1 font-semibold">
                                <AlertCircle className="w-3 h-3 shrink-0" /> {item.errorMessage}
                              </p>
                            )}

                            {item.status === 'uploading' && (
                              <div className="w-full max-w-xs bg-surface-hover h-1.5 rounded-full overflow-hidden">
                                <div className="bg-brand h-full transition-all duration-300 rounded-full" style={{ width: `${item.progress}%` }}></div>
                              </div>
                            )}

                            {item.status === 'completed' && (
                              <p className="text-xs text-success-bold font-mono flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Compiled and locked in course archive!
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Dropdown Selectors for Offering & Category */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                          {/* Offering Dropdown */}
                          <select
                            disabled={isBulkProcessing || item.status === 'completed'}
                            value={item.offeringId}
                            onChange={(e) => updateBulkQueueItemOffering(item.id, e.target.value)}
                            className="bg-background border border-subtle rounded-xl py-1.5 px-2.5 text-xs text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[150px] truncate"
                          >
                            {offerings.map(o => (
                              <option key={o.id} value={o.id}>
                                {o.course?.code} ({o.term})
                              </option>
                            ))}
                          </select>

                          {/* Category Dropdown */}
                          <select
                            disabled={isBulkProcessing || item.status === 'completed'}
                            value={item.selectedCategory}
                            onChange={(e) => updateBulkQueueItemCategory(item.id, e.target.value as DocumentCategory)}
                            className="bg-background border border-subtle rounded-xl py-1.5 px-2.5 text-xs text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[190px] truncate"
                          >
                            {categoriesList.filter(c => c.isActive !== false).map(cat => (
                              <option key={cat.id} value={cat.id}>
                                [{cat.group}] {cat.label}
                              </option>
                            ))}
                          </select>

                          {/* Delete Item */}
                          <button
                            type="button"
                            disabled={isBulkProcessing}
                            onClick={() => removeFromBulkQueue(item.id)}
                            className="p-1.5 text-tertiary hover:text-error rounded-lg hover:bg-error-subtle/30 transition cursor-pointer disabled:opacity-50"
                            title="Remove from queue"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="border-t border-subtle pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {bulkQueue.some(q => q.status === 'completed') && (
                  <button
                    type="button"
                    disabled={isBulkProcessing}
                    onClick={clearCompletedBulkQueue}
                    className="text-xs text-tertiary hover:text-primary px-3 py-1.5 border border-subtle rounded-xl hover:bg-surface-hover transition cursor-pointer"
                  >
                    Clear Completed
                  </button>
                )}
                {bulkQueue.length > 0 && (
                  <button
                    type="button"
                    disabled={isBulkProcessing}
                    onClick={clearAllBulkQueue}
                    className="text-xs text-error hover:underline px-2 py-1.5 cursor-pointer font-semibold"
                  >
                    Clear Queue
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isBulkProcessing}
                  onClick={() => setShowBulkUploadModal(false)}
                  className="px-4 py-2 border border-subtle rounded-xl text-tertiary hover:text-primary-muted text-xs font-semibold transition cursor-pointer hover:bg-background disabled:opacity-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isBulkProcessing || bulkQueue.filter(q => q.status === 'queued' || q.status === 'error').length === 0}
                  onClick={processBulkQueue}
                  className={`px-5 py-2.5 font-bold rounded-xl text-xs transition cursor-pointer shadow-md flex items-center gap-2 ${
                    isBulkProcessing || bulkQueue.filter(q => q.status === 'queued' || q.status === 'error').length === 0
                      ? 'bg-border-subtle text-quaternary cursor-not-allowed shadow-none'
                      : 'bg-brand hover:bg-brand-hover text-white shadow-indigo-600/20'
                  }`}
                >
                  {isBulkProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing Bulk Queue ({bulkOverallProgress}%)</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Process Bulk Queue ({bulkQueue.filter(q => q.status === 'queued' || q.status === 'error').length} items)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
      {showUploadDoc && selectedOffering && (
        <div className="fixed inset-0 bg-inverse-surface-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-subtle w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-subtle pb-3">
              <h3 className="text-sm font-bold text-primary uppercase font-mono tracking-wider flex items-center gap-1.5">
                <FileUp className="w-4 h-4 text-brand" /> Secure Course-File Upload Compilation
              </h3>
              <p className="text-xs text-tertiary mt-1">
                Submitting file to folder: <span className="text-primary-muted font-semibold">{selectedOffering.course?.code} ({selectedOffering.term} {selectedOffering.academicYear})</span>
              </p>
            </div>

            <form onSubmit={handleUploadDoc} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-grow w-full">
                  <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Document Category ({categoriesList.filter(c => c.isActive !== false).length} slots active)</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                    className="w-full bg-background border border-subtle rounded-xl py-2.5 px-3 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {categoriesList.filter(c => c.isActive !== false).map(cat => (
                      <option key={cat.id} value={cat.id}>[{cat.group}] — {cat.label}</option>
                    ))}
                  </select>
                </div>
                
                {!selectedFile && (
                  <button
                    type="button"
                    onClick={generatePredefinedText}
                    className="bg-surface-hover hover:bg-border-subtle text-brand-bold border border-subtle rounded-xl px-4 py-2.5 text-xs font-semibold shrink-0 cursor-pointer transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-once" /> Auto-Fill Template
                  </button>
                )}
              </div>

              {/* Drag & Drop Upload Zone */}
              <div 
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const file = e.dataTransfer.files[0];
                    setSelectedFile(file);
                    const validation = validateFileType(uploadCategory, file);
                    if (!validation.isValid) {
                      setUploadFormError(validation.error || 'Invalid file type');
                    } else {
                      setUploadFormError('');
                    }
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                  isDragging ? 'border-brand bg-brand-subtle' : 
                  selectedFile ? 'border-success bg-success-subtle/20' : 'border-subtle-hover hover:border-indigo-400'
                }`}
              >
                <input 
                  type="file" 
                  id="real-file-upload" 
                  className="hidden" 
                  accept=".pdf,application/pdf,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const file = e.target.files[0];
                      setSelectedFile(file);
                      const validation = validateFileType(uploadCategory, file);
                      if (!validation.isValid) {
                        setUploadFormError(validation.error || 'Invalid file type');
                      } else {
                        setUploadFormError('');
                      }
                    }
                  }}
                />
                
                {selectedFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-left">
                      <div className="p-3 bg-success-subtle-hover text-success-bold rounded-lg">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-primary-muted truncate max-w-[320px]">{selectedFile.name}</p>
                        <p className="text-xs text-tertiary font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadFormError('');
                      }}
                      className="text-xs text-error-muted hover:text-error-bolder font-bold px-2.5 py-1.5 rounded-lg border border-error-subtle hover:bg-error-subtle transition cursor-pointer"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <label htmlFor="real-file-upload" className="block w-full h-full cursor-pointer">
                    <FileUp className="w-8 h-8 text-quaternary mx-auto mb-2 animate-bounce" />
                    <p className="text-xs font-bold text-secondary">Drag & drop files here, or <span className="text-brand underline">browse</span></p>
                    <p className="text-xs text-quaternary mt-1 font-mono">PDF, DOCX, XLSX (Up to 10MB)</p>
                  </label>
                )}
              </div>

              {/* Dynamic Target Filename Preview & Format Verification Badge */}
              <div className="bg-background border border-subtle/60 rounded-xl p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-secondary">
                    <Lock className="w-4 h-4 text-brand-muted shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider font-mono">Target Stored Filename</span>
                  </div>
                  <span className="text-xs font-bold bg-brand-subtle text-brand-bold border border-brand-divider px-2 py-0.5 rounded uppercase font-mono">
                    Auto-Generated
                  </span>
                </div>
                
                {(() => {
                  const ext = selectedFile 
                    ? (selectedFile.name.split('.').pop()?.toLowerCase() || 'pdf') 
                    : (uploadCategory === 'obe_excel' ? 'xlsx' : 'pdf');
                  const filename = generateStoredFilename(selectedOffering, uploadCategory, ext);
                  return (
                    <div 
                      onClick={() => {
                        navigator.clipboard.writeText(filename);
                        showNotification('Copied auto-generated filename to clipboard!', 'info');
                      }}
                      className="bg-surface border border-subtle px-3 py-2.5 rounded-xl font-mono text-xs font-bold text-primary-muted break-all select-all flex items-center justify-between gap-2 shadow-sm cursor-pointer hover:border-indigo-400 transition"
                      title="Click to Copy Filename"
                    >
                      <span>{filename}</span>
                      <span className="text-xs font-normal text-brand-muted select-none shrink-0">Click to copy</span>
                    </div>
                  );
                })()}

                {selectedFile && (() => {
                  const validation = validateFileType(uploadCategory, selectedFile);
                  return (
                    <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold ${
                      validation.isValid 
                        ? 'bg-success-subtle text-success-bolder border-success-subtle/60' 
                        : 'bg-error-subtle text-error-bolder border-error-subtle/60'
                    }`}>
                      {validation.isValid ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-success shrink-0" />
                          <span>✓ File matches required category format (.{selectedFile.name.split('.').pop()?.toLowerCase()})</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-error shrink-0" />
                          <span>{validation.error}</span>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              {!selectedFile && (
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-divider"></div>
                  <span className="flex-shrink mx-4 text-xs font-mono text-quaternary uppercase tracking-wider">Or Use Plain-Text payload</span>
                  <div className="flex-grow border-t border-divider"></div>
                </div>
              )}

              {!selectedFile && (
                <div>
                  <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Document Text Payload (Simulating PDF/Excel compilation)</label>
                  <textarea
                    value={uploadText}
                    onChange={(e) => setUploadText(e.target.value)}
                    placeholder="Write course outlines, attendance metrics, grades summaries or copy standard reports here to compile the secured file."
                    rows={6}
                    className="w-full bg-background border border-subtle rounded-xl py-3 px-3 text-primary text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  ></textarea>
                </div>
              )}

              {isUploading && (
                <div className="space-y-1.5 py-1">
                  <div className="flex items-center justify-between text-xs text-brand font-mono font-bold">
                    <span>TRANSMITTING TO CLOUDFLARE R2...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-surface-hover h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand h-full transition-all duration-300 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {uploadFormError && (
                <p className="text-xs text-error-muted flex items-center gap-1 font-mono"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {uploadFormError}</p>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-quaternary font-mono max-w-[280px]">
                  Standardized filename will be assigned upon submission.
                </span>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => setShowUploadDoc(false)}
                    className="px-4 py-2 border border-subtle rounded-xl text-tertiary hover:text-primary-muted text-xs transition cursor-pointer hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || (selectedFile ? !validateFileType(uploadCategory, selectedFile).isValid : false)}
                    className={`px-5 py-2 font-semibold rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5 ${
                      isUploading || (selectedFile && !validateFileType(uploadCategory, selectedFile).isValid)
                        ? 'bg-border-subtle text-quaternary cursor-not-allowed shadow-none'
                        : 'bg-brand hover:bg-brand-hover text-white shadow-indigo-600/10'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading ({uploadProgress}%)</span>
                      </>
                    ) : (
                      'Compile & Lock Submission'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div role="dialog" aria-modal="true" aria-label="Confirmation Dialog" className="fixed inset-0 bg-overlay backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface border border-subtle w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-bold text-primary">{confirmDialog.title}</h3>
              <p className="text-sm text-secondary-muted mt-2 leading-relaxed">{confirmDialog.message}</p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-surface-hover text-secondary hover:text-primary rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${confirmDialog.isDestructive ? 'bg-error hover:bg-error-hover shadow-error/10' : 'bg-brand hover:bg-brand-hover shadow-brand/10'}`}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Review Document Status */}
      {showReviewDoc && (
        <div className="fixed inset-0 bg-inverse-surface-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-subtle w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-subtle pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-brand" /> Verify Submission
                </h3>
                {(() => {
                  const docOffering = offerings.find(o => o.id === showReviewDoc.offeringId);
                  const isSelfReview = docOffering && docOffering.instructorId === currentUser.id;
                  return isSelfReview ? (
                    <span className="text-xs font-bold font-mono bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                      Self-Review (Course Instructor)
                    </span>
                  ) : null;
                })()}
              </div>
              <p className="text-xs text-tertiary mt-1">
                File: <span className="text-primary-muted font-mono font-semibold">{showReviewDoc.fileName}</span>
              </p>
            </div>

            <form onSubmit={handleReviewDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1.5">Verification Action</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('approved')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold font-mono border transition flex items-center justify-center gap-2 cursor-pointer ${
                      reviewStatus === 'approved' 
                        ? 'bg-success-subtle border-success text-success-bold' 
                        : 'bg-background border-subtle text-quaternary hover:text-secondary-muted'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" /> VERIFY & APPROVE
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('rejected')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold font-mono border transition flex items-center justify-center gap-2 cursor-pointer ${
                      reviewStatus === 'rejected' 
                        ? 'bg-error-subtle border-error text-error-bold' 
                        : 'bg-background border-subtle text-quaternary hover:text-secondary-muted'
                    }`}
                  >
                    <XCircle className="w-4 h-4" /> REJECT & SEND BACK
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Feedback/Review Comments</label>
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Provide approval reasoning or exact change requirements for the instructor."
                  rows={4}
                  className="w-full bg-background border border-subtle rounded-xl py-3 px-3 text-primary text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                ></textarea>
              </div>

              {reviewError && (
                <p className="text-xs text-error-muted flex items-center gap-1 font-mono"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {reviewError}</p>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-subtle">
                <button
                  type="button"
                  onClick={() => setShowReviewDoc(null)}
                  className="px-4 py-2 border border-subtle rounded-xl text-tertiary hover:text-primary-muted text-xs transition cursor-pointer hover:bg-background"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  {reviewStatus === 'rejected' ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleReviewDoc(e, false)}
                        className="px-3.5 py-2 border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 rounded-xl text-xs font-semibold transition cursor-pointer"
                        title="Save rejected status without opening email"
                      >
                        Save Only
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleReviewDoc(e, true)}
                        className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-rose-600/20 flex items-center gap-1.5"
                        title="Save status & open pre-composed revision request email in Gmail"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Save & Open Email in Gmail</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand hover:bg-brand-hover text-white font-semibold rounded-xl text-xs transition cursor-pointer shadow-sm shadow-indigo-600/10 flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Save & Verify File</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Document Version History Modal */}
      {historyModalCategory && historyModalOfferingId && (() => {
        const modalOffering = offerings.find(o => o.id === historyModalOfferingId);
        const categoryDocHistory = documents
          .filter(d => d.offeringId === historyModalOfferingId && d.category === historyModalCategory)
          .sort((a, b) => b.version - a.version);

        const currentActiveDoc = categoryDocHistory.find(d => d.isCurrent) || categoryDocHistory[0];
        const isPrivilegedUser = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DEPT_HEAD;

        return (
          <div role="dialog" aria-modal="true" aria-label="Bulk Upload Modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-surface border border-subtle rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl space-y-5 animate-scale-up">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-subtle pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand uppercase font-mono tracking-wider">Document Timeline</span>
                      <span className="text-xs text-quaternary font-mono">• {categoryDocHistory.length} Version{categoryDocHistory.length === 1 ? '' : 's'}</span>
                    </div>
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                      {getCategoryLabel(historyModalCategory)}
                    </h3>
                    {modalOffering && (
                      <p className="text-xs text-tertiary mt-0.5">
                        <span className="font-mono font-semibold">{modalOffering.course?.code || modalOffering.courseId}</span> - {modalOffering.term} {modalOffering.academicYear} {modalOffering.instructor?.name ? `(${modalOffering.instructor.name})` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setHistoryModalCategory(null);
                    setHistoryModalOfferingId(null);
                  }}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center text-quaternary hover:text-primary rounded-lg hover:bg-surface-hover transition cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner */}
              {currentActiveDoc ? (
                <div className="bg-background border border-subtle rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-xs text-quaternary uppercase font-mono block">Active Version</span>
                    <span className="font-mono font-bold text-brand">v{currentActiveDoc.version}</span> - <span className="font-semibold text-secondary-muted">{currentActiveDoc.fileName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-quaternary uppercase font-mono">Status:</span>
                    {currentActiveDoc.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-success-bold bg-success-subtle px-2 py-0.5 rounded font-mono">
                        <CheckCircle className="w-3.5 h-3.5 text-success" /> APPROVED
                      </span>
                    )}
                    {currentActiveDoc.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-error-bold bg-error-subtle px-2 py-0.5 rounded font-mono">
                        <XCircle className="w-3.5 h-3.5 text-error" /> REJECTED
                      </span>
                    )}
                    {currentActiveDoc.status === 'pending_review' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-warning-bold bg-warning-subtle px-2 py-0.5 rounded font-mono">
                        <Clock className="w-3.5 h-3.5 text-warning animate-pulse" /> PENDING REVIEW
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-error-subtle border border-error-divider text-error-bold rounded-xl p-3 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  No active document uploaded for this category slot.
                </div>
              )}

              {/* Version History List Timeline */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {categoryDocHistory.length === 0 ? (
                  <div className="text-center py-10 bg-background rounded-xl border border-subtle">
                    <History className="w-8 h-8 text-quaternary mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold text-tertiary">No version history records found.</p>
                    <p className="text-xs text-quaternary mt-1">Upload a document to initialize version 1.</p>
                  </div>
                ) : (
                  categoryDocHistory.map((doc) => {
                    const isCurrent = doc.isCurrent;
                    const canDownload = isCurrent || isPrivilegedUser;

                    return (
                      <div 
                        key={doc.id}
                        className={`border rounded-xl p-4 transition relative ${
                          isCurrent 
                            ? 'bg-brand/5 border-brand/30 shadow-sm' 
                            : 'bg-background border-subtle hover:border-border-subtle'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold bg-brand text-white px-2 py-0.5 rounded shadow-sm">
                                v{doc.version}
                              </span>
                              {isCurrent && (
                                <span className="bg-success-subtle text-success-bold text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                                  Current Active Version
                                </span>
                              )}
                              <span className="text-xs font-bold text-primary truncate max-w-[220px]" title={doc.fileName}>
                                {doc.fileName}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-tertiary font-sans pt-1 flex-wrap">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-quaternary" /> Uploaded by <strong className="text-secondary-muted">{doc.uploadedBy}</strong>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3 text-quaternary" /> {new Date(doc.uploadedAt).toLocaleString()}
                              </span>
                            </div>

                            {doc.feedback && (
                              <div className="mt-2 bg-error-subtle/60 border border-error-divider text-error-bold rounded-lg p-2 text-xs font-sans">
                                <strong>Feedback:</strong> {doc.feedback}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {canDownload ? (
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="inline-flex items-center gap-1.5 bg-surface hover:bg-surface-hover text-brand font-bold border border-subtle px-3 py-1.5 rounded-lg text-xs transition cursor-pointer min-h-[36px]"
                                title="Open Document Preview"
                              >
                                <Eye className="w-3.5 h-3.5 text-brand" /> View Document
                              </button>
                            ) : (
                              <span 
                                className="inline-flex items-center gap-1 text-quaternary text-xs font-mono italic bg-surface-hover px-2.5 py-1.5 rounded-lg border border-subtle"
                                title="Only Admin and Department Head can access historical past versions"
                              >
                                <Lock className="w-3 h-3 text-quaternary" /> Past Version Locked
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-subtle pt-3 flex items-center justify-between text-xs text-quaternary">
                <span>
                  {!isPrivilegedUser && categoryDocHistory.length > 1 ? '* Past versions are restricted to Department Heads & Admins.' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setHistoryModalCategory(null);
                    setHistoryModalOfferingId(null);
                  }}
                  className="px-4 py-2 bg-surface hover:bg-surface-hover border border-subtle rounded-xl text-secondary-muted font-bold text-xs transition cursor-pointer"
                >
                  Close History
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Modal 7: Faculty Missing Document Reminder Preview & Gmail Dispatch Modal */}
      {reminderModalData && reminderModalData.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface border border-subtle rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl space-y-4 p-6 animate-scale-up overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-subtle pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-600 uppercase font-mono tracking-wider">Faculty Course Notice</span>
                    <span className="bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold px-2 py-0.5 rounded-full border border-rose-500/20">
                      {reminderModalData.missingCategories.length} Missing Document{reminderModalData.missingCategories.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-primary flex items-center gap-2 mt-0.5">
                    Pre-Composed Notice for {reminderModalData.instructor?.name || 'Faculty Member'}
                  </h3>
                  <p className="text-xs text-tertiary">
                    {reminderModalData.offering?.course?.code} - {reminderModalData.offering?.course?.title} ({reminderModalData.offering?.term} {reminderModalData.offering?.academicYear})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReminderModalData(null)}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center text-quaternary hover:text-primary rounded-lg hover:bg-surface-hover transition cursor-pointer"
                title="Close Reminder Dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">

              {/* Deadline Attachment Selector (Optional) */}
              <div className="bg-background border border-subtle rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5 font-mono uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5 text-brand" /> Attach Submission Deadline (Optional):
                  </span>
                  {reminderModalData.deadline && (
                    <span className="text-xs font-mono text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      ✓ Attached: {reminderModalData.deadline}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeadlinePreset('end_of_week')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface hover:bg-surface-hover text-secondary border border-subtle transition cursor-pointer flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-amber-500" /> This Friday (End of Week)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeadlinePreset('next_monday')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface hover:bg-surface-hover text-secondary border border-subtle transition cursor-pointer flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3 text-brand" /> Next Monday
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeadlinePreset('in_7_days')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface hover:bg-surface-hover text-secondary border border-subtle transition cursor-pointer flex items-center gap-1"
                  >
                    <Calendar className="w-3 h-3 text-indigo-500" /> In 7 Days
                  </button>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-xs text-tertiary">Custom:</span>
                    <input
                      type="date"
                      onChange={(e) => {
                        if (e.target.value) {
                          const dateObj = new Date(e.target.value);
                          const formatted = dateObj.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) + ' (11:59 PM)';
                          updateReminderDeadline(formatted);
                        }
                      }}
                      className="bg-surface border border-subtle rounded-lg px-2 py-1 text-xs text-secondary focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
                    />
                    {reminderModalData.deadline && (
                      <button
                        type="button"
                        onClick={() => handleDeadlinePreset('clear')}
                        className="text-xs text-rose-500 hover:text-rose-600 font-bold underline px-1 cursor-pointer"
                        title="Remove deadline from notice"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Editable Fields: Recipient & Subject */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={reminderModalData.recipient}
                    onChange={(e) => setReminderModalData(prev => prev ? { ...prev, recipient: e.target.value } : null)}
                    className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-xs text-primary font-mono focus:outline-none focus:ring-1 focus:ring-brand shadow-inner"
                    placeholder="faculty@university.edu"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Subject Line</label>
                  <input
                    type="text"
                    value={reminderModalData.subject}
                    onChange={(e) => setReminderModalData(prev => prev ? { ...prev, subject: e.target.value } : null)}
                    className="w-full bg-background border border-subtle rounded-xl py-2 px-3 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-brand shadow-inner"
                    placeholder="Subject..."
                  />
                </div>
              </div>

              {/* Editable Body Template */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-tertiary uppercase font-mono">
                    Email Body (Fully Editable)
                  </label>
                  <span className="text-xs text-quaternary font-mono">
                    {reminderModalData.body.length} chars
                  </span>
                </div>
                <textarea
                  rows={9}
                  value={reminderModalData.body}
                  onChange={(e) => setReminderModalData(prev => prev ? { ...prev, body: e.target.value } : null)}
                  className="w-full bg-background border border-subtle rounded-xl py-3 px-3 text-xs text-primary font-sans focus:outline-none focus:ring-1 focus:ring-brand shadow-inner leading-relaxed"
                  placeholder="Compose notice..."
                ></textarea>
              </div>

              {/* Missing Items Summary Pills */}
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase font-mono">
                  Identified Missing Items Included in this Notice:
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {reminderModalData.missingCategories.map(cat => {
                    return (
                      <span key={cat} className="text-xs font-medium bg-surface text-secondary-muted px-2 py-0.5 rounded-md border border-subtle font-sans">
                        • {getCategoryLabel(cat)}
                      </span>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="border-t border-subtle pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyReminder}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-hover border border-subtle text-secondary hover:text-primary rounded-xl text-xs font-bold transition cursor-pointer"
                  title="Copy full message text to clipboard"
                >
                  {reminderModalData.copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{reminderModalData.copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenInMailto}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-hover border border-subtle text-secondary hover:text-primary rounded-xl text-xs font-bold transition cursor-pointer"
                  title="Open in Outlook, Apple Mail or default desktop mail app"
                >
                  <Send className="w-3.5 h-3.5 text-quaternary" />
                  <span>Default Mail App</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setReminderModalData(null)}
                  className="px-4 py-2 border border-subtle rounded-xl text-tertiary hover:text-primary text-xs font-bold transition cursor-pointer hover:bg-background"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleOpenInGmail}
                  disabled={reminderModalData.isSendingLog}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-blue-600/20 cursor-pointer min-h-[40px]"
                  title="Open pre-filled message in Gmail Web Compose and log audit trail"
                >
                  <Mail className="w-4 h-4" />
                  <span>Open in Personal Gmail</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
      {/* Modal: Interactive In-App Document Viewer */}
      {previewDoc && (() => {
        const ext = (previewDoc.fileName.split('.').pop() || '').toLowerCase();
        const isPdf = ext === 'pdf';
        const isImage = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext);
        const isOffice = ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'csv'].includes(ext);
        const isPrivilegedUser = currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DEPT_HEAD);
        const docOffering = offerings.find(o => o.id === previewDoc.offeringId) || selectedOffering;

        return (
          <div role="dialog" aria-modal="true" aria-label="Document Preview Modal" className="fixed inset-0 bg-inverse-surface-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
            <div className={`bg-surface border border-subtle rounded-2xl shadow-2xl flex flex-col transition-all duration-200 overflow-hidden ${
              previewFullscreen ? 'w-full h-full max-w-none max-h-none rounded-none' : 'w-full max-w-5xl h-[88vh]'
            }`}>
              {/* Viewer Header */}
              <div className="bg-background px-5 py-3.5 border-b border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    {isPdf ? <FileText className="w-5 h-5" /> : isOffice ? <FileSpreadsheet className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-brand uppercase">{getCategoryLabel(previewDoc.category)}</span>
                      <span className="text-xs font-mono text-quaternary bg-surface-hover px-2 py-0.5 rounded">v{previewDoc.version}</span>
                      {previewDoc.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-success-bold bg-success-subtle px-2 py-0.5 rounded uppercase font-mono">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </span>
                      ) : previewDoc.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-error-bold bg-error-subtle px-2 py-0.5 rounded uppercase font-mono">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-warning-bold bg-warning-subtle px-2 py-0.5 rounded uppercase font-mono">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-primary font-mono font-bold truncate mt-0.5" title={previewDoc.fileName}>
                      {previewDoc.fileName}
                    </p>
                  </div>
                </div>

                {/* Action Tools */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {isPrivilegedUser && (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewStatus(previewDoc.status === 'rejected' ? 'rejected' : 'approved');
                        setReviewFeedback(previewDoc.feedback || '');
                        setShowReviewDoc(previewDoc);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-bold font-mono hover:bg-amber-100 transition cursor-pointer"
                      title="Verify / Review Submission"
                    >
                      <FileCheck className="w-3.5 h-3.5" /> Verify
                    </button>
                  )}

                  <a
                    href={`/api/documents/${previewDoc.id}/download?download=true`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface hover:bg-surface-hover text-secondary hover:text-primary border border-subtle rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
                    title="Download Original File to Device"
                  >
                    <Download className="w-3.5 h-3.5 text-quaternary" /> Download
                  </a>

                  <a
                    href={`/api/documents/${previewDoc.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-surface hover:bg-surface-hover text-secondary hover:text-primary border border-subtle rounded-xl text-xs font-semibold transition cursor-pointer"
                    title="Open Raw File in New Browser Tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-quaternary" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setPreviewFullscreen(!previewFullscreen)}
                    className="p-2 text-quaternary hover:text-primary hover:bg-surface-hover rounded-xl transition cursor-pointer"
                    title={previewFullscreen ? "Exit Fullscreen" : "Fullscreen Viewer"}
                  >
                    {previewFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="p-2 text-quaternary hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition cursor-pointer"
                    title="Close Preview (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Viewer Content Frame */}
              <div className="flex-1 bg-slate-950/5 dark:bg-slate-950/50 p-2 sm:p-4 overflow-hidden flex flex-col justify-center items-center relative">
                {isPdf ? (
                  <iframe
                    src={`/api/documents/${previewDoc.id}/download#toolbar=1&navpanes=1`}
                    className="w-full h-full border-0 rounded-xl bg-white shadow-inner"
                    title={previewDoc.fileName}
                  />
                ) : isImage ? (
                  <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                    <img
                      src={`/api/documents/${previewDoc.id}/download`}
                      alt={previewDoc.fileName}
                      className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-subtle bg-white"
                    />
                  </div>
                ) : (
                  <div className="max-w-lg w-full bg-surface border border-subtle rounded-2xl p-8 text-center space-y-5 shadow-xl animate-scale-up">
                    <div className="w-16 h-16 rounded-3xl bg-brand/10 text-brand flex items-center justify-center mx-auto shadow-inner">
                      {isOffice ? <FileSpreadsheet className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold bg-brand/10 text-brand px-2.5 py-1 rounded-lg uppercase">
                        {ext.toUpperCase()} File Format
                      </span>
                      <h4 className="text-base font-bold text-primary mt-2">{previewDoc.fileName}</h4>
                      <p className="text-xs text-tertiary mt-1">
                        Uploaded by <span className="font-semibold text-secondary">{previewDoc.uploadedBy}</span> on{' '}
                        {previewDoc.uploadedAt ? new Date(previewDoc.uploadedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>

                    <div className="bg-background rounded-xl p-4 border border-divider text-left text-xs space-y-2 text-secondary font-mono">
                      <div className="flex justify-between">
                        <span className="text-tertiary">Course Code:</span>
                        <span className="font-bold text-primary">{docOffering?.course?.code || 'Course'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-tertiary">Academic Session:</span>
                        <span>{docOffering?.term} {docOffering?.academicYear} (Sec {docOffering?.section})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-tertiary">Category Slot:</span>
                        <span className="font-semibold">{getCategoryLabel(previewDoc.category)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-tertiary">Version:</span>
                        <span>v{previewDoc.version}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <a
                        href={`/api/documents/${previewDoc.id}/download?download=true`}
                        className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-md shadow-brand/20 cursor-pointer"
                      >
                        <Download className="w-4 h-4" /> Download & Open Locally
                      </a>
                      <a
                        href={`/api/documents/${previewDoc.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 bg-surface hover:bg-surface-hover text-secondary font-semibold px-4 py-2.5 rounded-xl text-xs transition border border-subtle cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4 text-quaternary" /> Open in New Tab
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: In-App Role User Manual & SOP Guide */}
      {showRoleManualModal && (
        <div role="dialog" aria-modal="true" aria-label="Role Operating Manual Modal" className="fixed inset-0 bg-inverse-surface-dark/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface border border-subtle rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="bg-background px-6 py-4 border-b border-subtle flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand">Institutional SOP</span>
                  <h3 className="text-base font-bold text-primary">Role Operating Manual & User Guide</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRoleManualModal(false)}
                className="p-2 text-quaternary hover:text-primary hover:bg-surface-hover rounded-xl transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role Switcher Tabs */}
            <div className="px-6 py-3 border-b border-subtle bg-slate-50/50 dark:bg-slate-900/40 flex flex-wrap items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-tertiary mr-1 font-mono uppercase text-xs">Select Role:</span>
              <button
                type="button"
                onClick={() => setManualSelectedRole(UserRole.INSTRUCTOR)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  manualSelectedRole === UserRole.INSTRUCTOR 
                    ? 'bg-brand text-white shadow-xs' 
                    : 'bg-surface hover:bg-surface-hover text-secondary border border-subtle'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Faculty / Instructor</span>
                {currentUser?.role === UserRole.INSTRUCTOR && (
                  <span className="text-xs bg-white/20 px-1.5 py-0.2 rounded-full font-mono">You</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setManualSelectedRole(UserRole.DEPT_HEAD)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  manualSelectedRole === UserRole.DEPT_HEAD 
                    ? 'bg-brand text-white shadow-xs' 
                    : 'bg-surface hover:bg-surface-hover text-secondary border border-subtle'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Department Head</span>
                {currentUser?.role === UserRole.DEPT_HEAD && (
                  <span className="text-xs bg-white/20 px-1.5 py-0.2 rounded-full font-mono">You</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setManualSelectedRole(UserRole.ADMIN)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  manualSelectedRole === UserRole.ADMIN 
                    ? 'bg-brand text-white shadow-xs' 
                    : 'bg-surface hover:bg-surface-hover text-secondary border border-subtle'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>System Admin</span>
                {currentUser?.role === UserRole.ADMIN && (
                  <span className="text-xs bg-white/20 px-1.5 py-0.2 rounded-full font-mono">You</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setManualSelectedRole(UserRole.AUDITOR)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  manualSelectedRole === UserRole.AUDITOR 
                    ? 'bg-brand text-white shadow-xs' 
                    : 'bg-surface hover:bg-surface-hover text-secondary border border-subtle'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Board Auditor / Coordinator</span>
                {currentUser?.role === UserRole.AUDITOR && (
                  <span className="text-xs bg-white/20 px-1.5 py-0.2 rounded-full font-mono">You</span>
                )}
              </button>
            </div>

            {/* Manual Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-secondary leading-relaxed">
              {manualSelectedRole === UserRole.INSTRUCTOR && (
                <div className="space-y-5">
                  <div className="bg-brand/5 border border-brand/20 rounded-2xl p-4 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-primary">Instructor / Teaching Faculty Mission</h4>
                      <p className="text-xs text-tertiary mt-0.5">
                        Your responsibility is uploading and curating complete course portfolios for all sections you teach, including syllabus components, OBE matrices, assessment questions, and representative student answer scripts.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-primary uppercase font-mono tracking-wider">Standard Operating Procedures (SOP):</h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-background rounded-xl p-4 border border-subtle space-y-1.5">
                        <span className="text-xs font-bold text-brand font-mono">1. Accessing Your Offerings</span>
                        <p className="text-xs text-tertiary">
                          Click <strong>Instructor Workbench</strong> (<code>My Desk</code>) from the sidebar to view all active course sections assigned to you for the current academic semester.
                        </p>
                      </div>

                      <div className="bg-background rounded-xl p-4 border border-subtle space-y-1.5">
                        <span className="text-xs font-bold text-brand font-mono">2. Uploading 01–16 Requirements</span>
                        <p className="text-xs text-tertiary">
                          Open your course checklist. Upload standalone files directly. For items <strong>08, 09, 10, 11</strong>, upload the question paper and expand to upload the 3 sample scripts (<em>Highest</em>, <em>Marginal</em>, <em>Average</em>).
                        </p>
                      </div>

                      <div className="bg-background rounded-xl p-4 border border-subtle space-y-1.5">
                        <span className="text-xs font-bold text-brand font-mono">3. Bulk Upload & Auto-Renaming</span>
                        <p className="text-xs text-tertiary">
                          Drag and drop multiple files into the <strong>Bulk Uploader</strong>. Files are automatically matched and renamed to university standards (e.g. <code>2025.1.CSE407-01_Midterm_SampleHighest.pdf</code>).
                        </p>
                      </div>

                      <div className="bg-background rounded-xl p-4 border border-subtle space-y-1.5">
                        <span className="text-xs font-bold text-brand font-mono">4. Addressing Revision Requests</span>
                        <p className="text-xs text-tertiary">
                          If an item is marked <strong>REJECTED</strong>, read the reviewer feedback notice, update the document, and click the re-upload icon to submit an updated version.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {manualSelectedRole === UserRole.DEPT_HEAD && (
                <div className="space-y-5">
                  <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-primary">Department Head / Lead Reviewer Mission</h4>
                      <p className="text-xs text-tertiary mt-0.5">
                        Oversee department-wide course file completeness, verify course portfolios once submitted, provide constructive feedback, and dispatch 1-click revision notices to instructors.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-primary uppercase font-mono tracking-wider">Standard Operating Procedures (SOP):</h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-background rounded-xl p-4 border border-subtle space-y-1.5">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">1. Monitoring Department Attainment</span>
                        <p className="text-xs text-tertiary">
                          Use the <strong>Missing Docs & Review</strong> dashboard to track completion percentages across all department courses. Filter by missing or complete folders.
                        </p>
                      </div>

                      <div className="bg-background rounded-xl p-4 border border-subtle space-y-1.5">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">2. Holistic Portfolio Review</span>
                        <p className="text-xs text-tertiary">
                          Inspect completed course folders to verify syllabus, OBE sheets, and sample answer scripts using the in-app document viewer.
                        </p>
                      </div>

                      <div className="bg-background rounded-xl p-4 border border-subtle space-y-1.5">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">3. 1-Click Revision Emails</span>
                        <p className="text-xs text-tertiary">
                          When rejecting a file, enter feedback notes and click <strong>Save & Open Email in Gmail</strong> to send an official pre-composed notice to the instructor.
                        </p>
                      </div>

                      <div className="bg-background rounded-xl p-4 border border-subtle space-y-1.5">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">4. Teaching Course Self-Review</span>
                        <p className="text-xs text-tertiary">
                          For courses you teach, you can upload materials, self-verify, or have them cross-verified by system administrators.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {manualSelectedRole === UserRole.ADMIN && (
                <div className="space-y-5">
                  <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-primary">System Administrator Mission</h4>
                      <p className="text-xs text-tertiary mt-0.5">
                        Maintain system infrastructure, manage user accounts & role elevations, configure dynamic requirement slots, and manage Cloudflare R2 trash storage.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-primary uppercase font-mono tracking-wider">Standard Operating Procedures (SOP):</h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-background rounded-xl p-4 border border-subtle space-y-1.5">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">1. User & Role Management</span>
                        <p className="text-xs text-tertiary">
                          Navigate to <strong>User Directory</strong> to approve registered faculty, promote users to Department Heads or Auditors/Coordinators, and assign department scopes.
                        </p>
                      </div>

                      <div className="bg-background rounded-xl p-4 border border-subtle space-y-1.5">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">2. Dynamic Requirement Slots</span>
                        <p className="text-xs text-tertiary">
                          In <strong>Requirement Slots</strong>, add new institutional slots or toggle existing ones. All course completion metrics dynamically adapt.
                        </p>
                      </div>

                      <div className="bg-background rounded-xl p-4 border border-subtle space-y-1.5">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">3. Trash & Cloudflare R2 Purge</span>
                        <p className="text-xs text-tertiary">
                          Inspect soft-deleted documents in <strong>Trash & R2 Storage</strong>. Restore mistakenly deleted files or permanently destroy physical objects from Cloudflare R2.
                        </p>
                      </div>

                      <div className="bg-background rounded-xl p-4 border border-subtle space-y-1.5">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">4. Tamper-Evident Audit Ledger</span>
                        <p className="text-xs text-tertiary">
                          Inspect the cryptographic SHA-256 blockchain-style ledger to audit all document activities, downloads, and administrative actions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {manualSelectedRole === UserRole.AUDITOR && (
                <div className="space-y-5">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-primary">Board Auditor / Coordinator Mission</h4>
                      <p className="text-xs text-tertiary mt-0.5">
                        Conduct independent, read-only accreditation inspections to verify outcome attainments (CO/PO), assessment quality, and evidence compliance.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-primary uppercase font-mono tracking-wider">Standard Operating Procedures (SOP):</h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-background rounded-xl p-4 border border-subtle space-y-1.5">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">1. Assigned Offering Review</span>
                        <p className="text-xs text-tertiary">
                          Access course portfolios explicitly assigned to you by the academic registry and examine full student assessment artifacts.
                        </p>
                      </div>

                      <div className="bg-background rounded-xl p-4 border border-subtle space-y-1.5">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">2. In-App Document Inspection</span>
                        <p className="text-xs text-tertiary">
                          Review Question Papers, Grade Tabulations, and Sample Scripts without having to download sensitive student exams to local devices.
                        </p>
                      </div>

                      <div className="bg-background rounded-xl p-4 border border-subtle space-y-1.5">
                        <span className="text-xs font-bold text-emerald-600 dark:text-indigo-400 font-mono">3. OBE CQI Scrutiny</span>
                        <p className="text-xs text-tertiary">
                          Verify Continuous Quality Improvement (CQI) reports and outcome attainment spreadsheets for program outcome compliance.
                        </p>
                      </div>

                      <div className="bg-background rounded-xl p-4 border border-subtle space-y-1.5">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">4. Cryptographic Proof of Integrity</span>
                        <p className="text-xs text-tertiary">
                          Cross-reference audit log timestamps and SHA-256 hashes in the ledger to verify evidence was not modified after semester deadlines.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-background px-6 py-4 border-t border-subtle flex items-center justify-between shrink-0">
              <span className="text-xs text-tertiary font-mono">
                Course File Archive • Accreditation & CQI Platform
              </span>
              <button
                type="button"
                onClick={() => setShowRoleManualModal(false)}
                className="px-5 py-2 bg-brand hover:bg-brand-hover text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm shadow-brand/10"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Digital Signature & Workflow Endorsement */}
      {showSignatureModal && selectedOffering && (
        <div role="dialog" aria-modal="true" aria-label="Digital Signature Modal" className="fixed inset-0 bg-inverse-surface-dark/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-surface border border-subtle rounded-2xl sm:rounded-3xl w-full max-w-[calc(100vw-1.5rem)] sm:max-w-xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="bg-background px-4 sm:px-6 py-3 sm:py-4 border-b border-subtle flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-brand">
                    {signatureAction === 'submit' ? 'Faculty Submission' : 'Department Endorsement'}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-primary">
                    {signatureAction === 'submit' ? 'Sign & Submit Course Portfolio' : 'Endorse & Seal Course Portfolio'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSignatureModal(false)}
                className="p-1.5 sm:p-2 text-quaternary hover:text-primary hover:bg-surface-hover rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context Info */}
            <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-brand/5 border-b border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-xs text-secondary shrink-0">
              <div>
                <span className="font-bold text-primary">{selectedOffering.course?.code} - {selectedOffering.course?.title}</span>
                <span className="text-tertiary ml-2">({selectedOffering.term} {selectedOffering.academicYear} • Sec {selectedOffering.section})</span>
              </div>
              <span className="font-mono text-xs font-bold text-brand bg-surface px-2 py-0.5 rounded border border-subtle">
                Signed as: {currentUser?.name}
              </span>
            </div>

            <div className="overflow-y-auto flex-grow">
              {/* Signature Mode Selector Tabs */}
              <div className="px-4 sm:px-6 pt-3 pb-2">
                <div className="flex rounded-xl bg-background p-1 border border-subtle">
                  <button
                    type="button"
                    onClick={() => setSignatureMode('draw')}
                    className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                      signatureMode === 'draw'
                        ? 'bg-brand text-white shadow-xs'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    <span>✍️</span> <span className="hidden xs:inline">Draw</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureMode('upload')}
                    className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                      signatureMode === 'upload'
                        ? 'bg-brand text-white shadow-xs'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    <span>🖼️</span> <span className="hidden xs:inline">Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureMode('type')}
                    className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                      signatureMode === 'type'
                        ? 'bg-brand text-white shadow-xs'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    <span>⌨️</span> <span className="hidden xs:inline">Type Styled</span>
                  </button>
                </div>
              </div>

              {/* Mode Body */}
              <div className="px-4 sm:px-6 py-3 space-y-3 sm:space-y-4">
                {signatureMode === 'draw' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-tertiary">
                      <span>Draw with mouse or touchscreen:</span>
                      <button
                        type="button"
                        onClick={() => sigCanvasRef.current?.clear()}
                        className="text-xs text-rose-500 hover:text-rose-600 font-bold underline cursor-pointer"
                      >
                        Clear Canvas
                      </button>
                    </div>
                    <div className="border-2 border-dashed border-subtle hover:border-brand rounded-2xl bg-white overflow-hidden shadow-inner h-40 sm:h-44">
                      <SignatureCanvas
                        ref={sigCanvasRef}
                        penColor="#0f172a"
                        canvasProps={{
                          className: 'w-full h-full cursor-crosshair'
                        }}
                      />
                    </div>
                  </div>
                )}

                {signatureMode === 'upload' && (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-subtle hover:border-brand rounded-2xl p-4 sm:p-6 text-center cursor-pointer transition bg-background">
                      <input
                        type="file"
                        id="sig-file-upload"
                        className="hidden"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onload = (loadEvt) => {
                              setUploadedSignatureUrl(loadEvt.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {uploadedSignatureUrl ? (
                        <div className="space-y-3">
                          <div className="bg-white p-4 rounded-xl border border-subtle inline-block max-w-full">
                            <img src={uploadedSignatureUrl} alt="Uploaded Signature" className="h-20 sm:h-24 max-w-full object-contain mx-auto" />
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setUploadedSignatureUrl(null)}
                              className="text-xs text-rose-500 hover:text-rose-600 font-bold underline cursor-pointer"
                            >
                              Remove / Choose Another
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label htmlFor="sig-file-upload" className="block w-full h-full cursor-pointer">
                          <FileUp className="w-7 h-7 sm:w-8 sm:h-8 text-brand mx-auto mb-2 animate-bounce" />
                          <p className="text-xs font-bold text-primary">Upload scanned signature image (.png, .jpg)</p>
                          <p className="text-xs text-tertiary mt-1">Recommended: Clean black/dark ink on transparent or white background</p>
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {signatureMode === 'type' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-1">Full Legal Name</label>
                      <input
                        type="text"
                        value={typedSignatureName}
                        onChange={(e) => setTypedSignatureName(e.target.value)}
                        placeholder="Type your name..."
                        className="w-full bg-background border border-subtle rounded-xl py-2 sm:py-2.5 px-3 text-xs text-primary font-bold focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-tertiary uppercase font-mono mb-2">Choose Signature Style</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { name: 'Elegant Flourish', font: 'font-["Great_Vibes",cursive]' },
                          { name: 'Modern Script', font: 'font-["Dancing_Script",cursive]' },
                          { name: 'Classic Calligraphy', font: 'font-["Sacramento",cursive]' },
                          { name: 'Casual Hand', font: 'font-["Caveat",cursive]' }
                        ].map((style, idx) => (
                          <button
                            key={style.name}
                            type="button"
                            onClick={() => setTypedSignatureFont(idx)}
                            className={`p-2.5 sm:p-3 rounded-xl border text-center transition cursor-pointer ${
                              typedSignatureFont === idx
                                ? 'bg-brand/10 border-brand text-brand ring-1 ring-brand'
                                : 'bg-background border-subtle hover:bg-surface-hover text-secondary'
                            }`}
                          >
                            <span className="text-xs font-semibold block text-tertiary mb-1">{style.name}</span>
                            <span className={`text-lg block text-slate-800 dark:text-slate-200 truncate ${style.font}`} style={{ fontFamily: idx === 0 ? '"Great Vibes", cursive' : idx === 1 ? '"Dancing Script", cursive' : idx === 2 ? '"Sacramento", cursive' : '"Caveat", cursive' }}>
                              {typedSignatureName.trim() || 'Your Signature'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-subtle flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-background shrink-0">
              <button
                type="button"
                onClick={() => setShowSignatureModal(false)}
                className="px-4 py-2 border border-subtle rounded-xl text-tertiary hover:text-primary text-xs font-bold transition cursor-pointer hover:bg-surface text-center"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSignatureSubmit}
                className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-brand hover:from-indigo-700 hover:to-brand-hover text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-brand/20 flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{signatureAction === 'submit' ? 'Confirm & Submit Portfolio' : 'Confirm & Endorse Portfolio'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
