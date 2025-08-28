# Third-Party Services Integration

## Overview

The Loan Origination System integrates with multiple third-party services for verification and data collection. We provide a **Third-Party API Simulator** for development and testing, which can be replaced with real APIs in production.

## Architecture

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   LOS Main      │    │  External Services   │    │  Third-Party APIs   │
│   Application   │◄──►│  Client              │◄──►│  (Simulator)        │
│   (Port 3000)   │    │  (src/services/      │    │  (Port 4000)        │
│                 │    │   external-services) │    │                     │
└─────────────────┘    └──────────────────────┘    └─────────────────────┘
```

## Integrated Services

### 1. PAN Verification Service
- **Purpose**: Verify PAN card authenticity and name matching
- **Used In**: Pre-qualification stage
- **Endpoint**: `POST /api/pan/verify`
- **Integration**: `src/services/external-services.js → verifyPAN()`

**Request:**
```json
{
  "pan_number": "ABCDE1234F",
  "name": "RAJESH KUMAR SHARMA"
}
```

**Response:**
```json
{
  "success": true,
  "verification_status": "verified",
  "name_match": true,
  "name_on_pan": "RAJESH KUMAR SHARMA",
  "date_of_birth": "1985-06-15"
}
```

### 2. CIBIL Credit Score Service
- **Purpose**: Fetch credit score and credit history
- **Used In**: Underwriting and Credit Decision stages
- **Endpoint**: `POST /api/cibil/credit-score`
- **Integration**: `src/services/external-services.js → getCreditScore()`

**Request:**
```json
{
  "pan_number": "ABCDE1234F",
  "name": "Rajesh Kumar Sharma",
  "date_of_birth": "1985-06-15",
  "mobile_number": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "credit_score": 750,
  "credit_grade": "Excellent",
  "existing_loans": [...],
  "credit_cards": [...],
  "factors": {...}
}
```

### 3. Account Aggregator Service
- **Purpose**: Fetch bank statements and transaction analysis
- **Used In**: Underwriting stage
- **Endpoint**: `POST /api/account-aggregator/bank-statements`
- **Integration**: `src/services/external-services.js → getBankStatements()`

**Request:**
```json
{
  "account_number": "12345678901234",
  "ifsc_code": "HDFC0000123",
  "from_date": "2024-01-01",
  "to_date": "2024-03-31"
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "average_balance": 75000,
    "total_credits": 225000,
    "total_debits": 105000
  },
  "transactions": [...],
  "analysis": {...}
}
```

### 4. Employment Verification Service
- **Purpose**: Verify employment details and salary
- **Used In**: Application Processing stage
- **Endpoint**: `POST /api/employment/verify`
- **Integration**: `src/services/external-services.js → verifyEmployment()`

**Request:**
```json
{
  "employee_id": "EMP001",
  "company_name": "Tech Solutions Pvt Ltd",
  "employee_name": "Rajesh Kumar Sharma",
  "designation": "Senior Software Engineer"
}
```

**Response:**
```json
{
  "success": true,
  "employment_status": "Active",
  "current_salary": 75000,
  "joining_date": "2018-03-15",
  "company_details": {...}
}
```

### 5. GST Verification Service
- **Purpose**: Verify company GST registration
- **Used In**: Application Processing stage (for business loans)
- **Endpoint**: `POST /api/gst/verify`
- **Integration**: `src/services/external-services.js → verifyGST()`

### 6. Aadhar Verification Service
- **Purpose**: Verify Aadhar card details and address
- **Used In**: Pre-qualification stage
- **Endpoint**: `POST /api/aadhar/verify`
- **Integration**: `src/services/external-services.js → verifyAadhar()`

## Integration Points in LOS Stages

### Stage 1: Pre-Qualification
```javascript
// In src/services/pre-qualification.js
const panResult = await this.externalServices.verifyPAN(panNumber, fullName);
const aadharResult = await this.externalServices.verifyAadhar(aadharNumber, fullName);
```

### Stage 2: Application Processing
```javascript
// In src/services/application-processing.js
const employmentResult = await this.externalServices.verifyEmployment(...);
const gstResult = await this.externalServices.verifyGST(...);
```

### Stage 3: Underwriting
```javascript
// In src/services/underwriting.js
const creditResult = await this.externalServices.getCreditScore(...);
const bankResult = await this.externalServices.getBankStatements(...);
```

## Configuration

### Environment Variables (.env)
```bash
# Third-Party API Configuration
THIRD_PARTY_API_URL=http://localhost:4000/api
SIMULATOR_PORT=4000

# Production External APIs (when not using simulator)
CIBIL_API_URL=https://api.cibil.com
CIBIL_API_KEY=your-cibil-api-key
PAN_API_URL=https://api.pan-verification.com
PAN_API_KEY=your-pan-api-key
```

### External Services Client Configuration
```javascript
// In src/services/external-services.js
class ExternalServicesClient {
    constructor() {
        this.baseURL = process.env.THIRD_PARTY_API_URL || 'http://localhost:4000/api';
        this.timeout = 10000; // 10 seconds timeout
    }
}
```

## Running the Services

### Option 1: Start All Services Together (Recommended)
```bash
npm run start:all
```
This starts both the main LOS server (port 3000) and the third-party simulator (port 4000).

### Option 2: Start Services Separately
```bash
# Terminal 1: Start third-party simulator
npm run start:simulator

# Terminal 2: Start main LOS server
npm start
```

### Option 3: Development Mode
```bash
# Terminal 1: Start simulator
cd third-party-simulator && npm start

# Terminal 2: Start main server in dev mode
npm run dev
```

## Testing Integration

### Health Checks
```bash
# Check main LOS health
curl http://localhost:3000/api/health

# Check simulator health
curl http://localhost:4000/health

# Check simulator services status
curl http://localhost:4000/api/status
```

### Complete Workflow Test
```bash
npm run test:workflow
```
This runs a complete end-to-end test that uses all integrated services.

### Individual Service Tests
```bash
# Test PAN verification
curl -X POST http://localhost:4000/api/pan/verify \
  -H "Content-Type: application/json" \
  -d '{"pan_number":"ABCDE1234F","name":"Test User"}'

# Test CIBIL credit score
curl -X POST http://localhost:4000/api/cibil/credit-score \
  -H "Content-Type: application/json" \
  -d '{"pan_number":"ABCDE1234F","name":"Test User","date_of_birth":"1985-06-15","mobile_number":"9876543210"}'
```

## Error Handling

The external services client includes comprehensive error handling:

1. **Network Timeouts**: 10-second timeout for all requests
2. **Service Unavailable**: Graceful degradation when services are down
3. **Invalid Responses**: Proper error parsing and logging
4. **Retry Logic**: Can be extended with retry mechanisms

## Production Deployment

### Replacing Simulator with Real APIs

1. **Update Environment Variables**:
```bash
THIRD_PARTY_API_URL=https://production-api.com/api
CIBIL_API_URL=https://api.cibil.com
CIBIL_API_KEY=your-production-key
```

2. **Update External Services Client**:
   - Modify `src/services/external-services.js`
   - Add authentication headers
   - Update request/response formats as per real API specifications

3. **Add API Keys and Authentication**:
   - Store API keys securely
   - Implement OAuth or API key authentication
   - Add request signing if required

### Security Considerations

1. **API Keys**: Store in environment variables, never in code
2. **HTTPS**: Use HTTPS for all external API calls in production
3. **Rate Limiting**: Implement rate limiting for external API calls
4. **Data Privacy**: Ensure PII is handled securely in API calls
5. **Logging**: Sanitize logs to avoid exposing sensitive data

## Monitoring and Observability

### Metrics to Track
- API response times
- Success/failure rates
- Service availability
- Error patterns

### Logging
All external API calls are logged with:
- Request details (sanitized)
- Response status
- Processing time
- Error details

### Health Monitoring
```javascript
// Check if external services are available
const healthStatus = await externalServices.checkServiceHealth();
```

## Troubleshooting

### Common Issues

1. **Simulator Not Running**:
   ```bash
   Error: connect ECONNREFUSED 127.0.0.1:4000
   ```
   **Solution**: Start the simulator with `npm run start:simulator`

2. **Port Conflicts**:
   ```bash
   Error: listen EADDRINUSE :::4000
   ```
   **Solution**: Change `SIMULATOR_PORT` in .env or kill the process using port 4000

3. **API Timeout**:
   ```bash
   Error: timeout of 10000ms exceeded
   ```
   **Solution**: Check network connectivity or increase timeout in external-services.js

### Debug Mode
Set `LOG_LEVEL=debug` in .env for detailed API call logging.

## Future Enhancements

1. **Caching**: Implement Redis caching for frequently accessed data
2. **Circuit Breaker**: Add circuit breaker pattern for resilience
3. **Async Processing**: Queue non-critical verifications for background processing
4. **Webhook Support**: Add webhook endpoints for real-time updates
5. **API Versioning**: Support multiple API versions
6. **Mock Data Management**: Enhanced mock data configuration for testing

This integration provides a robust foundation for external service communication while maintaining flexibility for production deployment.