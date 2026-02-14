# API Endpoints Documentation

## Base URL
`http://localhost:5000/api`

---

## 🎯 QR Scanner Integration

### Get Asset by QR Code
```
GET /assets/qr?qrUrl=<qr_url>
```
**Auth:** Required  
**Purpose:** Get asset details after scanning QR code  
**Response:**
```json
{
  "asset": { /* asset object */ },
  "hasActiveComplaint": boolean,
  "activeComplaintsCount": number
}
```

### Get Full Asset Details
```
GET /assets/:id/details
```
**Auth:** Required  
**Purpose:** Get asset with complete complaint history  
**Response:** Asset object with complaints array

---

## 🔍 Advanced Search & Filters

### Search Assets
```
GET /assets/search?search=projector&building=Block A&department=CSE&status=faulty
```
**Auth:** Required  
**Query Params:**
- `search` - Search term
- `building` - Filter by building
- `floor` - Filter by floor  
- `room` - Filter by room
- `department` - Filter by department
- `type` - Filter by asset type
- `status` - Filter by status
- `includeStats` - Include complaint stats (true/false)

### Get Assets by Location
```
GET /assets/location?building=Block A&floor=2&room=201
```
**Auth:** Required  
**Purpose:** Get all assets at specific location

### Get Filter Options
```
GET /assets/filters
```
**Auth:** Required  
**Purpose:** Get unique values for all filters
**Response:**
```json
{
  "buildings": ["Block A", "Block B"],
  "departments": ["CSE", "ECE"],
  "types": ["projector", "ac", "computer"],
  "statuses": ["operational", "faulty"]
}
```

---

## 📊 Admin Dashboard Analytics

### Get Complete Dashboard
```
GET /admin/dashboard
```
**Auth:** Admin only  
**Purpose:** Get all dashboard data in one request  
**Response:** Complete analytics object

### Get Overview Stats
```
GET /admin/stats/overview
```
**Auth:** Admin only  
**Response:**
```json
{
  "complaints": {
    "total": 150,
    "active": 45,
    "resolved": 100,
    "closed": 5,
    "avgResolutionTime": 24
  },
  "assets": {
    "total": 500,
    "operational": 480,
    "faulty": 20
  },
  "users": {
    "total": 1200,
    "students": 1000,
    "technicians": 50,
    "admins": 10
  }
}
```

### Get Complaints by Status
```
GET /admin/stats/complaints/status
```
**Auth:** Admin only  
**Response:**
```json
{
  "reported": 10,
  "assigned": 15,
  "in_progress": 20,
  "resolved": 100,
  "closed": 5
}
```

### Get Complaints by Severity
```
GET /admin/stats/complaints/severity
```
**Auth:** Admin only  
**Response:**
```json
{
  "low": 30,
  "medium": 60,
  "high": 40,
  "critical": 20
}
```

### Get Department Statistics
```
GET /admin/stats/departments
```
**Auth:** Admin only  
**Response:** Department-wise breakdown

### Get Complaint Trends
```
GET /admin/stats/trends?days=30
```
**Auth:** Admin only  
**Query Params:**
- `days` - Number of days (default: 30)
**Response:** Trends data by date

---

## 👥 User Management

### Get Users by Role
```
GET /admin/users/:role
```
**Auth:** Admin only  
**Params:**
- `role` - 'student', 'technician', or 'admin'
**Response:** Array of users with stats

### Get Technician Performance
```
GET /admin/technicians/performance
```
**Auth:** Admin only  
**Response:**
```json
[
  {
    "id": "...",
    "name": "John Doe",
    "department": "CSE",
    "email": "john@example.com",
    "phone": "...",
    "stats": {
      "totalAssignments": 50,
      "active": 10,
      "resolved": 38,
      "pending": 2,
      "inProgress": 8,
      "avgResolutionTime": 24,
      "resolutionRate": 76
    }
  }
]
```

---

## 🏢 Asset Management

### Get All Assets with Stats
```
GET /assets/stats
```
**Auth:** Admin only  
**Response:** Assets with complaint statistics

### Get Faulty Assets
```
GET /assets/faulty
```
**Auth:** Admin or Technician  
**Response:** Assets needing immediate attention

### Get Top Complaint Assets
```
GET /admin/assets/top-complaints?limit=10
```
**Auth:** Admin only  
**Query Params:**
- `limit` - Number of assets (default: 10)
**Response:** Assets with most complaints

### Create Asset
```
POST /assets
```
**Auth:** Admin only  
**Body:**
```json
{
  "name": "Projector",
  "type": "projector",
  "building": "Block A",
  "floor": "2",
  "room": "201",
  "department": "CSE"
}
```

### Update Asset
```
PUT /assets/:id
```
**Auth:** Admin only  
**Body:** Fields to update

### Delete Asset
```
DELETE /assets/:id
```
**Auth:** Admin only  
**Note:** Cannot delete asset with active complaints

---

## 📝 Activity & Audit

### Get Recent Activity
```
GET /admin/activity/recent?limit=20
```
**Auth:** Admin only  
**Query Params:**
- `limit` - Number of items (default: 20)
**Response:**
```json
{
  "recentComplaints": [...],
  "recentStatusUpdates": [...]
}
```

### Get Audit Logs
```
GET /admin/audit-logs?limit=100&userId=xxx&action=ASSET_CREATED
```
**Auth:** Admin only  
**Query Params:**
- `limit` - Number of logs (default: 100)
- `userId` - Filter by user (optional)
- `action` - Filter by action (optional)

---

## 📤 Data Export

### Export Data
```
GET /admin/export?type=complaints&format=json
```
**Auth:** Admin only  
**Query Params:**
- `type` - 'complaints', 'assets', or 'users'
- `format` - 'json' (CSV/Excel support can be added)
**Response:**
```json
{
  "type": "complaints",
  "format": "json",
  "timestamp": "2026-02-05T...",
  "count": 150,
  "data": [...]
}
```

---

## 🎨 Frontend Integration Examples

### QR Scanner Integration
```typescript
// After scanning QR code
const response = await fetch(`/api/assets/qr?qrUrl=${scannedUrl}`, {
  headers: { Authorization: `Bearer ${token}` }
});
const { asset, hasActiveComplaint } = await response.json();

if (hasActiveComplaint) {
  alert('This asset already has an active complaint');
} else {
  // Show complaint form
}
```

### Admin Dashboard Load
```typescript
// Load complete dashboard
const response = await fetch('/api/admin/dashboard', {
  headers: { Authorization: `Bearer ${token}` }
});
const dashboardData = await response.json();

// Or load specific stats
const stats = await fetch('/api/admin/stats/overview', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());
```

### Advanced Asset Search
```typescript
const query = new URLSearchParams({
  search: searchTerm,
  building: selectedBuilding,
  department: selectedDept,
  status: selectedStatus,
  includeStats: 'true'
});

const assets = await fetch(`/api/assets/search?${query}`, {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());
```

### Technician Performance Chart
```typescript
const performance = await fetch('/api/admin/technicians/performance', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());

// Use performance data for charts
const chartData = performance.map(tech => ({
  name: tech.name,
  resolved: tech.stats.resolved,
  active: tech.stats.active,
  resolutionRate: tech.stats.resolutionRate
}));
```

---

## ⚡ Performance Optimizations

All endpoints are optimized with:
- ✅ Indexed database queries
- ✅ Minimal data fetching (select only needed fields)
- ✅ Proper query batching
- ✅ Transaction support for data consistency
- ✅ Efficient filtering and sorting
- ✅ Response payload optimization

---

## 🔒 Authentication

All endpoints (except health check) require JWT token:

```
Authorization: Bearer <jwt_token>
```

Role-based access:
- **Student**: Can access assets, own complaints
- **Technician**: Can access assets, assigned complaints, faulty assets
- **Admin**: Full access to all endpoints

---

## 🧹 Cleaner Management

### Generate Daily Cleaning Tasks
```
POST /cleaners/tasks/generate
```
**Auth:** Admin/Warden only  
**Purpose:** Auto-distribute hostel rooms among available cleaners based on assigned blocks.  
**Response:**
```json
{
  "message": "Successfully generated 45 cleaning tasks...",
  "tasksCreated": 45,
  "cleanersActive": 5,
  "details": "Distributed among 5 cleaners across 2 blocks."
}
```

### Update Cleaner Availability (Triggers Redistribution)
```
PATCH /cleaners/:cleanerId/availability
```
**Auth:** Cleaner/Admin/Warden  
**Body:**
```json
{
  "isAvailable": false
}
```
**Note:** Setting availability to `false` triggers automatic redistribution of pending tasks.
