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

## Sprint 0

Sprint 0 yalnızca mimari kararları ve depo iskeletini kapsar. Bu aşamada üretim kodu bulunmaz.

Ayrıntılar için:

- [OPUS Vizyonu](docs/OPUS_Vision.md)
- [OPUS Mimarisi](docs/OPUS_Architecture.md)
- [Modül Sözleşmesi](docs/Module_Contract.md)
- [Yol Haritası](docs/Roadmap.md)

## Mevcut FOPOS

Çalışan FOPOS ürünü kendi deposunda korunur. OPUS, mevcut FOPOS deposunun üzerine kurulmaz; FOPOS’un OPUS’a taşınması ayrı ve kontrollü bir sprintte yürütülür.

## Lisans

Bu proje [MIT License](LICENSE) ile lisanslanmıştır.
