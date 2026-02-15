# PAC Quick Start Guide

## 🚀 البدء خلال 5 دقائق

### الخطوة 1: استنساخ المشروع

```bash
git clone https://github.com/yourusername/pac.git
cd pac
```

### الخطوة 2: تشغيل الاختبارات (اختياري)

```bash
cd src/PAC.Tests
dotnet test
```

**النتيجة المتوقعة**: ✅ 17/17 tests passed

### الخطوة 3: تشغيل الواجهة الأمامية

```bash
cd src/PAC.Web
npm install --legacy-peer-deps
npm run dev
```

> **ملاحظة**: نستخدم `--legacy-peer-deps` بسبب تعارض مؤقت بين Vite 7 و Tailwind CSS v4. التطبيق يعمل بشكل مثالي.

**افتح المتصفح**: http://localhost:5173

### الخطوة 4: جرّب النظام!

#### توليد عنوان PAC:
1. اضغط "استخدم موقعي" (أو أدخل إحداثيات يدوياً)
2. اختر: منزل أو شقة
3. إذا شقة: أدخل الطابق ورقم الشقة
4. اضغط "توليد عنوان PAC"
5. انسخ العنوان!

#### فك عنوان PAC:
1. الصق عنوان PAC
2. اضغط "فك العنوان"
3. شاهد الموقع على الخريطة!

---

## 💻 استخدام SDK في مشروعك

### C# (.NET)

```bash
# أضف المشروع
dotnet add reference path/to/PAC.Core/PAC.Core.csproj
```

```csharp
using PAC.Core;

// توليد عنوان
string pac = PACCore.Encode(31.2357, 30.0444, 8);
Console.WriteLine(pac); // مثال: "STQ4-S3X1-7"

// فك عنوان
var result = PACCore.Decode("STQ4-S3X1-7");
if (result.IsValid)
{
    Console.WriteLine($"Lat: {result.Latitude}, Lng: {result.Longitude}");
}
```

### TypeScript/JavaScript

```bash
# انسخ الملف
cp src/PAC.Core.JS/index.ts your-project/utils/pac.ts
```

```typescript
import { encode, decode } from './utils/pac';

// توليد عنوان
const pac = encode({ 
  latitude: 31.2357, 
  longitude: 30.0444 
});
console.log(pac); // مثال: "STQ4-S3X1-7"

// فك عنوان
const result = decode("STQ4-S3X1-7");
if (result.isValid) {
  console.log(`Lat: ${result.latitude}, Lng: ${result.longitude}`);
}
```

---

## 🔌 استخدام API (اختياري)

### تشغيل API

```bash
cd src/PAC.API
dotnet run
```

**API متاح على**: http://localhost:5000  
**Swagger UI**: http://localhost:5000/swagger

### استدعاء API

```bash
# توليد عنوان
curl -X POST http://localhost:5000/v1/pac/encode \
  -H "X-API-Key: test.key" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 31.2357, "longitude": 30.0444, "precision": 8}'

# فك عنوان
curl -X POST http://localhost:5000/v1/pac/decode \
  -H "X-API-Key: test.key" \
  -H "Content-Type: application/json" \
  -d '{"pacCode": "STQ4-S3X1-7"}'
```

---

## 🐳 استخدام Docker

```bash
# بناء وتشغيل
docker-compose -f docker/docker-compose.yml up -d

# عرض السجلات
docker-compose -f docker/docker-compose.yml logs -f

# إيقاف
docker-compose -f docker/docker-compose.yml down
```

**الخدمات**:
- API: http://localhost:5000
- Web: http://localhost:5173

---

## 📖 الخطوات التالية

1. **اقرأ التوثيق**: [docs/README.md](docs/README.md)
2. **جرّب الأمثلة**: [examples/DeliveryService.cs](examples/DeliveryService.cs)
3. **راجع المواصفات**: [docs/PAC-SPEC.md](docs/PAC-SPEC.md)
4. **تعلّم الأمان**: [docs/SECURITY.md](docs/SECURITY.md)

---

## ❓ أسئلة شائعة

### هل أحتاج API للاستخدام؟
**لا!** SDK يعمل 100% محلياً بدون إنترنت. API اختياري.

### هل يتم تخزين بياناتي؟
**لا!** النظام لا يخزن أي عناوين أو مواقع.

### ما الفرق بين Precision 8 و 9؟
- **Precision 8**: ~19m دقة (مناسب للمنازل)
- **Precision 9**: ~2.4m دقة (دقة عالية)

---

**استمتع باستخدام PAC! 🎉**
