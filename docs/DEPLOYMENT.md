# PAC Deployment Guide

## Overview

This guide covers deploying the PAC system in various environments.

## Prerequisites

- .NET 8 SDK
- Node.js 20+
- Docker (optional)
- Reverse proxy (Nginx/Caddy) for production

## Local Development

### 1. Run API Locally

```bash
cd src/PAC.API
dotnet restore
dotnet run
```

API will be available at: `http://localhost:5000`

Swagger UI: `http://localhost:5000/swagger`

### 2. Run Web UI Locally

```bash
cd src/PAC.Web
npm install
npm run dev
```

Web UI will be available at: `http://localhost:5173`

### 3. Run Tests

```bash
# C# Tests
cd src/PAC.Tests
dotnet test

# TypeScript Tests (if configured)
cd src/PAC.Core.JS
npm test
```

## Production Deployment

### Option 1: Docker Compose (Recommended)

```bash
# Build and run
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop
docker-compose -f docker/docker-compose.yml down
```

Services:
- API: `http://localhost:5000`
- Web: `http://localhost:5173`

### Option 2: Manual Deployment

#### API Deployment

```bash
# Build
cd src/PAC.API
dotnet publish -c Release -o ./publish

# Run
cd publish
dotnet PAC.API.dll
```

#### Web UI Deployment

```bash
# Build
cd src/PAC.Web
npm run build

# Serve (using any static file server)
npx serve -s dist -p 5173
```

### Option 3: Cloud Deployment

#### Azure App Service

```bash
# Login
az login

# Create resource group
az group create --name pac-rg --location eastus

# Create App Service plan
az appservice plan create --name pac-plan --resource-group pac-rg --sku B1

# Create API app
az webapp create --name pac-api --resource-group pac-rg --plan pac-plan --runtime "DOTNET|8.0"

# Deploy API
cd src/PAC.API
az webapp up --name pac-api --resource-group pac-rg

# Create Web app (static)
az staticwebapp create --name pac-web --resource-group pac-rg --location eastus
```

#### AWS (Elastic Beanstalk)

```bash
# Install EB CLI
pip install awsebcli

# Initialize
cd src/PAC.API
eb init -p "64bit Amazon Linux 2023 v3.0.0 running .NET 8" pac-api

# Create environment
eb create pac-api-prod

# Deploy
eb deploy
```

#### Google Cloud Run

```bash
# Build container
cd src/PAC.API
gcloud builds submit --tag gcr.io/PROJECT_ID/pac-api

# Deploy
gcloud run deploy pac-api \
  --image gcr.io/PROJECT_ID/pac-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Environment Variables

### API Environment Variables

```bash
# Required
ASPNETCORE_ENVIRONMENT=Production
ApiKey__Secret=your-secret-key-here

# Optional
Cors__AllowedOrigins__0=https://yourdomain.com
Cors__AllowedOrigins__1=https://app.yourdomain.com
ASPNETCORE_URLS=http://+:5000
```

### Web UI Environment Variables

Create `.env.production`:

```bash
VITE_API_URL=https://api.yourdomain.com
VITE_API_KEY=your-api-key
```

## Reverse Proxy Configuration

### Nginx

```nginx
# API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Web UI
server {
    listen 80;
    server_name pac.yourdomain.com;

    root /var/www/pac-web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Caddy

```caddyfile
# API
api.yourdomain.com {
    reverse_proxy localhost:5000
}

# Web UI
pac.yourdomain.com {
    root * /var/www/pac-web/dist
    file_server
    try_files {path} /index.html
}
```

## SSL/TLS Configuration

### Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com -d pac.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Cloudflare

1. Add your domain to Cloudflare
2. Update DNS records:
   - `api.yourdomain.com` → Your server IP
   - `pac.yourdomain.com` → Your server IP
3. Enable "Full (strict)" SSL mode
4. Enable "Always Use HTTPS"

## Security Hardening

### 1. API Key Management

Generate secure API keys:

```bash
# Generate random secret
openssl rand -base64 32

# Create API key (example)
payload="user123"
secret="your-secret-from-above"
signature=$(echo -n "$payload" | openssl dgst -sha256 -hmac "$secret" -binary | base64 | tr '+/' '-_' | tr -d '=')
api_key="$payload.$signature"
echo $api_key
```

### 2. Rate Limiting (Nginx)

```nginx
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        location /v1/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://localhost:5000;
        }
    }
}
```

### 3. Firewall Rules

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Deny direct access to API port
sudo ufw deny 5000/tcp
```

### 4. HTTPS Headers

Add to Nginx:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## Monitoring

### Health Checks

```bash
# API health
curl http://localhost:5000/healthz

# Readiness
curl http://localhost:5000/readyz
```

### Logging

API logs location:
- Development: Console
- Production: `/var/log/pac-api/`

Configure in `appsettings.Production.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    },
    "File": {
      "Path": "/var/log/pac-api/log-.txt",
      "RollingInterval": "Day"
    }
  }
}
```

### Metrics (Optional)

Add Prometheus metrics:

```bash
dotnet add package prometheus-net.AspNetCore
```

```csharp
// In Program.cs
app.UseMetricServer();
app.UseHttpMetrics();
```

## Backup & Recovery

### Database Backup (API Keys only)

```bash
# PostgreSQL
pg_dump -U postgres pac_db > backup.sql

# Restore
psql -U postgres pac_db < backup.sql
```

### Configuration Backup

```bash
# Backup
tar -czf pac-config-$(date +%Y%m%d).tar.gz \
  src/PAC.API/appsettings.Production.json \
  docker/docker-compose.yml

# Restore
tar -xzf pac-config-YYYYMMDD.tar.gz
```

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Use Nginx/HAProxy
2. **Multiple API Instances**: Run multiple containers
3. **Shared API Key Store**: Use Redis/PostgreSQL

```yaml
# docker-compose.yml
services:
  pac-api-1:
    image: pac-api
    ports:
      - "5001:5000"
  
  pac-api-2:
    image: pac-api
    ports:
      - "5002:5000"
  
  nginx:
    image: nginx
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
```

### CDN for Web UI

Use Cloudflare/AWS CloudFront for static assets:

```bash
# Upload to S3
aws s3 sync src/PAC.Web/dist s3://pac-web-bucket

# Create CloudFront distribution
aws cloudfront create-distribution --origin-domain-name pac-web-bucket.s3.amazonaws.com
```

## Troubleshooting

### API won't start

```bash
# Check logs
docker logs pac-api

# Check port
netstat -tulpn | grep 5000

# Test locally
curl http://localhost:5000/healthz
```

### CORS errors

Check `appsettings.json`:

```json
{
  "Cors": {
    "AllowedOrigins": [
      "https://yourdomain.com"
    ]
  }
}
```

### Rate limit issues

Increase limits in `Program.cs`:

```csharp
opt.PermitLimit = 200; // Increase from 100
```

## Performance Optimization

### 1. Enable Response Compression

```csharp
builder.Services.AddResponseCompression();
app.UseResponseCompression();
```

### 2. Enable Response Caching

```csharp
builder.Services.AddResponseCaching();
app.UseResponseCaching();
```

### 3. Use CDN for Static Assets

```html
<!-- Use CDN for libraries -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css">
```

## Support

For deployment issues:
- 📧 Email: devops@pac.example.com
- 💬 Discord: [Join our community](https://discord.gg/pac)
- 📖 Docs: [Documentation](../docs/)

---

**Last Updated**: 2026-01-21  
**Version**: 1.0
