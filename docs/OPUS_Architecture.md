# OPUS Mimarisi

## Mimari model

OPUS, modüler monorepo olarak tasarlanır. Uygulamalar `apps/` altında, ortak yetenekler `packages/` altında yer alır.

```text
OPUS/
├── apps/
│   ├── fopos/
│   ├── psyopos/
│   └── logopos/
├── packages/
│   ├── core/
│   ├── curriculum/
│   ├── ai/
│   ├── analytics/
│   ├── documents/
│   ├── validation/
│   ├── ui/
│   └── shared/
└── docs/
```

Klasörler ilgili sprint başlamadan üretim koduyla doldurulmaz. Sprint 0 yalnızca sınırları ve sözleşmeleri tanımlar.

## Sorumluluk dağılımı

| Paket | Ortak sorumluluk |
|---|---|
| `core` | Kimlik, kullanıcı, öğretmen, branş, yetkilendirme ve temel orkestrasyon |
| `curriculum` | Müfredat şemaları, sürümleme, ünite ve öğrenme çıktısı sözleşmeleri |
| `ai` | Model sağlayıcı soyutlamaları, güvenlik sınırları ve ortak AI iş akışları |
| `analytics` | Ortak ölçüm, toplulaştırma ve analitik sözleşmeleri |
| `documents` | Belge şablonu, üretim ve dışa aktarma altyapısı |
| `validation` | Şema, veri bütünlüğü ve çıktı doğrulama kuralları |
| `ui` | Ortak tasarım sistemi ve erişilebilir arayüz bileşenleri |
| `shared` | Branştan bağımsız tipler ve yardımcı sözleşmeler |

## Core’un sağladığı yetenekler

- Kimlik doğrulama ve yetkilendirme
- Kullanıcı ve öğretmen yönetimi
- Branş atama modeli
- Müfredat ve öğrenme çıktısı altyapısı
- Öğrenci verisi için ortak model
- Analitik altyapısı
- AI servis soyutlamaları
- Doküman üretimi
- Ortak UI
- Doğrulama ve izlenebilirlik

## Kesin mimari sınır

Core şunları içermez:

- Felsefe, psikoloji, mantık veya sosyoloji alan bilgisi
- Branşa özel müfredat kayıtları
- Branşa özel öğretim stratejileri
- Belirli bir branşa ait AI kuralları
- Belirli bir branşa ait değerlendirme veya rapor tanımları

Bu içerikler ilgili branş modülünün sorumluluğundadır.

## Bağımlılık yönü

- Branş uygulamaları Core paketlerini kullanabilir.
- Branş modülleri ortak sözleşmeleri uygulayabilir.
- Core, belirli bir branş modülünü doğrudan içe aktaramaz.
- Modüller arası doğrudan bağımlılık kurulmaz.
- Modül keşfi Module Loader üzerinden yapılır.

## Veri sahipliği

Ortak kimlikler, kullanıcı hesapları, öğretmen atamaları ve sistem düzeyi referanslar Core’a aittir. Branşa özgü müfredat içeriği ve pedagojik kurallar modüle aittir. Modüller Core verisine yalnızca yayımlanmış sözleşmeler üzerinden erişir.

## Geçiş yaklaşımı

Mevcut FOPOS deposu çalışan ürün ve bakım hattı olarak korunur. OPUS Core hazır olmadan FOPOS kodu taşınmaz. Taşıma; envanter, eşleme, uyumluluk katmanı, veri göçü, karşılaştırmalı doğrulama ve kontrollü geçiş adımlarını içeren ayrı bir sprinttir.

## Mimari karar ilkesi

Yeni bir yetenek birden fazla branş tarafından aynı biçimde kullanılabiliyorsa Core adayıdır. Alan bilgisi veya branşa özgü pedagojik karar içeriyorsa modülde kalır.
