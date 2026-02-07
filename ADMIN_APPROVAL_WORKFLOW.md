# 🔄 Admin Approval Workflow - Complete Guide

## Overview

When a student raises a complaint, it goes through an **admin approval process** before being assigned to a technician. This ensures quality control and prevents false complaints.

---

## 📊 Complete Workflow

```
┌─────────────────┐
│  Student Scans  │
│   QR Code &     │
│ Reports Issue   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ STATUS: reported                         │
│ ASSET STATUS: operational (unchanged)    │
│ NOTIFICATION: Admin gets notified        │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Admin Reviews Complaint Details          │
│ - Views description, images, severity    │
│ - Sees "Admin Action Required" section   │
└────────┬────────────────────────────────┘
         │
         ├──────────────┬──────────────┐
         ▼              ▼              ▼
    ✅ APPROVE     ❌ REJECT      📝 EDIT PRIORITY
         │              │              │
         │              │              │
         ▼              ▼              │
┌────────────────┐ ┌─────────────┐   │
│ Auto-Assign    │ │ Set Status  │   │
│ Technician     │ │ to rejected │   └──────────┐
│ Based on:      │ │             │              │
│ - Department   │ │ Student     │              ▼
│ - Priority     │ │ Notified    │    Can change severity:
│ - Workload     │ │ with reason │    low/medium/high/critical
└───────┬────────┘ └─────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ STATUS: assigned                         │
│ ASSET STATUS: under_maintenance ✅       │
│ TECHNICIAN: Notified & starts work      │
│ STUDENT: Notified of approval            │
└────────┬────────────────────────────────┘
         │
         ▼
    (Technician continues workflow...)
```

---

## 🎬 Step-by-Step Guide

### **Step 1: Student Reports Complaint**

**Location:** Student Dashboard → QR Scanner

1. Student scans asset QR code
2. Fills complaint form (title, description, images)
3. AI calculates severity automatically
4. Complaint is created with status: `reported`

**What Happens:**
- ✅ Complaint created in database
- ✅ Asset status **stays `operational`** (not changed yet)
- ✅ Admin gets notification: "New Complaint Pending Approval"
- ✅ Student gets notification: "Complaint submitted, pending admin approval"

**Backend Code:** `server/src/controllers/complaintController.ts` (lines 7-92)

---

### **Step 2: Admin Views Complaint**

**Location:** Admin Dashboard → All Complaints Tab

1. Admin clicks on complaint card
2. `ComplaintDetails` modal opens
3. Shows complete information:
   - Description & images
   - Asset details (name, location, type)
   - Severity level (editable by admin)
   - Student information

**UI Component:** `src/components/ComplaintDetails.tsx` (lines 172-223)

---

### **Step 3: Admin Makes Decision**

#### **Option A: ✅ Approve & Assign**

**Action:**
1. Click "Approve & Assign" button
2. System automatically:
   - Finds best-matching technician
   - Assigns complaint to them
   - Updates asset status to `under_maintenance`
   - Sends notifications

**Backend Logic:** `server/src/controllers/complaintController.ts` (lines 134-206)

```typescript
// Technician Selection Logic:
if (severity === 'high' || severity === 'critical') {
    // High priority: Find available tech in same department
    technician = await prisma.user.findFirst({
        where: {
            role: 'technician',
            department: asset.department,
            isAvailable: true
        }
    });
} else {
    // Medium/Low: Load balance across department techs
    technician = await prisma.user.findFirst({
        where: {
            role: 'technician',
            department: asset.department,
        },
        orderBy: { assignments: { _count: 'asc' } } // Least assigned
    });
}
```

**Result:**
- ✅ Complaint status: `reported` → `assigned`
- ✅ Asset status: `operational` → `under_maintenance` ✅
- ✅ Technician receives notification
- ✅ Student gets approval notification

#### **Option B: ❌ Reject**

**Action:**
1. Click "Reject Complaint"
2. System prompts for rejection reason
3. Enter reason (required)
4. Click "Confirm Rejection"

**Result:**
- ✅ Complaint status: `reported` → `rejected`
- ✅ Asset status: **stays `operational`** (no change)
- ✅ Student gets notification with rejection reason
- ✅ No technician assigned

#### **Option C: 📝 Edit Priority (Optional)**

**Action:**
1. Click edit icon next to severity badge
2. Select new priority: low/medium/high/critical
3. Click save
4. Then proceed to approve or reject

---

### **Step 4: View Asset Status**

**Location:** Admin Dashboard → Assets Tab

After approval, the asset will show:
- **Before Approval:** 🟢 `OPERATIONAL` (green badge)
- **After Approval:** 🟠 `UNDER_MAINTENANCE` (orange/red badge)

**UI Component:** `src/components/AssetManagement.tsx`

Asset status automatically updates when admin approves the complaint.

**Backend Code:** `server/src/controllers/complaintController.ts` (lines 169-173)

```typescript
// Update Asset Status
await prisma.asset.update({
    where: { id: asset.id },
    data: { status: 'under_maintenance' }
});
```

---

## 🧪 Testing the Workflow

### **Quick Test Steps:**

1. **Login as Student** (or register new account)
   - Email: `student@campus.edu`
   - Password: `student123`

2. **Report a Complaint:**
   - Go to QR Scanner
   - Click "Demo Scan" or scan real QR
   - Fill form and submit
   - **Verify:** Complaint shows status "REPORTED"

3. **Login as Admin:**
   - Email: `admin@campus.edu`
   - Password: `admin123`

4. **View Complaint:**
   - Go to "All Complaints" tab
   - Click on the reported complaint
   - **Verify:** See orange "Admin Action Required" box

5. **Approve It:**
   - Click "✅ Approve & Assign"
   - **Verify:** Success message appears

6. **Check Asset Status:**
   - Go to "Assets" tab
   - Find the asset from the complaint
   - **Verify:** Badge shows "UNDER_MAINTENANCE" in orange/red

7. **Check Notifications:**
   - Click bell icon (top right)
   - **Verify:** Notifications for approval sent

---

## 📡 API Endpoints Used

### **Create Complaint (Student)**
```http
POST /api/complaints
Authorization: Bearer <STUDENT_TOKEN>
Content-Type: application/json

{
  "assetId": "asset-uuid",
  "title": "Projector not working",
  "description": "Screen is completely black",
  "images": ["url1", "url2"]
}
```

### **Approve Complaint (Admin)**
```http
POST /api/complaints/:id/approval
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "action": "accept",
  "notes": "Approved for urgent repair"
}
```

### **Reject Complaint (Admin)**
```http
POST /api/complaints/:id/approval
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "action": "reject",
  "notes": "This is not a maintenance issue, contact IT support"
}
```

### **Get All Complaints (Admin)**
```http
GET /api/complaints/admin
Authorization: Bearer <ADMIN_TOKEN>
```

---

## 🔍 Viewing Asset Status Changes

### **In Admin Dashboard:**

**Before Approval:**
```
┌─────────────────────────────┐
│  🟢 OPERATIONAL              │
│  Projector - Room 101        │
│  Building A, CSE Dept        │
│  📊 0 active complaints      │
└─────────────────────────────┘
```

**After Approval:**
```
┌─────────────────────────────┐
│  🟠 UNDER_MAINTENANCE        │
│  Projector - Room 101        │
│  Building A, CSE Dept        │
│  📊 1 active complaint       │
│  👷 Assigned to: Tech Name   │
└─────────────────────────────┘
```

---

## 🔔 Notification Flow

### **When Student Reports:**
- **To Student:** "Your complaint has been submitted and is pending admin approval."
- **To All Admins:** "New high priority complaint needs review: 'Projector Blurry' at Building A, Room 101."

### **When Admin Approves:**
- **To Student:** "Your complaint has been approved and assigned to a technician."
- **To Technician:** "New Assignment: 'Projector Blurry' at Building A. Priority: high."

### **When Admin Rejects:**
- **To Student:** "Your complaint was rejected. Reason: [admin's reason]"

---

## 🎯 Key Features

✅ **Quality Control:** Admin reviews before technician assignment
✅ **Prevent Spam:** Admins can reject invalid complaints
✅ **Asset Protection:** Asset stays operational until admin confirms issue
✅ **Smart Assignment:** Auto-assigns best technician based on multiple factors
✅ **Full Transparency:** Complete audit trail in status history
✅ **Priority Editing:** Admins can adjust AI severity if needed
✅ **Notifications:** Real-time updates for all parties

---

## 🐛 Troubleshooting

### **Issue: Approval button not showing**
**Solution:** Complaint must be in `reported` status. Already assigned/resolved complaints won't show approval buttons.

### **Issue: Asset status not updating**
**Solution:** 
1. Check database connection
2. Verify admin token is valid
3. Check browser console for errors
4. Refresh asset list after approval

### **Issue: No technician assigned after approval**
**Solution:**
1. Ensure at least one technician exists in same department
2. Check technician availability status
3. Create technician via Admin → Technicians → Register Technician

---

## 📝 Database Schema

### **Complaint Statuses:**
- `reported` - Initial state, pending admin review
- `approved` - (Not used, goes directly to `assigned`)
- `assigned` - Approved by admin, technician assigned
- `in_progress` - Technician started work
- `resolved` - Technician completed, waiting OTP
- `closed` - Student verified with OTP
- `rejected` - Admin rejected the complaint

### **Asset Statuses:**
- `operational` - Normal working condition
- `under_maintenance` - Has active approved complaint
- `faulty` - Marked as permanently faulty by admin

---

## 🚀 Next Steps After Approval

1. **Technician Logs In**
   - Sees new assignment in dashboard
   - Updates status to `in_progress`
   - Uploads repair photos as evidence

2. **Marks as Resolved**
   - Uploads repair proof (required)
   - Status → `resolved`
   - 4-digit OTP generated and sent to student

3. **Student Verifies**
   - Enters OTP in complaint details
   - Status → `closed`
   - Asset status → `operational`
   - Workflow complete! ✅

---

## 🎨 UI Screenshots Reference

Check your screenshots:
- **Complaint List:** Shows status badges (REPORTED, ASSIGNED)
- **Asset List:** Shows status badges (OPERATIONAL, UNDER_MAINTENANCE)

The system is working as designed! 🎉
