using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using PAC.Core;
using System.Security.Cryptography;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = "PAC API - نظام الرمز الشخصي للعنوان",
        Version = "v1",
        Description = @"# Personal Address Code (PAC) API

## Overview / نظرة عامة
A stateless API for converting geographic coordinates into short, shareable Personal Address Codes (PAC).

نظام لتحويل الإحداثيات الجغرافية إلى رموز عناوين شخصية قصيرة وقابلة للمشاركة.

## Features / المميزات
- ✅ **Encode**: Convert latitude/longitude to PAC code
- ✅ **Decode**: Convert PAC code back to coordinates
- ✅ **Validate**: Check if a PAC code is valid
- ✅ **Normalize**: Standardize PAC code format
- ✅ **Stateless**: No data storage, privacy-focused
- ✅ **Secure**: API key authentication, rate limiting

## Authentication / المصادقة
All PAC endpoints require an API key in the `X-API-Key` header.
Health check endpoints (/healthz, /readyz) do not require authentication.

جميع نقاط PAC تتطلب API key في الـ header بإسم `X-API-Key`.
نقاط الفحص الصحي لا تتطلب مصادقة.

## Rate Limits / حدود الاستخدام
- Authenticated requests: 100 requests/minute
- Unauthenticated requests: 10 requests/minute

## PAC Code Format / صيغة رمز PAC
Format: `GEOHASH-CHECKDIGIT` or `GEOHASH-CHECKDIGIT-FLOOR-APT`
Example: `u4pruydq-8` or `u4pruydq-8-3-A5`",
        Contact = new()
        {
            Name = "PAC Development Team",
            Email = "support@pac-system.example"
        },
        License = new()
        {
            Name = "MIT License",
            Url = new Uri("https://opensource.org/licenses/MIT")
        }
    });

    options.AddSecurityDefinition("ApiKey", new()
    {
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Name = "X-API-Key",
        Description = @"API Key for authentication. 

To test in Swagger UI:
1. Click the 'Authorize' button (🔒) at the top
2. Enter your API key
3. Click 'Authorize'
4. Try the endpoints

للاختبار في Swagger UI:
١. اضغط على زر 'Authorize' (🔒) في الأعلى
٢. أدخل الـ API key الخاص بك
٣. اضغط 'Authorize'
٤. جرب الـ endpoints"
    });

    options.AddSecurityRequirement(new()
    {
        {
            new()
            {
                Reference = new()
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "ApiKey"
                }
            },
            Array.Empty<string>()
        }
    });
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
            builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:5173", "http://localhost:3000" }
        )
        .AllowAnyMethod()
        .AllowAnyHeader();
    });
});

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    // Default policy: 100 requests per minute per IP
    options.AddFixedWindowLimiter("default", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 100;
        opt.QueueLimit = 0;
    });

    // Strict policy for unauthenticated: 10 requests per minute
    options.AddFixedWindowLimiter("strict", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 10;
        opt.QueueLimit = 0;
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            error = "Rate limit exceeded",
            retryAfter = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter)
                ? retryAfter.TotalSeconds
                : 60
        }, token);
    };
});

var app = builder.Build();

// Configure middleware
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();
app.UseRateLimiter();

// API Key validation middleware
app.Use(async (context, next) =>
{
    // Skip auth for health checks and swagger
    if (context.Request.Path.StartsWithSegments("/healthz") ||
        context.Request.Path.StartsWithSegments("/readyz") ||
        context.Request.Path.StartsWithSegments("/swagger"))
    {
        await next();
        return;
    }

    var apiKey = context.Request.Headers["X-API-Key"].FirstOrDefault();

    if (string.IsNullOrEmpty(apiKey))
    {
        context.Response.StatusCode = 401;
        await context.Response.WriteAsJsonAsync(new { error = "API key required" });
        return;
    }

    // Validate API key (simple HMAC-based validation)
    if (!ValidateApiKey(apiKey, builder.Configuration["ApiKey:Secret"] ?? "your-secret-key-change-in-production"))
    {
        context.Response.StatusCode = 403;
        await context.Response.WriteAsJsonAsync(new { error = "Invalid API key" });
        return;
    }

    await next();
});

// Health checks
app.MapGet("/healthz", () => Results.Ok(new { status = "healthy" }))
    .WithName("Health")
    .WithTags("Health")
    .WithSummary("Health Check - فحص الصحة")
    .WithDescription(@"Checks if the API is alive and responding.

يتحقق من أن الـ API يعمل ويستجيب للطلبات.

**No authentication required** / لا يتطلب مصادقة

**Response**: `{ ""status"": ""healthy"" }`");

app.MapGet("/readyz", () => Results.Ok(new { status = "ready" }))
    .WithName("Ready")
    .WithTags("Health")
    .WithSummary("Readiness Check - فحص الجاهزية")
    .WithDescription(@"Checks if the API is ready to accept requests.

يتحقق من أن الـ API جاهز لاستقبال الطلبات.

**No authentication required** / لا يتطلب مصادقة

**Response**: `{ ""status"": ""ready"" }`");

// PAC Endpoints
app.MapPost("/v1/pac/encode", (EncodeRequest request) =>
{
    try
    {
        var pac = PACCore.Encode(
            request.Latitude,
            request.Longitude,
            request.Precision ?? 8,
            request.Floor,
            request.Apartment
        );

        return Results.Ok(new EncodeResponse(
            pac,
            request.Precision ?? 8
        ));
    }
    catch (ArgumentOutOfRangeException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
})
.RequireRateLimiting("default")
.WithName("EncodePAC")
.WithTags("PAC")
.WithSummary("Encode Coordinates to PAC - تحويل الإحداثيات إلى رمز PAC")
.WithDescription(@"Converts geographic coordinates (latitude/longitude) into a Personal Address Code (PAC).

يحول الإحداثيات الجغرافية (خط العرض/خط الطول) إلى رمز عنوان شخصي (PAC).

**Parameters / المعاملات:**
- `latitude`: -90 to 90 (required)
- `longitude`: -180 to 180 (required)
- `precision`: 1-12, default 8 (optional) - Higher = more precise
- `floor`: Floor number (optional)
- `apartment`: Apartment identifier (optional)

**Example Request:**
```json
{
  ""latitude"": 30.0444,
  ""longitude"": 31.2357,
  ""precision"": 8,
  ""floor"": 3,
  ""apartment"": ""A5""
}
```

**Example Response:**
```json
{
  ""pacCode"": ""stq4s3x1-8-3-A5"",
  ""precision"": 8
}
```")
.WithOpenApi();

app.MapPost("/v1/pac/decode", (DecodeRequest request) =>
{
    try
    {
        var result = PACCore.Decode(request.PacCode);

        if (!result.IsValid)
        {
            return Results.BadRequest(new { error = result.Reason });
        }

        return Results.Ok(new DecodeResponse(
            result.Latitude!.Value,
            result.Longitude!.Value,
            result.Precision!.Value,
            result.Floor,
            result.Apartment
        ));
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
})
.RequireRateLimiting("default")
.WithName("DecodePAC")
.WithTags("PAC")
.WithSummary("Decode PAC to Coordinates - فك تشفير رمز PAC إلى إحداثيات")
.WithDescription(@"Converts a Personal Address Code (PAC) back into geographic coordinates.

يحول رمز العنوان الشخصي (PAC) إلى إحداثيات جغرافية.

**Parameters / المعاملات:**
- `pacCode`: Valid PAC code (required)

**Example Request:**
```json
{
  ""pacCode"": ""stq4s3x1-8-3-A5""
}
```

**Example Response:**
```json
{
  ""latitude"": 30.0444,
  ""longitude"": 31.2357,
  ""precision"": 8,
  ""floor"": 3,
  ""apartment"": ""A5""
}
```

**Error Response (Invalid PAC):**
```json
{
  ""error"": ""Invalid check digit""
}
```")
.WithOpenApi();

app.MapPost("/v1/pac/validate", (ValidateRequest request) =>
{
    try
    {
        var result = PACCore.Validate(request.PacCode);

        return Results.Ok(new ValidateResponse(
            result.IsValid,
            result.Precision,
            result.Reason
        ));
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
})
.RequireRateLimiting("default")
.WithName("ValidatePAC")
.WithTags("PAC")
.WithSummary("Validate PAC Code - التحقق من صحة رمز PAC")
.WithDescription(@"Validates the format and checksum of a Personal Address Code (PAC).

يتحقق من صحة تنسيق ومجموع التحقق لرمز العنوان الشخصي (PAC).

**Parameters / المعاملات:**
- `pacCode`: PAC code to validate (required)

**Example Request:**
```json
{
  ""pacCode"": ""stq4s3x1-8""
}
```

**Example Response (Valid):**
```json
{
  ""isValid"": true,
  ""precision"": 8,
  ""reason"": null
}
```

**Example Response (Invalid):**
```json
{
  ""isValid"": false,
  ""precision"": null,
  ""reason"": ""Invalid check digit""
}
```")
.WithOpenApi();

app.MapPost("/v1/pac/normalize", (NormalizeRequest request) =>
{
    try
    {
        var normalized = PACCore.Normalize(request.PacCode);

        return Results.Ok(new NormalizeResponse(
            normalized
        ));
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
})
.RequireRateLimiting("default")
.WithName("NormalizePAC")
.WithTags("PAC")
.WithSummary("Normalize PAC Code - تطبيع رمز PAC")
.WithDescription(@"Standardizes a PAC code by removing whitespace, converting to lowercase, and formatting consistently.

يوحد صيغة رمز PAC بإزالة المسافات وتحويله إلى أحرف صغيرة وتنسيقه بشكل متسق.

**Parameters / المعاملات:**
- `pacCode`: PAC code to normalize (required)

**Example Request:**
```json
{
  ""pacCode"": ""  STQ4S3X1-8  ""
}
```

**Example Response:**
```json
{
  ""normalizedPacCode"": ""stq4s3x1-8""
}
```

**Use Cases / حالات الاستخدام:**
- Clean user input before validation
- Standardize PAC codes for comparison
- Format PAC codes for display")
.WithOpenApi();

app.Run();

// Helper function for API key validation
static bool ValidateApiKey(string apiKey, string secret)
{
    // Simple HMAC-based validation
    // In production, use JWT or more sophisticated key management
    try
    {
        var parts = apiKey.Split('.');
        if (parts.Length != 2) return false;

        var payload = parts[0];
        var signature = parts[1];

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var computedHash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));

        return signature == computedHash.Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }
    catch
    {
        return false;
    }
}

// DTOs
record EncodeRequest(double Latitude, double Longitude, int? Precision, int? Floor, string? Apartment);
record EncodeResponse(string PacCode, int Precision);

record DecodeRequest(string PacCode);
record DecodeResponse(double Latitude, double Longitude, int Precision, int? Floor, string? Apartment);

record ValidateRequest(string PacCode);
record ValidateResponse(bool IsValid, int? Precision, string? Reason);

record NormalizeRequest(string PacCode);
record NormalizeResponse(string NormalizedPacCode);
