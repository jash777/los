# 🏦 Underwriting Status Management Guide

This guide explains how to move applications between different underwriting statuses in your Loan Origination System (LOS).

## 📋 Overview

The underwriting status management system allows you to:
- Move applications to the underwriting stage
- Update application statuses within underwriting
- Set up demo data with realistic distributions
- Monitor underwriting statistics

## 🎯 Available Statuses

### Application Stages
- `pre_qualification` - Initial stage where applications start
- `underwriting` - Main underwriting review stage
- `credit_decision` - Final credit decision stage
- `quality_check` - Quality verification stage
- `loan_funding` - Loan disbursement stage

### Underwriting Statuses
- `pending` - Waiting for review
- `under_review` - Currently being reviewed by an underwriter
- `approved` - Approved (automatically moves to `credit_decision` stage)
- `rejected` - Rejected (stays in `underwriting` stage)
- `in_progress` - Work in progress

## 🚀 Quick Start

### Method 1: Command Line Interface (CLI)

The fastest way to manage statuses is using the CLI script:

```bash
# Show current statistics
node src/scripts/manage-underwriting-status.js stats

# Setup demo data with realistic distribution
node src/scripts/manage-underwriting-status.js demo

# List all underwriting applications
node src/scripts/manage-underwriting-status.js list underwriting

# Move specific applications to underwriting
node src/scripts/manage-underwriting-status.js move EL_1756357120212_vqutijowi EL_1756357646700_m671scq93 pending

# Approve applications
node src/scripts/manage-underwriting-status.js update approved EL_1756357120212_vqutijowi EL_1756357646700_m671scq93

# Reject applications
node src/scripts/manage-underwriting-status.js update rejected EL_1756358155286_itgiitlzf
```

### Method 2: Web Interface

1. Start your server: `npm start`
2. Open: `http://localhost:3000/src/tests/underwriting-status-management.html`
3. Use the web interface to:
   - View statistics
   - Setup demo data
   - Perform bulk actions
   - Monitor application statuses

### Method 3: API Endpoints

Direct API calls for integration:

```bash
# Get statistics
curl http://localhost:3000/api/underwriting-status/stats

# Setup demo
curl -X POST http://localhost:3000/api/underwriting-status/setup-demo

# Move applications to underwriting
curl -X POST http://localhost:3000/api/underwriting-status/move-to-underwriting \
  -H "Content-Type: application/json" \
  -d '{
    "applicationNumbers": ["EL_1756357120212_vqutijowi", "EL_1756357646700_m671scq93"],
    "status": "pending"
  }'

# Update application statuses
curl -X POST http://localhost:3000/api/underwriting-status/update-status \
  -H "Content-Type: application/json" \
  -d '{
    "applicationNumbers": ["EL_1756357120212_vqutijowi"],
    "status": "approved",
    "reviewer": "John Doe",
    "comments": "Application meets all criteria"
  }'
```

## 📊 Demo Setup

The demo setup creates a realistic distribution of applications:

- **60%** of available applications moved to underwriting
- **40%** set to `pending` status
- **40%** set to `under_review` status  
- **15%** set to `approved` status (moves to credit_decision)
- **5%** set to `rejected` status

```bash
# Setup demo data
node src/scripts/manage-underwriting-status.js demo
```

## 🔄 Status Transitions

### Moving to Underwriting

Applications can be moved from any stage to underwriting:

```javascript
// CLI
node src/scripts/manage-underwriting-status.js move APP_NUMBER pending

// API
POST /api/underwriting-status/move-to-underwriting
{
  "applicationNumbers": ["APP_NUMBER"],
  "status": "pending"
}
```

### Updating Underwriting Status

For applications already in underwriting:

```javascript
// CLI
node src/scripts/manage-underwriting-status.js update approved APP_NUMBER

// API  
POST /api/underwriting-status/update-status
{
  "applicationNumbers": ["APP_NUMBER"],
  "status": "approved",
  "reviewer": "Underwriter Name",
  "comments": "Optional comments"
}
```

### Status Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ pre_qualification│ -> │   underwriting   │ -> │ credit_decision │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              │ (if rejected)
                              ▼
                       ┌──────────────────┐
                       │   underwriting   │
                       │   (rejected)     │
                       └──────────────────┘
```

## 📈 Monitoring

### View Statistics

```bash
# CLI
node src/scripts/manage-underwriting-status.js stats

# Output:
📈 Underwriting Dashboard Statistics:
=====================================
Total Applications: 25
In Underwriting: 15

Status Breakdown:
  📋 Pending: 6
  🔍 Under Review: 6  
  ✅ Approved: 2
  ❌ Rejected: 1
  ➡️ Moved to Credit Decision: 2
```

### List Applications

```bash
# List all underwriting applications
node src/scripts/manage-underwriting-status.js list underwriting

# List only pending applications
node src/scripts/manage-underwriting-status.js list underwriting pending
```

## 🎯 Use Cases

### Scenario 1: Setup Initial Demo Data

```bash
# Create realistic underwriting dashboard
node src/scripts/manage-underwriting-status.js demo
```

### Scenario 2: Move Specific Applications to Review

```bash
# Move applications that need manual review
node src/scripts/manage-underwriting-status.js move \
  EL_1756357120212_vqutijowi \
  EL_1756357646700_m671scq93 \
  EL_1756358155286_itgiitlzf \
  under_review
```

### Scenario 3: Approve a Batch of Applications

```bash
# Approve multiple applications at once
node src/scripts/manage-underwriting-status.js update approved \
  EL_1756357120212_vqutijowi \
  EL_1756357646700_m671scq93
```

### Scenario 4: Set Applications to Pending

```bash
# Set applications to pending for later review
node src/scripts/manage-underwriting-status.js update pending \
  EL_1756358155286_itgiitlzf \
  EL_1756359392860_f97i4u1l4
```

## 🔧 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/underwriting-status/stats` | Get underwriting statistics |
| `GET` | `/api/underwriting-status/applications` | List applications by stage/status |
| `POST` | `/api/underwriting-status/move-to-underwriting` | Move applications to underwriting |
| `POST` | `/api/underwriting-status/update-status` | Update status for underwriting applications |
| `POST` | `/api/underwriting-status/setup-demo` | Setup demo data |
| `GET` | `/api/underwriting-status/help` | Get API documentation |

### Request/Response Examples

#### Move to Underwriting
```json
POST /api/underwriting-status/move-to-underwriting
{
  "applicationNumbers": ["EL_1756357120212_vqutijowi"],
  "status": "pending"
}

Response:
{
  "success": true,
  "processed": 1,
  "successful": 1,
  "failed": 0,
  "results": [
    {
      "applicationNumber": "EL_1756357120212_vqutijowi",
      "success": true,
      "oldStage": "pre_qualification",
      "oldStatus": "pending",
      "newStage": "underwriting",
      "newStatus": "pending"
    }
  ]
}
```

#### Update Status
```json
POST /api/underwriting-status/update-status
{
  "applicationNumbers": ["EL_1756357120212_vqutijowi"],
  "status": "approved",
  "reviewer": "Senior Underwriter",
  "comments": "Excellent credit profile"
}

Response:
{
  "success": true,
  "processed": 1,
  "successful": 1,
  "failed": 0,
  "results": [
    {
      "applicationNumber": "EL_1756357120212_vqutijowi",
      "success": true,
      "oldStatus": "under_review",
      "newStatus": "approved",
      "newStage": "credit_decision"
    }
  ]
}
```

## 🛠️ Integration with Underwriting Dashboard

The status management system works seamlessly with your existing underwriting dashboard:

1. **Dashboard Data**: Applications moved to underwriting appear in the dashboard
2. **Manual Decisions**: Use the dashboard's manual decision API to approve/reject
3. **Status Sync**: All status changes are reflected in real-time
4. **Audit Trail**: All changes are logged for compliance

### Dashboard Integration Example

```javascript
// Get dashboard data for an application
const response = await fetch(`/api/underwriting/${applicationNumber}/dashboard`);
const dashboardData = await response.json();

// Make manual decision through dashboard
const decision = await fetch(`/api/underwriting/${applicationNumber}/decision`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    decision: 'approve',
    comments: 'Strong financial profile',
    reviewer: 'Senior Underwriter'
  })
});
```

## 🚨 Important Notes

1. **Status Transitions**: 
   - `approved` → moves to `credit_decision` stage
   - `rejected` → stays in `underwriting` stage
   - `under_review`, `pending` → stays in `underwriting` stage

2. **Data Consistency**: All changes update both database and file system

3. **Audit Trail**: Every status change is logged with timestamp and user

4. **Error Handling**: Failed operations are reported with detailed error messages

5. **Batch Operations**: All operations support batch processing for efficiency

## 🎉 Success!

You now have a complete underwriting status management system! Your applications can be easily moved between different statuses to populate your underwriting dashboard with realistic data.

### Next Steps

1. **Setup Demo**: Run `node src/scripts/manage-underwriting-status.js demo`
2. **Check Dashboard**: View your underwriting dashboard to see the populated data
3. **Test Workflow**: Use the manual decision APIs to test the complete workflow
4. **Monitor**: Use the statistics and listing features to monitor your applications

Your underwriting dashboard is now ready for comprehensive testing and demonstration! 🚀
