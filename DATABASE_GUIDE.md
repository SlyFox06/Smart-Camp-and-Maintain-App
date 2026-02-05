# Database Access Guide - Smart Campus Maintenance

## 📚 Quick Reference

### Database Structure
- **Type**: SQLite
- **ORM**: Prisma
- **Location**: `server/prisma/dev.db`
- **Schema**: `server/prisma/schema.prisma`

### Centralized Client
All database operations now use a centralized Prisma client:
```typescript
import { prisma } from '../db/prisma';
```

---

## 🎯 Common Use Cases & Examples

### 1. QR Code Scanning Flow

**When a student scans a QR code:**

```typescript
import { getAssetByQRUrl, hasActiveComplaint } from '../db/queries';

// Step 1: Get asset from QR URL
const asset = await getAssetByQRUrl(scannedQrUrl);

if (!asset) {
  return res.status(404).json({ message: 'Asset not found' });
}

// Step 2: Check if asset already has active complaint
const hasComplaint = await hasActiveComplaint(asset.id);

if (hasComplaint) {
  return res.status(400).json({ 
    message: 'This asset already has an active complaint',
    asset 
  });
}

// Step 3: Show complaint form with pre-filled asset info
```

**Alternative - Direct Prisma query:**
```typescript
const asset = await prisma.asset.findFirst({
  where: { qrUrl: scannedQrUrl },
  include: {
    complaints: {
      where: { status: { notIn: ['resolved', 'closed'] } }
    }
  }
});
```

---

### 2. Creating a Complaint

**Complete workflow:**

```typescript
import { prisma } from '../db/prisma';
import { createNotification } from '../services/notificationService';

const createComplaint = async (req, res) => {
  const { assetId, title, description, severity, images } = req.body;
  const studentId = req.user.id;

  try {
    // Get asset to find appropriate technician
    const asset = await prisma.asset.findUnique({ 
      where: { id: assetId } 
    });

    // Find available technician in same department
    const technician = await prisma.user.findFirst({
      where: {
        role: 'technician',
        department: asset.department
      },
      orderBy: {
        assignments: { _count: 'asc' } // Load balancing
      }
    });

    // Use transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Create complaint
      const complaint = await tx.complaint.create({
        data: {
          assetId,
          studentId,
          technicianId: technician?.id,
          title,
          description,
          severity: severity || 'medium',
          status: technician ? 'assigned' : 'reported',
          images: JSON.stringify(images || [])
        }
      });

      // Create status history
      await tx.statusUpdate.create({
        data: {
          complaintId: complaint.id,
          status: complaint.status,
          updatedBy: req.user.name,
          notes: 'Initial report'
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: studentId,
          action: 'COMPLAINT_CREATED',
          details: `Created complaint ${complaint.id}`
        }
      });

      return complaint;
    });

    // Send notifications (outside transaction)
    await createNotification(
      studentId,
      'complaint_created',
      'Complaint Registered',
      `Your complaint "${title}" has been registered`
    );

    if (technician) {
      await createNotification(
        technician.id,
        'complaint_assigned',
        'New Assignment',
        `New complaint: ${title} at ${asset.building} ${asset.room}`
      );
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create complaint', error });
  }
};
```

---

### 3. Student Dashboard Data

**Load all student data in one query:**

```typescript
import { getStudentDashboard } from '../db/queries';

// Using pre-built query
const data = await getStudentDashboard(studentId);
// Returns: { complaints, stats }

// Or custom query
const studentData = await prisma.user.findUnique({
  where: { id: studentId },
  include: {
    complaints: {
      include: {
        asset: true,
        technician: { select: { name: true, phone: true } },
        statusHistory: { orderBy: { timestamp: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    },
    notifications: {
      where: { read: false },
      orderBy: { createdAt: 'desc' }
    }
  }
});
```

---

### 4. Technician Dashboard & Workload

**Get assigned tasks:**

```typescript
import { getTechnicianWorkload } from '../db/queries';

const { complaints, workload } = await getTechnicianWorkload(technicianId);

// Workload contains:
// - total, assigned, inProgress, resolved counts
// - bySeverity: critical, high, medium, low counts

// Or filter by priority
const urgentTasks = await prisma.complaint.findMany({
  where: {
    technicianId,
    status: { in: ['assigned', 'in_progress'] },
    severity: { in: ['high', 'critical'] }
  },
  include: {
    asset: true,
    student: { select: { name: true, phone: true, email: true } }
  },
  orderBy: [
    { severity: 'desc' },
    { createdAt: 'asc' }
  ]
});
```

**Update complaint status:**

```typescript
const updateComplaintStatus = async (complaintId, newStatus, notes) => {
  // Generate OTP for resolved status
  const otp = newStatus === 'resolved' 
    ? Math.floor(1000 + Math.random() * 9000).toString() 
    : undefined;

  const updated = await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      status: newStatus,
      ...(newStatus === 'resolved' && {
        resolvedAt: new Date(),
        otp
      })
    }
  });

  // Add to history
  await prisma.statusUpdate.create({
    data: {
      complaintId,
      status: newStatus,
      updatedBy: technicianName,
      notes
    }
  });

  return { updated, otp };
};
```

---

### 5. Admin Dashboard Analytics

**Get comprehensive analytics:**

```typescript
import { getAdminAnalytics } from '../db/queries';

const analytics = await getAdminAnalytics();

// Returns:
// - overview: totalComplaints, activeComplaints, etc.
// - complaintsByStatus
// - complaintsBySeverity
// - assetsByStatus
// - technicianStats
```

**Custom admin queries:**

```typescript
// Get all technicians with their workload
const technicians = await prisma.user.findMany({
  where: { role: 'technician' },
  include: {
    assignments: {
      select: {
        id: true,
        status: true,
        severity: true,
        createdAt: true,
        resolvedAt: true
      }
    }
  }
});

// Calculate performance for each
const technicianPerformance = technicians.map(tech => {
  const resolved = tech.assignments.filter(a => a.status === 'resolved');
  const avgTime = resolved.length > 0
    ? resolved.reduce((sum, a) => {
        if (a.resolvedAt) {
          return sum + (new Date(a.resolvedAt).getTime() - new Date(a.createdAt).getTime());
        }
        return sum;
      }, 0) / resolved.length / 3600000 // hours
    : 0;

  return {
    id: tech.id,
    name: tech.name,
    department: tech.department,
    totalAssigned: tech.assignments.length,
    resolved: resolved.length,
    avgResolutionTime: Math.round(avgTime * 10) / 10
  };
});
```

---

### 6. Asset Management

**Create asset with QR code:**

```typescript
import { generateQRCode } from '../utils/qr';
import { prisma } from '../db/prisma';

const createAsset = async (assetData) => {
  const asset = await prisma.asset.create({
    data: {
      name: assetData.name,
      type: assetData.type,
      building: assetData.building,
      floor: assetData.floor,
      room: assetData.room,
      department: assetData.department,
      status: 'operational'
    }
  });

  // Generate QR code
  const qrUrl = await generateQRCode(asset.id);
  
  // Update asset with QR URL
  const updatedAsset = await prisma.asset.update({
    where: { id: asset.id },
    data: { qrUrl }
  });

  return updatedAsset;
};
```

**Get assets needing maintenance:**

```typescript
import { getFaultyAssets } from '../db/queries';

const needsAttention = await getFaultyAssets();

// Or custom query
const maintenanceDue = await prisma.asset.findMany({
  where: {
    OR: [
      { status: 'faulty' },
      { 
        lastMaintenance: {
          lte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days
        }
      }
    ]
  },
  include: {
    complaints: {
      where: { status: { notIn: ['resolved', 'closed'] } }
    }
  }
});
```

---

### 7. Notifications

**Create notification:**

```typescript
import { createNotification } from '../services/notificationService';

await createNotification(
  userId,
  'complaint_resolved',
  'Issue Resolved',
  'Your complaint has been resolved',
  complaintId // optional
);
```

**Get user notifications:**

```typescript
const notifications = await prisma.notification.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  take: 20
});

// Unread count
const unreadCount = await prisma.notification.count({
  where: { userId, read: false }
});

// Mark as read
await prisma.notification.update({
  where: { id: notificationId },
  data: { read: true }
});

// Mark all as read
await prisma.notification.updateMany({
  where: { userId, read: false },
  data: { read: true }
});
```

---

### 8. Search & Filtering

**Search complaints with multiple filters:**

```typescript
import { searchComplaints } from '../db/queries';

const results = await searchComplaints({
  status: ['reported', 'assigned'],
  severity: ['high', 'critical'],
  department: 'CSE',
  dateFrom: new Date('2026-01-01'),
  searchTerm: 'projector'
});
```

**Search assets:**

```typescript
const assets = await prisma.asset.findMany({
  where: {
    AND: [
      { department: 'CSE' },
      { building: 'Block A' },
      {
        OR: [
          { name: { contains: searchTerm } },
          { type: { contains: searchTerm } }
        ]
      }
    ]
  }
});
```

---

### 9. Advanced Queries

**Using transactions:**

```typescript
const result = await prisma.$transaction(async (tx) => {
  // All operations must succeed or all fail
  const complaint = await tx.complaint.update({
    where: { id: complaintId },
    data: { status: 'closed' }
  });

  await tx.asset.update({
    where: { id: complaint.assetId },
    data: { status: 'operational' }
  });

  await tx.notification.create({
    data: {
      userId: complaint.studentId,
      type: 'complaint_closed',
      title: 'Complaint Closed',
      message: 'Your complaint has been closed'
    }
  });

  return complaint;
});
```

**Raw SQL (when needed):**

```typescript
// For complex analytics
const result = await prisma.$queryRaw`
  SELECT 
    u.department,
    COUNT(c.id) as complaint_count,
    AVG(JULIANDAY(c.resolvedAt) - JULIANDAY(c.createdAt)) as avg_days
  FROM Complaint c
  JOIN User u ON c.studentId = u.id
  WHERE c.status = 'resolved'
  GROUP BY u.department
`;
```

**Aggregations:**

```typescript
// Count complaints by status
const stats = await prisma.complaint.groupBy({
  by: ['status'],
  _count: { _all: true },
  _max: { createdAt: true }
});

// Average resolution time by severity
const avgByTechnician = await prisma.complaint.groupBy({
  by: ['technicianId'],
  where: { 
    status: 'resolved',
    resolvedAt: { not: null }
  },
  _count: { _all: true },
  _avg: {
    // Would need to add computed field for this
  }
});
```

---

## 🛠️ Useful Prisma Commands

```bash
# Navigate to server directory first
cd e:\Hackthon\server

# View database in GUI (opens localhost:5555)
npx prisma studio

# Generate Prisma Client after schema changes
npx prisma generate

# Create new migration
npx prisma migrate dev --name add_new_field

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Seed database with sample data
npx prisma db seed

# Format schema file
npx prisma format
```

---

## 📊 Performance Tips

1. **Use `select` to limit fields:**
```typescript
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true
    // Don't fetch password or other unnecessary fields
  }
});
```

2. **Use `include` wisely:**
```typescript
// Good - only include what you need
const complaint = await prisma.complaint.findUnique({
  where: { id },
  include: {
    asset: { select: { name: true, room: true } },
    student: { select: { name: true, email: true } }
  }
});

// Avoid - fetches everything
const complaint = await prisma.complaint.findUnique({
  where: { id },
  include: { asset: true, student: true, statusHistory: true }
});
```

3. **Batch operations:**
```typescript
// Instead of multiple creates
await prisma.notification.createMany({
  data: [
    { userId: '1', type: 'info', title: 'Test', message: 'Test' },
    { userId: '2', type: 'info', title: 'Test', message: 'Test' }
  ]
});
```

4. **Use transactions for related operations:**
```typescript
await prisma.$transaction([
  prisma.complaint.update({ where: { id }, data: { status: 'resolved' } }),
  prisma.notification.create({ data: notificationData })
]);
```

---

## 🔍 Debugging

**Enable query logging:**
The centralized Prisma client already has logging enabled in development mode.

**Check query execution:**
```typescript
// Log the query
const result = await prisma.complaint.findMany({
  where: { status: 'reported' }
});
console.log('Found:', result.length);
```

**Use Prisma Studio:**
```bash
npx prisma studio
```
Opens a GUI at http://localhost:5555 to browse and edit data.

---

## 📝 Common Patterns

### Pattern 1: Get entity with related data
```typescript
const complaintWithDetails = await prisma.complaint.findUnique({
  where: { id: complaintId },
  include: {
    asset: true,
    student: true,
    technician: true,
    statusHistory: { orderBy: { timestamp: 'desc' } }
  }
});
```

### Pattern 2: Filter with multiple conditions
```typescript
const activeHighPriorityComplaints = await prisma.complaint.findMany({
  where: {
    AND: [
      { status: { in: ['reported', 'assigned', 'in_progress'] } },
      { severity: { in: ['high', 'critical'] } }
    ]
  }
});
```

### Pattern 3: Count with conditions
```typescript
const criticalCount = await prisma.complaint.count({
  where: {
    severity: 'critical',
    status: { not: 'closed' }
  }
});
```

### Pattern 4: Update with conditional logic
```typescript
const updated = await prisma.complaint.update({
  where: { id: complaintId },
  data: {
    status: newStatus,
    ...(newStatus === 'resolved' && { resolvedAt: new Date() }),
    ...(newStatus === 'closed' && { closedAt: new Date() })
  }
});
```

---

## ✅ Summary

- **Always use** the centralized client: `import { prisma } from '../db/prisma'`
- **Use pre-built queries** from `db/queries.ts` for common operations
- **Use transactions** for operations that must succeed or fail together
- **Select only needed fields** to improve performance
- **Use Prisma Studio** for quick database inspection
- **Check the schema** (`prisma/schema.prisma`) to understand relationships

For more examples, see `server/src/db/queries.ts`!
