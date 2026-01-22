# PAC (Personal Address Code) System

<div align="center">

![PAC Logo](https://i.ibb.co/SwvbvP2X/Whats-App-Image-2026-01-21-at-4-05-42-PM.jpg)

**نظام عنونة شخصي آمن وخاص**

[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4)](https://dotnet.microsoft.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC)](https://tailwindcss.com/)

[التوثيق](./docs/README.md) • [API Docs](./docs/API.md) • [أمثلة](./examples/) • [Test Vectors](./docs/test-vectors.md)

</div>

---

## 🎯 ما هو PAC؟

**PAC (Personal Address Code)** هو نظام يحول الموقع الجغرافي إلى عنوان نصي قصير قابل للمشاركة، مثل:

```
31.2357, 30.0444  →  STQ4-S3X1-7
```

أو للشقق:
```
31.2357, 30.0444, Floor 3, Apt 02  →  STQ4-S3X1-7 / F3-A02
```

## ✨ المميزات

- 🔒 **آمن تماماً**: لا قاعدة بيانات، لا تسجيل، لا تخزين للمواقع
- 🚀 **سريع**: يعمل محلياً بدون إنترنت
- 🎯 **دقيق**: دقة تصل إلى 2.4 متر
- 🛡️ **محمي**: Check digit للكشف عن الأخطاء
- 🌍 **عالمي**: يعمل في أي مكان في العالم
- 📱 **قابل للدمج**: SDK لـ .NET و TypeScript/JavaScript

## 🚀 البدء السريع

### 1. استخدام الواجهة الويب

```bash
cd src/PAC.Web
npm install
npm run dev
```

افتح المتصفح على `http://localhost:5173`

### 2. استخدام SDK (C#)

```csharp
using PAC.Core;

// توليد عنوان
string pac = PACCore.Encode(31.2357, 30.0444, 8);
Console.WriteLine(pac); // STQ4-S3X1-7

// فك عنوان
var result = PACCore.Decode("STQ4-S3X1-7");
Console.WriteLine($"{result.Latitude}, {result.Longitude}");
```

### 3. استخدام SDK (TypeScript)

```typescript
import { encode, decode } from '@pac/core';

// توليد عنوان
const pac = encode({ latitude: 31.2357, longitude: 30.0444 });
console.log(pac); // STQ4-S3X1-7

// فك عنوان
const result = decode("STQ4-S3X1-7");
console.log(result.latitude, result.longitude);
```

### 4. استخدام API

```bash
# تشغيل API
cd src/PAC.API
dotnet run

# استخدام API
curl -X POST http://localhost:5000/v1/pac/encode \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 31.2357, "longitude": 30.0444}'
```

## 📁 هيكل المشروع

```
PAC/
├── src/
│   ├── PAC.Core/           # مكتبة C# الأساسية
│   ├── PAC.Core.JS/        # SDK TypeScript/JavaScript
│   ├── PAC.API/            # .NET 8 Minimal API
│   ├── PAC.Web/            # واجهة React + Tailwind v4
│   └── PAC.Tests/          # اختبارات الوحدة
├── docs/                   # التوثيق الشامل
│   ├── README.md           # نظرة عامة
│   ├── API.md              # توثيق API
│   ├── test-vectors.md     # Test vectors
│   └── SECURITY.md         # سياسة الأمان
├── docker/                 # ملفات Docker
└── examples/              # أمثلة التكامل
```

## 🔧 التثبيت

### المتطلبات

- .NET 8 SDK
- Node.js 20+
- npm أو yarn

### تثبيت المكتبات

#### C# Library
```bash
cd src/PAC.Core
dotnet build
dotnet pack
```

#### TypeScript SDK
```bash
cd src/PAC.Core.JS
npm install
npm run build
```

#### API
```bash
cd src/PAC.API
dotnet restore
dotnet run
```

#### Web UI
```bash
cd src/PAC.Web
npm install
npm run dev
```

## 🧪 الاختبارات

### C# Tests
```bash
cd src/PAC.Tests
dotnet test
```

### TypeScript Tests
```bash
cd src/PAC.Core.JS
npm test
```

## 📖 التوثيق

- [📘 نظرة عامة](./docs/README.md) - مقدمة شاملة عن PAC
- [🔌 API Documentation](./docs/API.md) - توثيق كامل للـ API
- [🧪 Test Vectors](./docs/test-vectors.md) - اختبارات التوافق
- [🔒 Security](./docs/SECURITY.md) - سياسة الأمان
- [🚀 Deployment](./docs/DEPLOYMENT.md) - دليل النشر

## 🔒 الأمان

### ما يتم تخزينه
- ✅ مفاتيح API فقط (للمصادقة)
- ❌ **لا يتم تخزين**: عناوين، مواقع، إحداثيات

### ما يتم تسجيله
- ✅ طلبات API (timestamps, endpoints)
- ❌ **لا يتم تسجيل**: PAC codes، إحداثيات، payloads

### الحماية
- 🔑 API Key authentication
- 🚦 Rate limiting (100 req/min)
- 🤖 Anti-bot protection
- 🔒 HTTPS only
- 🛡️ CORS whitelist

## 🎨 لقطات الشاشة

### شاشة التوليد
![Encode Screen](https://i.ibb.co/tT1HMx6y/screencapture-localhost-5173-2026-01-21-16-09-29.png)

### شاشة فك التشفير
![Decode Screen](https://i.ibb.co/1GH4XZkX/screencapture-localhost-5173-2026-01-21-16-11-51.png)

## 🌟 حالات الاستخدام

1. **التوصيل والشحن**: مشاركة عنوان دقيق مع السائق
2. **الطوارئ**: تحديد موقع سريع للإسعاف/الشرطة
3. **العقارات**: عرض مواقع العقارات بدقة
4. **السياحة**: مشاركة مواقع الأماكن السياحية
5. **الأعمال**: عنوان قصير للشركات والمحلات

## 🤝 المساهمة

نرحب بالمساهمات! يرجى قراءة [دليل المساهمة](./CONTRIBUTING.md) أولاً.

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](./LICENSE) - مفتوح المصدر ومجاني للاستخدام التجاري.

## 🙏 شكر خاص

- [Geohash](https://en.wikipedia.org/wiki/Geohash) - خوارزمية التشفير الجغرافي
- [Luhn Algorithm](https://en.wikipedia.org/wiki/Luhn_algorithm) - خوارزمية Check Digit
- [OpenStreetMap](https://www.openstreetmap.org/) - خرائط مفتوحة المصدر
- [Leaflet](https://leafletjs.com/) - مكتبة الخرائط

## 📞 الدعم

- 📧 Email: moahmedyousif28@gmail.com
- 📖 Docs: [Documentation](./docs/)

---

<div align="center">

**صُنع بـ ❤️ للمطورين السوانيين و العرب**

[⭐ Star on GitHub]https://github.com/Mohamedocx) • [🐦 Follow on LinkedIn](https://www.linkedin.com/in/mohamed-ahmed-yousif/)

</div>
