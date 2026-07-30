# OPUS Vizyonu

## Amaç

OPUS (Öğretmen Pedagojik İşletim Sistemi), öğretmenin yıl boyunca kullandığı pedagojik süreçleri ortak ve modüler bir altyapıda yönetmeyi amaçlar. Sistem, tek bir branşa bağlı uygulama yerine farklı branş modüllerinin aynı çekirdek hizmetleri güvenle paylaşabileceği bir platform olarak tasarlanır.

## Problem

Branş uygulamalarının birbirinden bağımsız geliştirilmesi; kimlik, kullanıcı, veri, analitik, yapay zekâ, doküman üretimi ve doğrulama yeteneklerinin tekrar edilmesine yol açar. Bu tekrar, bakım maliyetini yükseltir ve veri tutarlılığını zayıflatır.

## Çözüm

OPUS iki açık katmandan oluşur:

1. **OPUS Core:** Branştan bağımsız ortak hizmetler ve sözleşmeler.
2. **Branş modülleri:** Müfredat içeriği, alan bilgisi ve branşa özgü pedagojik kurallar.

İlk branş modülü FOPOS’tur. PSYOPOS ve LOGOPOS bunu izleyecek, SOSOPOS ise daha sonraki aşamada eklenecektir.

## Ürün ilkeleri

- **Curriculum First:** Üretim ve karar süreçleri geçerli müfredattan başlar.
- **Learning Outcomes First:** Öğrenme çıktıları tasarımın temel birimidir.
- **Decision Before Generation:** Sistem içerik üretmeden önce pedagojik kararı belirler.
- **Pedagogy Before Content:** İçerik, pedagojik amaca hizmet eder.
- **Validation Before Delivery:** Çıktılar kullanıcıya sunulmadan önce doğrulanır.
- **Single Source of Truth:** Aynı kavram için tek yetkili veri kaynağı kullanılır.
- **Modular Product Architecture:** Yeni branş, Core’u kopyalamadan bir modül olarak eklenir.

## Başarı ölçütleri

- Yeni bir branş, tanımlı Module Contract uygulanarak eklenebilir.
- Ortak yetenekler branş modüllerinde tekrar edilmez.
- Branş verileri ve kuralları Core’a sızmaz.
- Müfredat, değerlendirme, doküman ve rapor çıktıları izlenebilir kaynaklara dayanır.
- Mevcut FOPOS verileri kontrollü ve geriye uyumlu biçimde taşınabilir.

## Kapsam dışı

Sprint 0; çalışan uygulama, üretim kodu, veri göçü veya FOPOS entegrasyonu içermez. Bu sprintin amacı kararları görünür, sınanabilir ve uygulanabilir hale getirmektir.
