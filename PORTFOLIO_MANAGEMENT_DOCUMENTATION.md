# 📊 Portfolio Management & Co-lending System Documentation

## 🎯 Overview

The Portfolio Management and Co-lending System provides comprehensive functionality for managing lending portfolios, co-lending partnerships, and bank account operations. This system is essential for NBFCs and banks to maintain their lending capacity, track co-lending ratios, and manage multiple bank accounts efficiently.

---

## 🏗️ System Architecture

### Core Components

1. **Portfolio Management**
   - Portfolio limit tracking
   - Utilization monitoring
   - Historical changes tracking
   - Analytics and reporting

2. **Co-lending Configuration**
   - NBFC and Bank ratio management
   - Partner information tracking
   - Agreement status monitoring

3. **Bank Accounts Management**
   - Multiple account support
   - Balance tracking
   - Account status management

---

## 📋 API Endpoints

### 🔍 Portfolio Overview
**GET** `/api/portfolio/overview`

Get comprehensive portfolio overview including:
- Portfolio limits and utilization
- Co-lending configuration
- Bank accounts summary

**Response Example:**
```json
{
  "success": true,
  "data": {
    "portfolio": {
      "total_limit": 20000000,
      "utilized_amount": 5000000,
      "available_amount": 15000000,
      "utilization_percentage": "25.00",
      "currency": "INR",
      "last_updated": "2025-08-28T07:30:00.000Z"
    },
    "co_lending": {
      "nbfc_ratio": 20,
      "bank_ratio": 80,
      "nbfc_partner": "NBFC Partner",
      "bank_partner": "Bank Partner",
      "agreement_status": "active",
      "agreement_date": "2025-08-28T07:30:00.000Z"
    },
    "bank_accounts": {
      "total_accounts": 2,
      "total_balance": 20000000,
      "active_accounts": 2
    }
  }
}
```

### 📈 Portfolio Analytics
**GET** `/api/portfolio/analytics?period=30d`

Get detailed analytics including:
- Portfolio metrics
- Co-lending exposure
- Risk analysis
- Bank account summary

**Query Parameters:**
- `period`: Analytics period (7d, 30d, 90d)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "portfolio_metrics": {
      "total_limit": 20000000,
      "utilized_amount": 5000000,
      "available_amount": 15000000,
      "utilization_percentage": "25.00",
      "average_utilization": "22.50"
    },
    "co_lending_exposure": {
      "nbfc_exposure": 1000000,
      "bank_exposure": 4000000,
      "nbfc_percentage": 20,
      "bank_percentage": 80
    },
    "bank_accounts_summary": {
      "total_accounts": 2,
      "total_balance": 20000000,
      "average_balance": 10000000,
      "active_accounts": 2
    },
    "risk_metrics": {
      "concentration_risk": "75.00",
      "liquidity_ratio": "100.00"
    }
  }
}
```

### 📋 Portfolio History
**GET** `/api/portfolio/history?limit=20&offset=0`

Get portfolio limit change history with pagination.

**Query Parameters:**
- `limit`: Number of entries per page (default: 50)
- `offset`: Number of entries to skip (default: 0)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "date": "2025-08-28T07:30:00.000Z",
        "old_limit": 20000000,
        "new_limit": 25000000,
        "reason": "Portfolio expansion",
        "updated_by": "admin"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 20,
      "offset": 0,
      "has_more": false
    }
  }
}
```

### 🔄 Update Portfolio Limit
**PUT** `/api/portfolio/limit`

Update portfolio limit and track changes.

**Request Body:**
```json
{
  "new_limit": 30000000,
  "reason": "Portfolio expansion for increased lending capacity"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "message": "Portfolio limit updated successfully",
    "new_limit": 30000000,
    "available_amount": 25000000,
    "history_entry": {
      "date": "2025-08-28T07:30:00.000Z",
      "old_limit": 20000000,
      "new_limit": 30000000,
      "reason": "Portfolio expansion for increased lending capacity",
      "updated_by": "system"
    }
  }
}
```

---

## 🤝 Co-lending Management

### Get Co-lending Configuration
**GET** `/api/portfolio/co-lending/config`

Get current co-lending configuration.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "nbfc_ratio": 20,
    "bank_ratio": 80,
    "total_ratio": 100,
    "nbfc_partner": "NBFC Partner",
    "bank_partner": "Bank Partner",
    "co_lending_agreement_date": "2025-08-28T07:30:00.000Z",
    "last_updated": "2025-08-28T07:30:00.000Z",
    "agreement_status": "active"
  }
}
```

### Update Co-lending Configuration
**PUT** `/api/portfolio/co-lending/config`

Update co-lending configuration.

**Request Body:**
```json
{
  "nbfc_ratio": 30,
  "bank_ratio": 70,
  "nbfc_partner": "Updated NBFC Partner",
  "bank_partner": "Updated Bank Partner",
  "agreement_status": "active"
}
```

**Validation Rules:**
- NBFC ratio + Bank ratio must equal 100%
- Ratios must be positive numbers

---

## 🏦 Bank Accounts Management

### Get Bank Accounts
**GET** `/api/portfolio/bank-accounts?status=active`

Get all bank accounts with optional status filter.

**Query Parameters:**
- `status`: Filter by account status (active, inactive)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "account_id": "ACC001",
        "account_name": "Primary Operating Account",
        "bank_name": "HDFC Bank",
        "account_number": "XXXX1234",
        "account_type": "Current",
        "balance": 5000000,
        "currency": "INR",
        "status": "active",
        "created_date": "2025-08-28T07:30:00.000Z"
      }
    ],
    "summary": {
      "total_accounts": 2,
      "total_balance": 20000000,
      "active_accounts": 2
    }
  }
}
```

### Add Bank Account
**POST** `/api/portfolio/bank-accounts`

Add a new bank account.

**Request Body:**
```json
{
  "account_name": "New Investment Account",
  "bank_name": "Axis Bank",
  "account_number": "XXXX9999",
  "account_type": "Savings",
  "balance": 5000000,
  "currency": "INR"
}
```

**Required Fields:**
- `account_name`: Name of the account
- `bank_name`: Bank name
- `account_number`: Account number
- `account_type`: Type of account
- `balance`: Initial balance

### Update Bank Account Balance
**PUT** `/api/portfolio/bank-accounts/{account_id}/balance`

Update balance for a specific bank account.

**Request Body:**
```json
{
  "new_balance": 6000000,
  "reason": "Monthly interest credit"
}
```

---

## 💰 Co-lending Ratio Management

### Default Configuration
- **NBFC Ratio**: 20%
- **Bank Ratio**: 80%
- **Total**: 100%

### Example Scenarios

#### Scenario 1: Standard Co-lending (20-80)
```json
{
  "nbfc_ratio": 20,
  "bank_ratio": 80
}
```
- NBFC provides 20% of loan amount
- Bank provides 80% of loan amount
- Total exposure: 100%

#### Scenario 2: Balanced Co-lending (30-70)
```json
{
  "nbfc_ratio": 30,
  "bank_ratio": 70
}
```
- NBFC provides 30% of loan amount
- Bank provides 70% of loan amount
- Higher NBFC participation

#### Scenario 3: NBFC Heavy (40-60)
```json
{
  "nbfc_ratio": 40,
  "bank_ratio": 60
}
```
- NBFC provides 40% of loan amount
- Bank provides 60% of loan amount
- Maximum NBFC participation

---

## 📊 Portfolio Analytics

### Key Metrics

1. **Utilization Percentage**
   - Formula: (Utilized Amount / Total Limit) × 100
   - Tracks how much of the portfolio is being used

2. **Co-lending Exposure**
   - NBFC Exposure: (Utilized Amount × NBFC Ratio) / 100
   - Bank Exposure: (Utilized Amount × Bank Ratio) / 100

3. **Risk Metrics**
   - **Concentration Risk**: Percentage of total balance in largest account
   - **Liquidity Ratio**: (Total Bank Balance / Portfolio Limit) × 100

4. **Average Utilization**
   - Historical average utilization over specified period

---

## 🔧 Data Management

### File Structure
```
data/
├── portfolio-data.json      # Portfolio limits and history
├── co-lending-data.json     # Co-lending configuration
└── bank-accounts.json       # Bank accounts information
```

### Initial Data Setup
The system automatically creates initial data files with:
- Portfolio limit: ₹2 Crore (20,000,000)
- Co-lending ratio: 20% NBFC, 80% Bank
- Sample bank accounts

---

## 🚨 Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid portfolio limit"
}
```

#### 400 Validation Error
```json
{
  "success": false,
  "error": "NBFC and Bank ratios must sum to 100%"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Bank account not found"
}
```

---

## 📈 Performance Expectations

### Response Times
- **Overview endpoints**: < 500ms
- **Analytics endpoints**: < 1000ms
- **Update operations**: < 800ms
- **History queries**: < 600ms

### Data Validation
- All numeric values validated
- Ratio validation (must sum to 100%)
- Account balance validation (non-negative)
- Required field validation

---

## 🔐 Security Considerations

### Request Headers
- `X-Request-ID`: Unique request identifier for tracking
- `X-User-ID`: User identifier for audit trails
- `Content-Type`: application/json

### Data Protection
- Sensitive account numbers masked in responses
- Audit trails for all changes
- Validation of all input data

---

## 📝 Best Practices

### Portfolio Management
1. **Regular Monitoring**: Check utilization percentage daily
2. **Limit Planning**: Plan portfolio expansions based on demand
3. **Risk Assessment**: Monitor concentration risk regularly
4. **Historical Analysis**: Review portfolio history for trends

### Co-lending Configuration
1. **Ratio Validation**: Always ensure ratios sum to 100%
2. **Partner Updates**: Keep partner information current
3. **Agreement Tracking**: Monitor agreement status
4. **Exposure Calculation**: Verify exposure calculations

### Bank Account Management
1. **Balance Updates**: Update balances regularly
2. **Account Status**: Monitor account status
3. **Multiple Accounts**: Distribute funds across accounts
4. **Audit Trails**: Maintain change history

---

## 🧪 Testing

### Test Scripts
- `test_portfolio_endpoints.js`: Comprehensive endpoint testing
- Postman Collection: `PORTFOLIO_API_POSTMAN_COLLECTION.json`

### Test Scenarios
1. **Portfolio Overview**: Verify all data is present
2. **Limit Updates**: Test portfolio limit changes
3. **Co-lending Updates**: Test ratio changes
4. **Bank Account Operations**: Test account management
5. **Validation**: Test error scenarios

---

## 📞 Support

### Troubleshooting
1. **Data Files**: Check if data files exist in `/data` directory
2. **Validation**: Verify input data meets requirements
3. **Permissions**: Ensure file write permissions
4. **Server Health**: Check server status

### Common Issues
1. **Ratio Validation**: Ensure NBFC + Bank = 100%
2. **Negative Balances**: Account balances must be positive
3. **Missing Fields**: All required fields must be provided
4. **File Permissions**: Ensure write access to data directory

---

## 🎯 Success Criteria

### Functional Requirements
- ✅ Portfolio limit management
- ✅ Co-lending ratio configuration
- ✅ Bank account management
- ✅ Historical tracking
- ✅ Analytics and reporting
- ✅ Data validation
- ✅ Error handling

### Performance Requirements
- ✅ Response time < 1 second
- ✅ Data consistency
- ✅ Audit trails
- ✅ Input validation

The Portfolio Management and Co-lending System provides a robust foundation for managing lending operations with comprehensive tracking, analytics, and risk management capabilities.
