# ✅ Testing Admin Approval → Asset Under Maintenance

## 🎯 Quick Test Guide

This guide will help you verify that when an admin accepts a complaint, the asset status changes to "UNDER_MAINTENANCE" in the admin section.

---

## 📋 Prerequisites

✅ Both servers running:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

✅ Default accounts exist (created by seed data):
- Admin: `admin@campus.edu` / `admin123`
- Student: Create via signup or use existing

---

## 🧪 Step-by-Step Test

### **Step 1: Create a Test Complaint (as Student)**

1. **Open Browser** → http://localhost:5173

2. **Student Login/Signup:**
   - If you have student account: Login
   - Otherwise: Click "Sign Up" → Register as student

3. **Navigate to Dashboard**
   - Should see "Student Dashboard"

4. **Scan QR Code:**
   - Click "QR Scanner" or "Report Complaint"
   - Click "Demo Scan" button (for testing without camera)
   - Or scan a real asset QR code

5. **Fill Complaint Form:**
   ```
   Title: "AC Not Cooling"
   Description: "The AC in Room 101 is running but not producing cold air"
   Severity: Will be auto-calculated (medium/high)
   Images: Upload 1-2 test images (optional)
   ```

6. **Submit Complaint**
   - Click "Submit Complaint"
   - ✅ Success message should appear
   - ✅ Complaint created with status: **REPORTED**

7. **Note the Asset:**
   - Remember which asset you reported (e.g., "AC - Room 101")

---

### **Step 2: Check Initial Asset Status (as Admin)**

1. **Logout Student** → Click profile/logout

2. **Login as Admin:**
   ```
   Email: admin@campus.edu
   Password: admin123
   ```

3. **Navigate to Assets Tab:**
   - Click "Assets" tab in admin dashboard
   - Find the asset you just reported on (AC - Room 101)

4. **Verify Initial Status:**
   ```
   ┌─────────────────────────────┐
   │  🟢 OPERATIONAL              │  ← Asset is still operational
   │  AC - Room 101               │
   │  Building: A, Floor: 1       │
   └─────────────────────────────┘
   ```
   - ✅ Status badge should show **"OPERATIONAL"** in green
   - ✅ Asset is NOT yet under maintenance

---

### **Step 3: View the Reported Complaint**

1. **Go to "All Complaints" Tab:**
   - Click "All Complaints" in the navigation

2. **Find Your Complaint:**
   - Should see your complaint at the top (most recent)
   - Status badge: **REPORTED** (blue)

3. **Click on the Complaint Card:**
   - Complaint details modal opens
   - Shows full information:
     - Title, description, images
     - Asset information
     - Student who reported it
     - Severity level

4. **Verify Admin Action Section:**
   ```
   ┌─────────────────────────────────────────────┐
   │  ⚠️ Admin Action Required                    │
   │  This complaint is pending approval.         │
   │  Please review the details and take action.  │
   │                                               │
   │  [✅ Approve & Assign]  [❌ Reject Complaint] │
   └─────────────────────────────────────────────┘
   ```
   - ✅ Orange box with two buttons should appear
   - ✅ Only admins see this section
   - ✅ Only appears for **"reported"** status complaints

---

### **Step 4: Approve the Complaint**

1. **Review the Details:**
   - Check description makes sense
   - View images if attached
   - Verify severity level (can edit if needed)

2. **Click "Approve & Assign" Button:**
   - Green button with checkmark icon
   - System will:
     - Find best matching technician
     - Auto-assign to them
     - Update complaint status
     - **Update asset status** ✅

3. **Verify Success:**
   - ✅ Alert/success message: "Complaint Approved Successfully"
   - ✅ Modal closes automatically

---

### **Step 5: Verify Asset Status Changed** ⭐

1. **Go Back to Assets Tab:**
   - Click "Assets" in the navigation

2. **Find the Same Asset (AC - Room 101):**
   - Look for the asset you just approved complaint for

3. **Verify Status Changed:**
   ```
   ┌─────────────────────────────────────────────┐
   │  🟠 UNDER_MAINTENANCE                        │  ← Status CHANGED!
   │  AC - Room 101                               │
   │  Building: A, Floor: 1                       │
   │  📊 1 active complaint                       │
   │  👷 Assigned to: <Technician Name>           │
   └─────────────────────────────────────────────┘
   ```

   **Expected Changes:**
   - ✅ Status badge: **"OPERATIONAL"** → **"UNDER_MAINTENANCE"**
   - ✅ Badge color: Green → Orange/Red
   - ✅ Shows active complaint count
   - ✅ Shows assigned technician name (if exists)

---

### **Step 6: Verify Complaint Status Updated**

1. **Go Back to "All Complaints" Tab:**

2. **Find Your Complaint:**
   - Status badge: **REPORTED** → **ASSIGNED** ✅
   - Badge color: Blue → Yellow/Orange
   - Technician info now visible

3. **Click to Open Details:**
   ```
   Status: ASSIGNED
   Assigned To: <Technician Name>
   Assigned At: <Timestamp>
   
   Status Timeline:
   • REPORTED - <time>
     "Complaint reported. Waiting for Admin approval."
   
   • ASSIGNED - <time>
     "Approved by admin. Assigned to <Tech Name>."
   ```

---

## 🎯 What You Should See

### **Timeline Progression:**

```
1. Student Reports
   Complaint: REPORTED
   Asset: OPERATIONAL ✅
   
2. Admin Approves
   Complaint: REPORTED → ASSIGNED
   Asset: OPERATIONAL → UNDER_MAINTENANCE ✅✅
   Technician: Auto-assigned
   
3. Technician Works
   Complaint: ASSIGNED → IN_PROGRESS
   Asset: UNDER_MAINTENANCE (stays)
   
4. Technician Resolves
   Complaint: IN_PROGRESS → RESOLVED
   Asset: UNDER_MAINTENANCE (stays)
   OTP: Generated & sent to student
   
5. Student Verifies OTP
   Complaint: RESOLVED → CLOSED
   Asset: UNDER_MAINTENANCE → OPERATIONAL ✅
   Complete! 🎉
```

---

## 🔔 Notifications to Check

After approval, check the notification bell (🔔) icon:

**Admin Notifications:**
- ✅ "New Complaint Pending Approval" (when student reported)

**Student Notifications:**
- ✅ "Complaint Reported" (when submitted)
- ✅ "Complaint Approved" (after admin approval)

**Technician Notifications:**
- ✅ "New Assignment" (after admin approval)

---

## ❌ Testing Rejection Path

To test the rejection workflow:

1. **Create Another Complaint** (as student)

2. **Login as Admin** → View complaint

3. **Click "Reject Complaint" Button:**
   - Red button with X icon
   - Text area appears

4. **Enter Rejection Reason:**
   ```
   "This is not a maintenance issue. Please contact IT support directly."
   ```

5. **Click "Confirm Rejection"**

6. **Verify Results:**
   - ✅ Complaint status: **REJECTED**
   - ✅ Asset status: **OPERATIONAL** (unchanged)
   - ✅ Student gets notification with reason
   - ✅ No technician assigned

---

## 🐛 Troubleshooting

### **Asset status not changing to "under_maintenance":**

**Check:**
1. Backend server is running (http://localhost:5000)
2. Database connection is working
3. Admin token is valid (try re-login)
4. Complaint was in "reported" status
5. Check browser console for errors (F12)
6. Check backend logs for errors

**Solution:**
```bash
# Restart backend server
cd e:\Hackthon\server
npm run dev
```

### **Approval button not showing:**

**Reasons:**
- Complaint is not in "reported" status (already processed)
- Not logged in as admin
- Modal not loading complaint data properly

**Solution:**
- Ensure complaint status is "reported"
- Logout and re-login as admin
- Refresh the page

### **No technician assigned:**

**Check:**
1. At least one technician exists in the system
2. Technician is in same department as asset
3. Technician account is active

**Solution:**
```bash
## Create a technician via Admin Dashboard:
1. Admin Dashboard → Technicians Tab
2. Click "Register Technician"
3. Fill form:
   Name: Test Technician
   Email: tech@campus.edu
   Department: <Same as asset>
   Skills: Electrical
   Area: Building A
4. Submit
5. Check server logs for temporary password
6. Try approval again
```

---

## 📸 Visual Verification Checklist

Use this checklist with your screenshots:

### Screenshot 1: Complaints List
- [ ] Shows complaints with status badges
- [ ] "REPORTED" complaints visible in blue
- [ ] Can see asset name, student name
- [ ] Click opens detail modal

### Screenshot 2: Asset Management
- [ ] Shows assets with status badges
- [ ] "OPERATIONAL" assets in green before approval
- [ ] "UNDER_MAINTENANCE" assets in orange after approval
- [ ] Shows active complaint count
- [ ] Shows assigned technician name

### Screenshot 3: Complaint Details (Reported)
- [ ] Orange "Admin Action Required" box visible
- [ ] Two buttons: "Approve & Assign" and "Reject Complaint"
- [ ] Shows asset information
- [ ] Shows student information
- [ ] Shows description and images

### Screenshot 4: Complaint Details (After Approval)
- [ ] Status badge shows "ASSIGNED"
- [ ] Technician information visible
- [ ] "Admin Action Required" box is GONE
- [ ] Status timeline shows:
   - REPORTED → ASSIGNED progression
   - Timestamp for each status
   - Notes about approval

---

## 🎓 Expected Database Changes

After approval, these database updates occur:

```sql
-- Complaint table
UPDATE complaint SET
  status = 'assigned',
  technicianId = '<tech-uuid>',
  assignedAt = NOW()
WHERE id = '<complaint-id>';

-- Asset table
UPDATE asset SET
  status = 'under_maintenance'
WHERE id = '<asset-id>';

-- StatusUpdate table (new record)
INSERT INTO status_update (
  complaintId, status, updatedBy, notes, timestamp
) VALUES (
  '<complaint-id>',
  'assigned',
  'Admin Name',
  'Approved by admin. Assigned to Tech Name.',
  NOW()
);

-- Notification table (2 new records)
-- 1. For student
-- 2. For assigned technician
```

---

## ✅ Success Criteria

You've successfully verified the workflow when:

✅ Student can report complaint → Status: "REPORTED"
✅ Asset stays "OPERATIONAL" until admin approval
✅ Admin sees "Admin Action Required" section
✅ Admin clicks "Approve & Assign"
✅ Complaint status changes: "REPORTED" → "ASSIGNED"
✅ Asset status changes: "OPERATIONAL" → "UNDER_MAINTENANCE" ⭐
✅ Technician is auto-assigned
✅ Status timeline shows both statuses
✅ Notifications sent to student & technician
✅ Asset visible in "Assets" tab with orange "UNDER_MAINTENANCE" badge

---

## 🚀 Next: Complete Workflow Test

To test the complete end-to-end workflow:

1. **Student:** Report complaint
2. **Admin:** Approve
3. **Login as Technician** (use temp password from server logs)
4. **Technician:** Update status to "in_progress"
5. **Technician:** Upload repair photos
6. **Technician:** Mark as "resolved" → OTP generated
7. **Login as Student**
8. **Student:** Enter OTP to close
9. **Verify:** Asset back to "OPERATIONAL" ✅

---

## 📞 Need Help?

Check these files for reference:
- **Backend Approval Logic:** `server/src/controllers/complaintController.ts` (line 94-212)
- **Frontend Approval UI:** `src/components/ComplaintDetails.tsx` (line 172-223)
- **API Route:** `server/src/routes/complaintRoutes.ts` (line 17)
- **Full Workflow Doc:** `ADMIN_APPROVAL_WORKFLOW.md`

Happy Testing! 🎉
