# Pedagojik Karar ve Üretim Sınırı

## Amaç

Pedagojik Karar Servisi, branştan bağımsız bir Core sınırıdır. Bir ders planı,
ölçme aracı veya başka bir pedagojik ürün için üretim başlamadan önce isteğin
müfredat bağlamını doğrular, etkin branş modülünün kurallarını bağlar ve nihai
kararı öğretmen onayına sunar.

## Zorunlu akış

1. İstek; `moduleId`, `curriculumId`, `gradeLevelId`, `unitId` ve
   `outcomeCode` kimliklerini açıkça taşır.
2. Ünite ve öğrenme çıktısı `CurriculumService` üzerinden çözümlenir.
3. Etkin modülün `ai_rules` kuralları karara eklenir.
4. Karar gerekçesi ve doğrulama izi oluşturulur.
5. Karar `awaiting-teacher-approval` durumunda bekler.
6. Yalnızca aynı karara bağlı açık öğretmen onayı sonrasında
   `ready-for-generation` durumuna geçer.

Müfredat çözümlemesi başarısız olduğunda servis
`CURRICULUM_RESOLUTION_FAILED` hatasıyla durur ve alttaki
`CurriculumServiceError` kodunu korur. Bu durumda pedagojik karar veya üretim
çıktısı oluşturulmaz.

## Sorumluluk ayrımı

Core; doğrulama akışını, karar durumlarını, öğretmen onay kapısını, gerekçeyi ve
denetim izini tanımlar. Branşa özgü pedagojik kurallar Core içinde bulunmaz.
FOPOS adaptörü yalnızca `fopos` ve `philosophy-tr-2024` bağlamlarını bağlar;
felsefeye özgü kurallar FOPOS modülünün `ai_rules` alanından alınır.
