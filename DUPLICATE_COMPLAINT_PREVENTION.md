# 🛠️ Prevent Duplicate Complaints Feature - Implementation Guide

## User Requirement

**When a student reports a complaint and it causes the asset to be under maintenance, other students trying to scan the same asset should see a warning message that the asset is already being repaired, instead of being able to submit another complaint.**

## Changes Already Complete ✅

### 1. **Backend API - Active Complaint Check**
**File:** `server/src/controllers/assetController.ts`
- ✅ Added `getActiveComplaint()` function
- ✅ Checks for complaints with status: 'reported', 'assigned', or 'in_progress'
- ✅ Returns complaint details including student, technician, and asset info

### 2. **Backend Route**
**File:** `server/src/routes/assetRoutes.ts`
- ✅ Added import for `getActiveComplaint`
- ✅ Added route: `GET /api/assets/:id/active-complaint`

### 3. **Frontend State Management**
**File:** `src/components/ComplaintForm.tsx`
- ✅ Added state: `activeComplaint` and `isCheckingAsset`
- ✅ Added useEffect hook to check asset status when asset is selected

## Changes Still Needed 🔧

### Frontend UI Updates

**File:** `src/components/ComplaintForm.tsx` (around line 200, after asset selection)

Add this code after the asset info display box (after line 199):

```tsx
                        )}

                        {/* Active Complaint Warning */}
                        {isCheckingAsset && (
                            <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-600">Checking asset status...</p>
                            </div>
                        )}

                        {activeComplaint && (
                            <div className="mt-3 p-6 bg-orange-50 border-2 border-orange-400 rounded-xl">
                                <div className="flex items-start gap-3 mb-3">
                                    <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-orange-900 mb-2">
                                            🛠️ Asset Already Under Maintenance
                                        </h3>
                                        <p className="text-sm text-orange-800 mb-3">
                                            This asset is currently being repaired.  You cannot submit a new complaint until the existing one is resolved.
                                        </p>
                                        <div className="bg-white/60 rounded-lg p-4 space-y-2">
                                            <p className="text-sm">
                                                <strong>Existing Complaint:</strong> {activeComplaint.title}
                                            </p>
                                            <p className="text-sm">
                                                <strong>Status:</strong>{' '}
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                    activeComplaint.status === 'reported' ? 'bg-blue-100 text-blue-800' :
                                                    activeComplaint.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-orange-100 text-orange-800'
                                                }`}>
                                                    {activeComplaint.status.toUpperCase()}
                                                </span>
                                            </p>
                                            <p className="text-sm">
                                                <strong>Reported by:</strong> {activeComplaint.student?.name}
                                            </p>
                                            {activeComplaint.technician && (
                                                <p className="text-sm">
                                                    <strong>Assigned to:</strong> {activeComplaint.technician?.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
```

### Disable Form When Active Complaint Exists

**Also in `ComplaintForm.tsx`:**

1. **Disable all form inputs when `activeComplaint` exists:**

Find the Title input (around line 203-213) and add `disabled={!!activeComplaint}`:
```tsx
<input
    type="text"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder="e.g., Projector not displaying properly"
    className="input-field-light"
    required
    disabled={!!activeComplaint}  // ADD THIS LINE
/>
```

2. **Disable description textarea** (around line 220):
```tsx
<textarea
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    placeholder="Describe the issue in detail..."
    rows={4}
    className="input-field-light resize-none"
    required
    disabled={!!activeComplaint}  // ADD THIS LINE
/>
```

3. ** Disable imageupload button** (around line 260):
```tsx
<button
    type="button"
    onClick={() => imageInputRef.current?.click()}
    className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
    disabled={images.length >= 5 || !!activeComplaint}  // UPDATE THIS LINE
>
```

4. **Disable submit button** (around line 365):
```tsx
<button
    type="submit"
    disabled={isSubmitting || !!activeComplaint}  // UPDATE THIS LINE
    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
>
```

## How It Works

### Student Workflow:

1. **Student A reports complaint for AC 1**
   - Status: `reported`
   - Asset: AC 1

2. **Admin approves**
   - Complaint status: `assigned`
   - Asset status: `under_maintenance`

3. **Student B scans same AC 1**
   - QR scanner navigates to `/report/{assetId}`
   - ComplaintForm loads with `prefilledAssetId`
   - useEffect triggers when asset is selected
   - API call: `GET /api/assets/{assetId}/active-complaint`

4. **Two Scenarios:**

   **Scenario A: No Active Complaint**
   - API returns 404
   - `activeComplaint` = null
   - Form  is enabled ✅
   - Student  can submit new complaint

   **Scenario B: Active Complaint Exists**
   - API returns complaint details
   - `activeComplaint` = complaint data
   - Warning message displays 🚧
   - Form inputs are disabled ❌
   - Submit button is disabled ❌
   - Student sees:
     - Asset is under maintenance
     - Existing complaint details
     - Who reported it
     - Current status
     - Assigned technician (if any)

5. **Once Complaint is Resolved**
   - Status changes to `resolved` or `closed`
   - API no longer returns this complaint (filtered out)
   - Next student can scan and report normally ✅

## Testing Steps

### 1. **Create Active Complaint:**
- Login as Student A
- Scan/select AC 2 asset
- Submit complaint with title "Not cooling"
- Logout

### 2. **Admin Approves:**
- Login as Admin
- Go to "All Complaints"
- Click on the new complaint
- Click "Approve/Assign Complaint"
- Select a technician
- Confirm

### 3. **Test Duplicate Prevention:**
- Login as Student B
- Try to scan the same AC 2 asset
- **Expected Result:** 
  - ✅ Warning message appears
  - ✅ Message says "Asset Already Under Maintenance"
  - ✅ Shows existing complaint details
  - ✅ Form is disabled (grayed out)
  - ✅ Cannot submit new complaint

### 4. **After Resolution:**
- Have technician mark as resolved
- Have Student A verify with OTP
- Complaint status → `closed`
- Asset status → `operational`
- Now Student B can scan and report normally ✅

## API Endpoint Details

### Request:
```
GET /api/assets/:id/active-complaint
Authorization: Bearer <token>
```

### Response (200 - Active Complaint Found):
```json
{
  "id": "uuid",
  "title": "Not cooling the room",
  "description": "AC is running but not producing cold air",
  "status": "assigned",
  "severity": "medium",
  "asset": { ... },
  "student": {
    "id": "uuid",
    "name": "Atharva Naik",
    "email": "atharva@campus.edu"
  },
  "technician": {
    "id": "uuid",
    "name": "Raj Tech",
    "email": "raj@campus.edu"
  },
  "images": ["url1", "url2"],
  "createdAt": "2026-02-07T..."
}
```

### Response (404 - No Active Complaint):
```json
{
  "message": "No active complaint found"
}
```

## Database Query

The backend checks for complaints with these statuses:
- `reported` (waiting for admin approval)
- `assigned` (approved, technician assigned)
- `in_progress` (technician working on it)

Resolved or closed complaints are **not** considered "active" and won't block new submissions.

## UI/UX Design

### Warning Message Colors:
- Background: Orange-50 (light orange)
- Border: Orange-400 (medium orange, 2px)
- Icon: Orange-600 (AlertCircle)
- Text: Orange-900 (dark orange for titles)
- Inner card: White with 60% opacity

### Status Badge Colors:
- REPORTED: Blue
- ASSIGNED: Yellow
- IN_PROGRESS: Orange

### Design Principles:
- Clear, friendly message
- Shows all relevant information
- Explains why they can't submit
- Shows who else reported it
- Shows current progress

## Security & Performance

✅ **Authentication Required:** Only logged-in students can access
✅ **Role-Based:** Any student can see the warning
✅ **Optimized Query:** Uses `findFirst` with index on `assetId` and `status`
✅ **Automatic Check:** Runs automatically when asset is selected
✅ **Real-time:** Always shows current status

## Edge Cases Handled

1. **Multiple Active Complaints:** Returns the most recent one
2. **Network Error:** Silently fails, allows form (fail-open for UX)
3. **No Asset Selected:** Doesn't run the check
4. **Asset Changed:** Runs check again for new asset
5. **Complaint Resolved During Form Fill:** User can submit (eventual consistency OK)

## Next Steps

1. **Manually add the UI code** to ComplaintForm.tsx as shown above
2. **Restart backend** (should auto-restart with ts-node-dev)
3. **Refresh frontend**
4. **Test the workflow** as described

The backend is fully ready! Just need to add the UI components to show the warning and disable the form.

---

**Status:** Backend Complete ✅ | Frontend Needs Manual UI Update 🔧
