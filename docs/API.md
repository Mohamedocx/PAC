# PAC API Documentation

## Base URL
```
Production: NOt yey
Development: http://localhost:5000
```

## Authentication

All API endpoints (except health checks) require authentication via API Key.

### Header
```
X-API-Key: your-api-key
```

### Getting an API Key

API keys are HMAC-based tokens in the format:
```
{payload}.{signature}
```

Example:
```
user123.a8f3d9c2b1e4f5a6b7c8d9e0f1a2b3c4
```

## Rate Limiting

| Tier | Limit | Window |
|------|-------|--------|
| Authenticated | 100 requests | 1 minute |
| Unauthenticated | 10 requests | 1 minute |

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

### Rate Limit Exceeded Response
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

## Endpoints

### Health Checks

#### GET /healthz
Check if the API is healthy.

**Request:**
```bash
curl http://localhost:5000/healthz
```

**Response:**
```json
{
  "status": "healthy"
}
```

#### GET /readyz
Check if the API is ready to serve requests.

**Request:**
```bash
curl http://localhost:5000/readyz
```

**Response:**
```json
{
  "status": "ready"
}
```

---

### PAC Operations

#### POST /v1/pac/encode
Encode geographic coordinates into a PAC code.

**Request:**
```json
{
  "latitude": 31.2357,
  "longitude": 30.0444,
  "precision": 8,
  "floor": 3,
  "apartment": "02"
}
```

**Parameters:**
- `latitude` (required): Latitude (-90 to 90)
- `longitude` (required): Longitude (-180 to 180)
- `precision` (optional): Geohash precision (6-9, default: 8)
- `floor` (optional): Floor number for apartments
- `apartment` (optional): Apartment number (required if floor is provided)

**Response (Success):**
```json
{
  "pacCode": "STQ4-S3X1-7 / F3-A02",
  "precision": 8
}
```

**Response (Error):**
```json
{
  "error": "Latitude must be between -90 and 90"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/v1/pac/encode \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 31.2357,
    "longitude": 30.0444,
    "precision": 8,
    "floor": 3,
    "apartment": "02"
  }'
```

---

#### POST /v1/pac/decode
Decode a PAC code into geographic coordinates.

**Request:**
```json
{
  "pacCode": "STQ4-S3X1-7 / F3-A02"
}
```

**Parameters:**
- `pacCode` (required): The PAC code to decode

**Response (Success):**
```json
{
  "latitude": 31.235678,
  "longitude": 30.044432,
  "precision": 8,
  "floor": 3,
  "apartment": "02"
}
```

**Response (Error):**
```json
{
  "error": "Invalid check digit - PAC code may be corrupted"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/v1/pac/decode \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"pacCode": "STQ4-S3X1-7 / F3-A02"}'
```

---

#### POST /v1/pac/validate
Validate a PAC code without decoding.

**Request:**
```json
{
  "pacCode": "STQ4-S3X1-7"
}
```

**Parameters:**
- `pacCode` (required): The PAC code to validate

**Response (Valid):**
```json
{
  "isValid": true,
  "precision": 8,
  "reason": null
}
```

**Response (Invalid):**
```json
{
  "isValid": false,
  "precision": null,
  "reason": "Invalid check digit"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/v1/pac/validate \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"pacCode": "STQ4-S3X1-7"}'
```

---

#### POST /v1/pac/normalize
Normalize a PAC code to canonical format.

**Request:**
```json
{
  "pacCode": "stq4 s3x1 7 / f3-a02"
}
```

**Parameters:**
- `pacCode` (required): The PAC code to normalize

**Response:**
```json
{
  "normalizedPacCode": "STQ4-S3X1-7 / F3-A02"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/v1/pac/normalize \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"pacCode": "stq4 s3x1 7 / f3-a02"}'
```

---

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (missing API key) |
| 403 | Forbidden (invalid API key) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

## Error Response Format

```json
{
  "error": "Error message here",
  "details": "Optional additional details"
}
```

## Security Headers

### Required Request Headers
```
X-API-Key: your-api-key
Content-Type: application/json
```

### Recommended Request Headers
```
User-Agent: YourApp/1.0
Accept: application/json
```

### Response Headers
```
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## CORS

The API supports CORS for the following origins (configurable):
- `http://localhost:5173`
- `http://localhost:3000`
- `https://yourdomain.com`

## Best Practices

### 1. Use SDK When Possible
For better performance and offline support, use the client-side SDK instead of the API:

```typescript
// ✅ Good: Client-side SDK (no API call)
import { encode } from '@pac/core';
const pac = encode({ latitude: 31.2357, longitude: 30.0444 });

// ❌ Avoid: API call for simple encoding
fetch('/v1/pac/encode', { ... });
```

### 2. Cache Results
PAC codes for the same coordinates are always identical. Cache them:

```typescript
const cache = new Map();
const key = `${lat},${lng},${precision}`;
if (cache.has(key)) {
  return cache.get(key);
}
const pac = encode({ latitude: lat, longitude: lng, precision });
cache.set(key, pac);
```

### 3. Validate Before Decode
Always validate before decoding to avoid unnecessary processing:

```typescript
// ✅ Good
const validation = validate(pacCode);
if (validation.isValid) {
  const result = decode(pacCode);
}

// ❌ Avoid
const result = decode(pacCode);
if (result.isValid) { ... }
```

### 4. Handle Rate Limits
Implement exponential backoff:

```typescript
async function callAPI(retries = 3) {
  try {
    return await fetch('/v1/pac/encode', { ... });
  } catch (error) {
    if (error.status === 429 && retries > 0) {
      await sleep(Math.pow(2, 3 - retries) * 1000);
      return callAPI(retries - 1);
    }
    throw error;
  }
}
```

### 5. Don't Send Bulk Requests
The API is designed for individual requests. For bulk operations, use the SDK:

```typescript
// ✅ Good: Bulk encoding with SDK
const results = coordinates.map(coord => 
  encode({ latitude: coord.lat, longitude: coord.lng })
);

// ❌ Avoid: Bulk API requests
const results = await Promise.all(
  coordinates.map(coord => 
    fetch('/v1/pac/encode', { body: JSON.stringify(coord) })
  )
);
```

## OpenAPI Specification

The full OpenAPI 3.0 specification is available at:
```
http://localhost:5000/swagger/v1/swagger.json
```

Interactive documentation:
```
http://localhost:5000/swagger
```

## Privacy & Logging

### What is NOT logged:
- ❌ PAC codes
- ❌ Coordinates (latitude/longitude)
- ❌ Request payloads
- ❌ Response data

### What IS logged:
- ✅ Request timestamps
- ✅ IP addresses (for rate limiting)
- ✅ Endpoint paths
- ✅ HTTP status codes
- ✅ Error messages (without sensitive data)

## Support

For API issues or questions:

[GitHub]https://github.com/Mohamedocx) • [LinkedIn](https://www.linkedin.com/in/mohamed-ahmed-yousif/)
