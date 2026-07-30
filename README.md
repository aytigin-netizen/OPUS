# OPUS

**Öğretmen Pedagojik İşletim Sistemi**

OPUS; farklı ders alanlarının aynı kimlik, veri, analitik, yapay zekâ, doküman, doğrulama ve kullanıcı arayüzü altyapısını paylaşmasını sağlayan modüler bir pedagojik işletim sistemi girişimidir.

## Temel yaklaşım

- Curriculum First
- Learning Outcomes First
- Decision Before Generation
- Pedagogy Before Content
- Validation Before Delivery
- Single Source of Truth
- Modular Product Architecture

## Planlanan modüller

- **FOPOS:** Felsefe
- **PSYOPOS:** Psikoloji
- **LOGOPOS:** Mantık
- **SOSOPOS:** Sosyoloji (ileriki aşama)

## Depo yapısı

```text
OPUS/
├── apps/
├── packages/
└── docs/
```

- `apps/`: OPUS üzerinde çalışan branş uygulamaları.
- `packages/`: Ortak çekirdek yetenekleri.
- `docs/`: Vizyon, mimari, modül sözleşmesi ve yol haritası.

## Ortak üretim paketleri

- [`@opus/curriculum`](packages/curriculum/README.md): Müfredat şeması, kaynak izlenebilirliği ve veri bütünlüğü.
- [`@opus/core`](packages/core/README.md): Module Contract, Module Loader, registry, yaşam döngüsü ve sağlık izolasyonu.

### Geliştirme komutları

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm test
```

Node.js 24 ve `packageManager` alanında belirtilen pnpm sürümü kullanılır. Kilit dosyası depoya dahil edilir ve CI üzerinde dondurulmuş biçimde kurulur.

## Mimari belgeler

- [OPUS Vizyonu](docs/OPUS_Vision.md)
- [OPUS Mimarisi](docs/OPUS_Architecture.md)
- [Modül Sözleşmesi](docs/Module_Contract.md)
- [Curriculum Engine](docs/Curriculum_Engine.md)
- [Module Loader](docs/Module_Loader.md)
- [Yol Haritası](docs/Roadmap.md)

## Mevcut FOPOS

Çalışan FOPOS ürünü kendi deposunda korunur. OPUS, mevcut FOPOS deposunun üzerine kurulmaz; FOPOS’un OPUS’a taşınması ayrı ve kontrollü bir sprintte yürütülür.

## Lisans

Bu proje [MIT License](LICENSE) ile lisanslanmıştır.
