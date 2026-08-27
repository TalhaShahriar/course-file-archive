# 🎓 University Course File & OBE Archive System

An enterprise-grade, institutional web application designed to streamline academic course file archiving, Outcome-Based Education (OBE) documentation, Continuous Quality Improvement (CQI), and accreditation compliance across academic departments.

---

## 🚀 Quick Overview

The **Course File & OBE Archive System** replaces fragmented manual paperwork with a centralized, cloud-connected digital archive. Faculty members upload syllabus components, assessment question papers, sample answer scripts, attendance logs, and OBE calculation spreadsheets following standard institutional requirements. Department Heads and System Administrators review course portfolios holistically, verify submissions, and dispatch feedback or revision requests directly to faculty via integrated Gmail workflows.

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Purpose |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons | Responsive SPA, interactive in-app document viewer, dynamic portfolio checklist with expandable sub-slots |
| **Backend** | Express.js, TypeScript (`tsx`), Node.js | REST API, role-based access control, ZIP package exporter, file hash generator |
| **Database** | Neon PostgreSQL (`postgres`), Connection Pooling | Persistent relational storage for users, courses, offerings, documents, audit trails, and requirement slots |
| **Cloud Storage** | Cloudflare R2 / AWS S3 API (`@aws-sdk/client-s3`), Presigned URLs | Scalable, high-performance object storage with `Content-Disposition: inline` for instant in-app previews |
| **Security & Integrity** | Cryptographic SHA-256 Hashing, Blockchain-style Audit Chaining | Tamper-evident ledger for all file uploads, downloads, verifications, deletions, and faculty notices |
| **Email Integration** | Web-based Gmail Compose & RFC 2368 `mailto:` Dispatcher | 1-click pre-composed faculty notices and file-specific revision requests |

---

## 🌟 Key Features

### 1. 📋 Official 01–16 Course File Structure with Expandable Sub-Slots
Numbered in exact alignment with institutional accreditation checklists:
- **`01`** Final grades of the students (Tabulation Sheet)
- **`02`** OBE Excel Sheet (soft copy) — *e.g., `2025.3.CSE103-00.xlsx`*
- **`03`** CO Attainment Report (From OBE Excel)
- **`04`** PO Attainment Report (From OBE Excel)
- **`05`** Grade Summary with CQI Improvement Plan (From OBE Excel)
- **`06`** Instructor Feedback (From OBE Excel)
- **`07`** Course Outline / Syllabus
- **`08`** **1) Class Test Assessment Question**  
  └─ *2) Representative Samples of Answer Scripts (Click to expand):*  
     &nbsp;&nbsp;&nbsp;&nbsp;• `a) Highest answer script`  
     &nbsp;&nbsp;&nbsp;&nbsp;• `b) Marginally passed answer script`  
     &nbsp;&nbsp;&nbsp;&nbsp;• `c) Average answer script`
- **`09`** **1) Midterm Assessment Question**  
  └─ *2) Representative Samples of Answer Scripts (Click to expand):*  
     &nbsp;&nbsp;&nbsp;&nbsp;• `a) Highest` • `b) Marginally passed` • `c) Average`
- **`10`** **1) Final Exam Question**  
  └─ *2) Representative Samples of Answer Scripts (Click to expand):*  
     &nbsp;&nbsp;&nbsp;&nbsp;• `a) Highest` • `b) Marginally passed` • `c) Average`
- **`11`** **1) List of projects/assignments with description**  
  └─ *2) Representative Samples of Project Reports (Click to expand):*  
     &nbsp;&nbsp;&nbsp;&nbsp;• `a) Highest` • `b) Marginally passed` • `c) Average`
- **`12`** List of lab experiments
- **`13`** Class Attendance
- **`14`** Lab Attendance
- **`15`** Mid Term Exam Attendance
- **`16`** Final Exam Attendance

---

### 2. 🏷️ Automated Institutional File Renaming
Uploaded files are automatically renamed according to university standards:
$$\mathbf{\{AcademicYear\}.\{TermNumber\}.\{CourseCode\}-\{Section\}\_\{DocTypeLabel\}\_\{Variant\}.\{ext\}}$$
*Examples:*
- `2025.1.CSE407-01_ClassTest_Question.pdf`
- `2025.1.CSE407-01_ClassTest_SampleHighest.pdf`
- `2025.1.CSE407-01_ClassTest_SampleMarginal.pdf`
- `2025.1.CSE407-01_ClassTest_SampleAverage.pdf`
- `2025.1.CSE407-01_Midterm_SampleHighest.pdf`
- `2025.1.CSE407-01.xlsx` *(OBE matrix)*

---

### 3. 👁️ Interactive In-App Document Viewer
- View PDFs directly in an interactive browser reader without downloading.
- Preview images (`.png`, `.jpg`, `.webp`) and inspect Office document metadata (`.docx`, `.xlsx`, `.pptx`).
- Includes Fullscreen mode, Open in New Tab, Direct Download, and instant Review/Verify shortcuts.

---

### 4. ✉️ 1-Click Faculty Revision Notices & Gmail Dispatch
- Department Heads and Admins can reject submissions with detailed feedback and instantly click **`Save & Open Email in Gmail`**.
- Automatically addresses the course instructor with course codes, term details, the exact file name, and reviewer change instructions.
- Dedicated **`Email Faculty`** buttons on rejected items in the portfolio checklist for quick follow-ups.

---

### 5. 🗄️ Two-Stage Trash & Permanent Cloudflare R2 Purge
- Deleting an active document soft-deletes the record and moves it to the **Trash Bin**.
- Active portfolios automatically fall back to the previous historical version if available.
- Trash Bin allows **1-click Restore** or **Permanent Destruction** (which purges the physical file object from Cloudflare R2).

---

### 6. ⚙️ Dynamic Requirement Slots Management (Admin)
- System Admins can dynamically create new course requirement slots or deactivate obsolete ones without touching source code.
- Completion percentages, ZIP export packages, and missing document trackers automatically recalculate across all active requirement slots.

---

## 👥 Role Descriptions & Access Permissions Matrix

| Feature / Capability | 👨‍🏫 Instructor | 👩‍💼 Dept Head | 🛡️ System Admin | 🕵️ Board Auditor |
|---|:---:|:---:|:---:|:---:|
| **View Assigned Courses** | ✅ | ✅ | ✅ | ✅ |
| **Upload Course Documents** | ✅ | ✅ *(Own Courses)* | ✅ | ❌ |
| **Batch Drag-and-Drop Bulk Upload** | ✅ | ✅ *(Own Courses)* | ✅ | ❌ |
| **In-App Document Viewer** | ✅ | ✅ | ✅ | ✅ |
| **Version History Access (Active)** | ✅ | ✅ | ✅ | ✅ |
| **Historical Versions Access (Past)** | ❌ | ✅ | ✅ | ❌ |
| **Verify / Approve Submissions** | ❌ | ✅ | ✅ | ❌ |
| **Reject & Send Revision Email** | ❌ | ✅ | ✅ | ❌ |
| **Department Compliance Review** | ❌ | ✅ | ✅ | ✅ |
| **Export ZIP Portfolio Package** | ✅ | ✅ | ✅ | ✅ |
| **Restore / Purge Trash in R2** | ❌ | ❌ | ✅ | ❌ |
| **Dynamic Requirement Slots CRUD** | ❌ | ❌ | ✅ | ❌ |
| **User Role Management** | ❌ | ❌ | ✅ | ❌ |
| **Cryptographic Audit Log Inspection** | ❌ | ❌ | ✅ | ✅ |

---

## 📖 Role Operating Manuals (Standard Operating Procedures)

### 👨‍🏫 Instructor / Faculty Manual
1. **Accessing Your Portfolio:** Navigate to **Instructor Workbench** (`My Desk`) to view all course sections assigned to you for the current semester.
2. **Uploading Requirement Items:**
   - Click on a course to open its **Course Portfolio Checklist**.
   - For standalone items (`01`–`07`, `12`–`16`), click **`+ Upload`** to select or drop your file.
   - For assessment items (`08`, `09`, `10`, `11`), upload the Question Paper under `1)` and click the header to expand `2) Representative Samples` (`Highest`, `Marginally Passed`, `Average`).
3. **Bulk Uploader:** Use the **Bulk Upload** tab to drop multiple files at once. The smart parser will auto-match files to their categories based on filename patterns.
4. **Addressing Revisions:** If an item is marked **`REJECTED`**, read the Reviewer Change Request feedback box, update your document, and click the **Re-upload** icon on that slot.

---

### 👩‍💼 Department Head Manual
1. **Department Compliance Monitoring:** Navigate to the **Compliance & Review** tab to monitor submission percentages across all departmental faculty in real-time.
2. **Reviewing Completed Portfolios:** Open a course folder with 100% completion (or inspect ongoing submissions).
3. **Verifying Files:** Click **`Verify`** in the Document Viewer or portfolio item settings to approve compliant files.
4. **Requesting Changes via Gmail:** If a file requires corrections, choose **`REJECT & SEND BACK`**, type the required corrections, and click **`Save & Open Email in Gmail`** to immediately dispatch the official notice to the instructor.
5. **Self-Review for Teaching Courses:** If you teach a course, the system supports self-review or cross-verification by System Admins.

---

### 🛡️ System Administrator Manual
1. **User Role Management:** Navigate to **User Directory** to promote newly registered faculty, assign departmental scopes, or approve pending user accounts.
2. **Course & Offering Provisioning:** Add new course codes and create term-specific course offerings mapped to faculty instructors and board auditors.
3. **Requirement Slot Customization:** Navigate to **Requirement Slots** to add, edit, or toggle institutional slots (e.g. adding specialized accreditation rubrics).
4. **Trash & R2 Storage Management:** Inspect soft-deleted documents in the **Trash & R2 Purge** tab. Perform bulk or individual permanent purges to clean Cloudflare R2 storage.
5. **Audit Trail Verification:** Inspect the immutable **Audit Ledger** for cryptographic hash integrity, tracking all uploads, downloads, verifications, and deletions.

---

### 🕵️ Board Auditor Manual
1. **Accreditation Inspection:** Navigate to assigned offerings to inspect course folders, OBE outcome attainments, and CQI reports.
2. **Read-Only Verification:** Review student assessment samples and grade tabulation sheets using the in-app document viewer.
3. **Audit Ledger Scrutiny:** Cross-reference file hashes and timestamps in the Audit Ledger to guarantee institutional data authenticity.

---

## ⚙️ Environment Configuration (`.env`)

Create a `.env` file in the root directory:

```env
# Server Port & Mode
PORT=3000
NODE_ENV=production

# Neon PostgreSQL Database Connection URL
DATABASE_URL=postgresql://<user>:<password>@<neon-host>/<database>?sslmode=require

# Cloudflare R2 / AWS S3 Object Storage Credentials
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET=university-course-archive
R2_ACCESS_KEY_ID=<your-r2-access-key-id>
R2_SECRET_ACCESS_KEY=<your-r2-secret-access-key>
```

---

## 🏃 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Build the production React frontend bundle
npx vite build

# 3. Start the server (connected to PostgreSQL & Cloudflare R2)
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.
