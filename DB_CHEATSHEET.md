# Database Quick Reference Cheat Sheet

## 🎯 Quick Imports
```typescript
import { prisma } from '../db/prisma';                    // Centralized client
import * as queries from '../db/queries';                 // Pre-built queries
import { createNotification } from '../services/notificationService';
```

## 📋 Most Used Queries

### Get Asset by QR
```typescript
const asset = await prisma.asset.findFirst({ where: { qrUrl } });
```

### Create Complaint
```typescript
const complaint = await prisma.complaint.create({
  data: { assetId, studentId, title, description, severity, status }
});
```

### Get User's Complaints
```typescript
const complaints = await prisma.complaint.findMany({
  where: { studentId },
  include: { asset: true, technician: true }
});
```

### Update Complaint Status
```typescript
await prisma.complaint.update({
  where: { id },
  data: { status, resolvedAt: new Date() }
});
```

### Get Technician Assignments
```typescript
const tasks = await prisma.complaint.findMany({
  where: { technicianId, status: { in: ['assigned', 'in_progress'] } }
});
```

### Get Analytics
```typescript
const total = await prisma.complaint.count();
const active = await prisma.complaint.count({
  where: { status: { in: ['reported', 'assigned', 'in_progress'] } }
});
```

### Create Notification
```typescript
await createNotification(userId, 'type', 'Title', 'Message', complaintId);
```

### Get Notifications
```typescript
const notifs = await prisma.notification.findMany({
  where: { userId, read: false },
  orderBy: { createdAt: 'desc' }
});
```

## 🔧 Common Patterns

### With Relations
```typescript
include: {
  asset: true,
  student: { select: { name: true, email: true } },
  technician: true
}
```

### Filtering
```typescript
where: {
  status: { in: ['reported', 'assigned'] },
  severity: 'high',
  createdAt: { gte: new Date('2026-01-01') }
}
```

### Sorting
```typescript
orderBy: { createdAt: 'desc' }
// or
orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }]
```

### Transactions
```typescript
await prisma.$transaction(async (tx) => {
  const complaint = await tx.complaint.update({ ... });
  await tx.notification.create({ ... });
  return complaint;
});
```

## 🎨 Pre-built Query Functions

```typescript
// QR Scanning
await queries.getAssetByQRUrl(qrUrl);
await queries.hasActiveComplaint(assetId);

// Student
await queries.getStudentDashboard(studentId);
await queries.getComplaintWithHistory(complaintId);

// Technician
await queries.getTechnicianWorkload(technicianId);
await queries.getPendingAssignments(technicianId);

// Admin
await queries.getAdminAnalytics();
await queries.getUsersByRole('student');
await queries.getRecentActivity(20);

// Assets
await queries.getAllAssetsWithStats();
await queries.getFaultyAssets();

// Search
await queries.searchComplaints({ status: ['reported'], severity: ['high'] });
await queries.searchAssets('projector');
```

## 🛠️ CLI Commands

```bash
# Open database GUI
npx prisma studio

# Regenerate client
npx prisma generate

# Create migration
npx prisma migrate dev --name description

# Reset database
npx prisma migrate reset

# Seed data
npx prisma db seed
```

## 📊 Common Counts & Stats

```typescript
// Count
const count = await prisma.complaint.count({ where: { status: 'reported' } });

// Group by
const grouped = await prisma.complaint.groupBy({
  by: ['status'],
  _count: { _all: true }
});

// Aggregate
const stats = await prisma.complaint.aggregate({
  _count: true,
  _max: { createdAt: true }
});
```

## 🔍 Database Schema Reference

**User** → id, email, password, name, phone, role, department, avatar
**Asset** → id, name, type, building, floor, room, department, qrUrl, status
**Complaint** → id, assetId, studentId, technicianId, title, description, status, severity
**StatusUpdate** → id, complaintId, status, updatedBy, notes, timestamp
**Notification** → id, userId, type, title, message, read, relatedComplaintId
**AuditLog** → id, userId, action, details, timestamp

**Relationships:**
- User → complaints (as student)
- User → assignments (as technician)
- Asset → complaints
- Complaint → asset, student, technician, statusHistory

## 💡 Tips

✅ Use centralized `prisma` client
✅ Use pre-built queries for common operations
✅ Use transactions for related operations
✅ Select only needed fields with `select`
✅ Use Prisma Studio for debugging
❌ Don't create multiple PrismaClient instances
❌ Don't fetch unnecessary relations
❌ Don't forget to handle errors
