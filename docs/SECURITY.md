# PAC Security Policy

## Security Principles

PAC is built with **privacy-first** and **security-by-design** principles:

### 🔒 Core Security Guarantees

1. **No Location Database**
   - ✅ PAC does NOT store any addresses or locations
   - ✅ All encoding/decoding happens algorithmically
   - ✅ No persistent storage of geographic data

2. **No User Registration**
   - ✅ No user accounts required
   - ✅ No personal information collected
   - ✅ No tracking or profiling

3. **No Logging of Sensitive Data**
   - ✅ PAC codes are NOT logged
   - ✅ Coordinates are NOT logged
   - ✅ Request payloads are NOT logged
   - ⚠️ Only metadata is logged (timestamps, IPs for rate limiting, endpoints)

4. **Client-Side First**
   - ✅ SDK works 100% offline
   - ✅ No server required for basic operations
   - ✅ API is optional (for convenience only)

## API Security

### Authentication

All API endpoints (except health checks) require authentication:

```
X-API-Key: {payload}.{signature}
```

API keys are HMAC-based tokens that:
- Do NOT contain sensitive data
- Can be revoked instantly
- Are rate-limited per key
- Have configurable scopes/permissions

### Rate Limiting

| Tier | Limit | Window |
|------|-------|--------|
| Authenticated | 100 requests | 1 minute |
| Unauthenticated | 10 requests | 1 minute |

Rate limiting prevents:
- Denial of Service (DoS) attacks
- Brute force attacks
- Resource exhaustion
- Abuse

### Anti-Bot Protection

The API implements adaptive anti-bot challenges:
- Triggered when suspicious patterns detected
- CAPTCHA/Turnstile integration
- IP reputation checking
- Request pattern analysis

**Note**: Anti-bot is best deployed at Edge/WAF layer (Cloudflare, AWS WAF, etc.)

### CORS Policy

CORS is configured with a whitelist of allowed origins:

```json
{
  "AllowedOrigins": [
    "https://yourdomain.com",
    "https://app.yourdomain.com"
  ]
}
```

**Development**: `localhost` origins are allowed in development mode only.

### HTTPS Only

In production:
- ✅ All connections MUST use HTTPS
- ✅ HTTP requests are rejected
- ✅ HSTS headers are set
- ✅ TLS 1.2+ required

## Data Protection

### What is Stored

**API Keys Table** (minimal):
```sql
CREATE TABLE ApiKeys (
    Id UUID PRIMARY KEY,
    KeyHash VARCHAR(64) NOT NULL,  -- SHA-256 hash
    CreatedAt TIMESTAMP NOT NULL,
    ExpiresAt TIMESTAMP,
    IsRevoked BOOLEAN DEFAULT FALSE,
    Scopes JSONB  -- Optional permissions
);
```

**Nothing Else**: No addresses, no locations, no coordinates, no PAC codes.

### What is Logged

**Allowed Logs**:
```json
{
  "timestamp": "2026-01-21T12:00:00Z",
  "ip": "192.168.1.1",
  "endpoint": "/v1/pac/encode",
  "statusCode": 200,
  "duration": 15,
  "apiKeyId": "uuid"
}
```

**Forbidden Logs**:
```json
{
  "pacCode": "NEVER LOGGED",
  "latitude": "NEVER LOGGED",
  "longitude": "NEVER LOGGED",
  "payload": "NEVER LOGGED"
}
```

### Log Retention

- **Access Logs**: 7 days (for debugging)
- **Error Logs**: 30 days (for monitoring)
- **Audit Logs**: 90 days (for security)
- **API Key Logs**: Indefinite (for billing/compliance)

## Threat Model

### Threats We Protect Against

1. **Location Tracking**
   - ❌ No database = no tracking possible
   - ❌ No logs = no history reconstruction

2. **Data Breaches**
   - ❌ No sensitive data to breach
   - ✅ API keys can be revoked instantly

3. **Man-in-the-Middle (MITM)**
   - ✅ HTTPS enforced
   - ✅ Certificate pinning recommended for mobile apps

4. **Denial of Service (DoS)**
   - ✅ Rate limiting per IP
   - ✅ Rate limiting per API key
   - ✅ Adaptive anti-bot

5. **Brute Force**
   - ✅ Rate limiting prevents enumeration
   - ✅ No user accounts to brute force

### Threats Outside Our Scope

1. **Client-Side Attacks**
   - ⚠️ XSS/CSRF protection is app developer's responsibility
   - ⚠️ Secure storage of API keys is app developer's responsibility

2. **Network-Level Attacks**
   - ⚠️ DDoS mitigation should be handled by CDN/WAF
   - ⚠️ BGP hijacking is outside our control

3. **Physical Security**
   - ⚠️ Device theft/loss is user's responsibility
   - ⚠️ Shoulder surfing is user's responsibility

## Vulnerability Disclosure

### Reporting a Vulnerability

If you discover a security vulnerability, please:

1. **DO NOT** open a public GitHub issue
2. Email: 
[Email]moahmedyousif28@gmail.com) • [🐦 Follow on LinkedIn](https://www.linkedin.com/in/mohamed-ahmed-yousif/)

3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **24 hours**: Initial acknowledgment
- **7 days**: Assessment and triage
- **30 days**: Fix and disclosure (coordinated)

### Bounty Program

We currently do NOT have a bug bounty program, but we:
- Acknowledge security researchers in our SECURITY.md
- Provide swag/merchandise for valid reports
- May offer monetary rewards for critical vulnerabilities

## Security Best Practices for Developers

### 1. Use SDK When Possible

```typescript
// ✅ Good: Client-side SDK (no network, no logs)
import { encode } from '@pac/core';
const pac = encode({ latitude, longitude });

// ❌ Avoid: API call (network, logs, rate limits)
const response = await fetch('/v1/pac/encode', { ... });
```

### 2. Never Log PAC Codes

```csharp
// ✅ Good
logger.LogInformation("PAC encoded successfully");

// ❌ BAD
logger.LogInformation($"PAC code: {pacCode}");
```

### 3. Secure API Keys

```typescript
// ✅ Good: Environment variable
const apiKey = process.env.PAC_API_KEY;

// ❌ BAD: Hardcoded
const apiKey = "abc123.def456";
```

### 4. Validate Input

```csharp
// ✅ Good
if (latitude < -90 || latitude > 90)
    throw new ArgumentOutOfRangeException();

// ❌ BAD: No validation
var pac = PACCore.Encode(latitude, longitude);
```

### 5. Handle Errors Gracefully

```typescript
// ✅ Good
try {
  const result = decode(pacCode);
  if (!result.isValid) {
    console.error("Invalid PAC code");
    return;
  }
} catch (error) {
  console.error("Decode failed:", error.message);
}

// ❌ BAD: Expose internals
catch (error) {
  alert(error.stack); // Leaks implementation details
}
```

## Compliance

### GDPR Compliance

PAC is GDPR-friendly because:
- ✅ No personal data collected
- ✅ No user profiling
- ✅ No cross-site tracking
- ✅ No data retention (except API keys)

### CCPA Compliance

PAC is CCPA-friendly because:
- ✅ No sale of personal information
- ✅ No sharing with third parties
- ✅ No targeted advertising

### HIPAA/PCI-DSS

PAC does NOT handle:
- ❌ Health information (HIPAA)
- ❌ Payment information (PCI-DSS)

Therefore, these regulations do not apply.

## Security Audits

### Internal Audits

- **Frequency**: Quarterly
- **Scope**: Code review, dependency scan, penetration testing
- **Tools**: SonarQube, OWASP ZAP, Snyk

### External Audits

- **Frequency**: Annually (or before major releases)
- **Scope**: Full security assessment
- **Auditor**: Independent third-party

### Audit Reports


## Security Updates

### Dependency Management

- **Automated**: Dependabot/Renovate for dependency updates
- **Review**: All security updates reviewed within 24 hours
- **Deployment**: Critical patches deployed within 48 hours

### CVE Monitoring

We monitor:
- .NET CVEs
- Node.js/npm CVEs
- Docker base image CVEs
- Third-party library CVEs

### Security Advisories

Subscribe to security advisories:
- GitHub Security Advisories
- Email: moahmedyousif28@gmail.com


## Contact


[Email]moahmedyousif28@gmail.com) • [🐦 Follow on LinkedIn](https://www.linkedin.com/in/mohamed-ahmed-yousif/)


---

**Last Updated**: 2026-01-21  
**Version**: 1.0
