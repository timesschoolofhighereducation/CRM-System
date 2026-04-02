## Education CRM – Feature Overview

This document summarizes the **full feature set** of the Education CRM web application, grouped into logical areas. Each feature description is written so non-technical stakeholders, UI/UX designers (e.g. using Visily), and developers can quickly understand what exists today.

---

## 1. Access & Security

### 1.1 Authentication
- **Sign in page**: Email + password login form with validation, loading states, and error messages.
- **Session handling**: Keeps users signed in during a browser session and redirects unauthenticated users to the sign-in page.

### 1.2 Role-Based Access Control (RBAC)
- **User roles**: Supports roles such as Administrator, Admin, Developer, Coordinator, Viewer (and similar).
- **Permissions**: Fine-grained permissions like `READ_SEEKER`, `READ_CAMPAIGN`, `READ_USER`, `READ_ROLE`, `VIEW_REPORTS`, etc.
- **UI-level guards**: Screens, tabs, and actions show access-denied messages or disable controls when the user lacks permissions.

---

## 2. Core CRM – Inquiries, Tasks, Meetings

### 2.1 Inquiries Management
- **All inquiries view**: Table of all student inquiries/leads with search, filters, and pagination.
- **Request inquiries view**: Separate table for “request” type inquiries (e.g. web form or external requests).
- **Create new inquiry**: Button and dialog to add a new inquiry, including quick keyboard shortcuts.
- **Inquiry details and actions**: Log interactions, manage preferences (programs of interest), and update inquiry status.

### 2.2 Tasks & Follow-Ups
- **Tasks page**: Central place to manage CRM tasks linked to seekers/inquiries.
- **Follow-Ups tab**: Time-based follow-up view so staff see what needs attention today/soon.
- **Kanban Board tab**: Drag-and-drop Kanban layout for tasks across stages (e.g. To Do, In Progress, Done).
- **Tasks Inbox tab**: List/inbox style view of all tasks assigned to the user or team.

### 2.3 Calendar
- **Monthly calendar grid**: Visual month view showing meetings, follow-ups, and tasks per day.
- **Event tags on days**: Up to several events displayed on each date, with a “+X more” indicator.
- **Selected day panel**: Right-side panel listing all events for the chosen date with time, location, seeker, assignee, and status.
- **Summary cards**: Quick counts for total events, meetings, follow-ups, and tasks.

### 2.4 Meetings
- **Meeting schedule**: Dedicated page showing upcoming and past meetings.
- **Create and manage meetings**: Schedule meetings with seekers or users, with time, location/online link, and notes.

---

## 3. Campaigns, Promotions, and Outreach

### 3.1 Campaign Management
- **Campaigns dashboard**: List of campaigns with status, basic analytics fields, and filtering.
- **Permissions-aware access**: Only users with campaign permissions can see and manage campaigns.

### 3.2 Promotion Codes
- **Promotion codes page**: Table of promotion codes used in campaigns and referrals.
- **Create & edit promotion codes**: Dialogs to manage code details, validity, and promoter information.
- **Promoter tracking**: Links promotion codes to promoters so payments and performance can be tracked.

### 3.3 WhatsApp Campaigns
- **Recipient selection**: Bulk selection of seekers with WhatsApp-enabled numbers, including:
  - Text search by name, phone, email, or city.
  - Filter by preferred programs.
  - Optional promotion-code-holders-only filter.
  - Date range filter for inquiry created date.
- **Message composition**:
  - Message text box with character hints.
  - Optional media/file attachment (images, video, audio, PDF/DOC) with size/type checks.
- **Templates & gallery**:
  - Save messages as reusable templates with optional images.
  - Gallery view to quickly pick a template and auto-fill message + image.
- **Bulk send flow**:
  - Sends to all selected recipients with a single action.
  - Shows success/error message with counts of sent vs failed.
- **Message history**:
  - List of past WhatsApp campaigns with message preview, media preview, send stats, and per-recipient statuses.

### 3.4 Email Campaigns
- **Recipient selection**:
  - Only seekers who have email addresses.
  - Search by name, phone, email, city.
  - Filter by preferred programs.
- **Email composition**:
  - Subject and message body fields with validation.
  - Multiple attachments with total size enforcement (e.g. 25 MB total).
- **Bulk send flow**:
  - Sends individualized emails via backend/Gmail integration to selected seekers.
  - Displays counts of successfully sent vs failed emails.
- **Email history**:
  - List of past email campaigns with subject, message, sent/failed counts, attachment count, and timestamp.
  - Per-campaign preview dialog showing formatted email content and recipient list with statuses.

### 3.5 Social Media Posts & Approvals
- **Posts dashboard**:
  - Tabs for All Posts, Pending My Approval, Rejected, and Approved.
  - Cards showing caption, image/video preview, program/campaign tags, budget, duration, and comments.
- **Create post**:
  - Dialog/form to create new posts with caption, media, budget, date range, and related program/campaign.
- **Approval workflow**:
  - Multi-step approval chain with approver list, order, and comments.
  - Approvers can approve or reject with comments; statuses like Draft, Pending Approval, Approved, Rejected, Scheduled, Published.
- **Resubmission**:
  - Rejected posts can be assigned to someone and resubmitted for approval by creators or assigned users.

---

## 4. Reporting, Logs, and Backups

### 4.1 Dashboard & Analytics
- **Main dashboard**:
  - KPI/stat cards for core metrics.
  - Filters by date preset (e.g. today, this week, this month, last 7/30 days, custom range).
  - Optional filters by user and campaign.
  - Role-based sections that change what charts/cards are shown.
- **Charts & analytics**:
  - Charts for inquiries, activities, and performance trends.
  - Role-based analytical views for admins.

### 4.2 Reports & Analytics Module
- **Reports & Analytics page**:
  - Central hub for operational and performance reports.
  - High-level overview cards and charts for key metrics.

### 4.3 Weekly Reports
- **Weekly status reports**:
  - Users can create weekly reports with planned items, daily tasks, risks, and next-week plan.
  - Statuses: Draft, Submitted, Approved, Reviewed.
- **Tabs & filtering**:
  - Tabs per status and “All” view with counts.
- **Cards & stats**:
  - Cards summarizing objectives completed, tasks logged, risks, and next-week items.
- **Dialogs**:
  - Dialogs for creating/editing reports and viewing detailed report content.

### 4.4 Annual Reports
- **Annual reports dashboard**:
  - Admin-focused annual/operational reporting UI.
  - Charts and summaries of annual performance metrics.

### 4.5 Activity Logs
- **Activity logs dashboard**:
  - Admin view of activity history with filters and export-oriented data.
  - Supports Excel/PDF export via backend routes.

### 4.6 Database Backup
- **Database backup dashboard**:
  - UI for triggering and managing database/schema backups.
  - Lists backup history and provides download/restore entry points (as supported by backend).

---

## 5. Data Management Modules

### 5.1 Programs
- **Programs dashboard**:
  - Manage educational programs, courses, and levels.
  - Table/list of programs with actions to create, edit, and delete.

### 5.2 Program Descriptions
- **Program descriptions page**:
  - Manage detailed descriptions and images per program.
  - Intended to support marketing-style content for each program.

### 5.3 Q&A (FAQ) Management
- **Q&A management**:
  - Manage frequently asked questions per program.
  - Useful for websites, counselors, or automated messaging.

### 5.4 Projects & Deals
- **Projects tab**:
  - Project dashboard listing projects and related details.
  - Create/edit project dialog with fields like title, owner, status, and other metadata.
- **Deal pipeline tab**:
  - Pipeline-style view for sales/marketing deals across stages.
  - Placeholder for detailed deal creation form (stage, value, client, etc.).

### 5.5 Notebooks & Notes
- **Notebook list**:
  - List of notebooks (like mini “spaces” for notes).
  - Create/edit/delete notebooks with simple metadata.
- **Notebook detail**:
  - View of a single notebook with its notes, similar to lightweight Notion.
- **Note editor**:
  - Rich editor for creating and editing notes inside a notebook.

---

## 6. Users, Roles, and Settings

### 6.1 User Management
- **User management page**:
  - Tabs for Users and Roles & Permissions.
- **Users tab**:
  - Table of users with role assignments.
  - Create/edit user via dialog, including email and role selection.
- **Roles & permissions tab**:
  - List of roles with associated permissions.
  - Create/edit/delete roles and adjust which permissions each role has.

### 6.2 Settings
- **Settings dashboard**:
  - Central page for account-level and system-level configuration.
  - May include toggles for logging, notifications, and other admin-level settings.

---

## 7. Notifications & Reminders

### 7.1 Notification Center
- **Notification bell in header/sidebar**:
  - Icon with unread count badge.
  - Popover showing a scrollable list of notifications with title, message, age, and read status.
- **Mark as read actions**:
  - Mark individual notifications as read on click.
  - “Mark all as read” action when there are unread items.
- **Deep links**:
  - Notifications related to social posts or other entities include “View” actions that navigate directly to the relevant page.

### 7.2 Web Push & Browser Notifications
- **Push subscription toggle**:
  - UI controls to enable/disable web push notifications (where supported).
- **Permission prompts**:
  - If browser permissions are not granted, the UI encourages the user to enable notifications.
- **Favicon/title badge sync**:
  - Unread counts are reflected in the browser tab title and favicon badge.

### 7.3 Unified Reminder Service
- **Background reminders**:
  - Unified reminder service for meetings, tasks, and notebooks integrated into the layout.
  - Ensures reminders and notification badge updates are consistent across screens.

---

## 8. AI & Productivity Extras

### 8.1 AI Chat Assistant
- **AI chat page**:
  - Full-page, embedded chat interface powered by an external AI model.
  - Used for answering questions, getting help, or generating content within the CRM context.

### 8.2 Mini Games
- **Games hub**:
  - Left-side game selection menu listing multiple mini games (e.g., Snake, Memory Cards, Math Quiz, Word Scramble, Reaction Time, endless runners).
- **Game play area**:
  - Main content area where the selected game is loaded.
  - Each game is lazy-loaded so they don’t slow down the main app.

---

## 9. System Utilities & Trash

### 9.1 Trash Bin
- **Trash page**:
  - Combined view for deleted inquiries and campaigns.
  - Allows users with sufficient permissions to restore items from trash.

### 9.2 Redirect Helpers
- **Seekers page**:
  - Legacy route that redirects to the `Inquiries` page, keeping old URLs working while using the new terminology.

---

## 10. Design & UX Considerations (for UI Redesign)

When redesigning the UI (e.g. in Visily or Figma), keep in mind:
- **Information density**: This is a working CRM; prioritize quick scanning and low click counts for day-to-day operations.
- **Consistency**: Reuse the same patterns for:
  - Tabs and filters (inquiries, tasks, reports, posts, weekly reports).
  - Cards and tables (campaigns, programs, users, reports, activity logs).
  - Dialogs (create/edit/report/post/approval).
- **Permission awareness**: Show graceful “access denied” or disabled states instead of hiding everything silently.
- **Responsive behavior**: Sidebar collapses and content stacks on small screens; keep key actions visible on mobile.
- **Feedback**: Use toasts, inline validation messages, loading spinners, and empty states throughout the app to keep users informed.

