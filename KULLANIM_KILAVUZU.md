# Sales Press Brake Kullanım Kılavuzu

Bu belge, `Sales Press Brake` uygulamasının günlük kullanımını anlatır.

Kapsam:
- giriş yapma
- yönetim ekranlarının kullanımı
- öneri oluşturma
- teklif kaydetme, düzenleme, görüntüleme ve PDF alma
- yerel kurulum ve çalıştırma

## 1. Sistem Özeti

Uygulama iki ana bölümden oluşur:

- `frontend/`
  Vue 3 + Vite tabanlı kullanıcı arayüzü
- `backend/`
  Express + PostgreSQL tabanlı API

Sistemde iki temel kullanıcı tipi vardır:

- `admin`
  Yönetim ekranlarına erişir, kullanıcıları ve katalog verilerini yönetir, tüm teklifleri görebilir
- `user`
  Öneri oluşturur, kendi tekliflerini görür, kaydeder ve düzenler

## 2. Giriş

Giriş ekranında kullanıcı adı ve şifre ile oturum açılır.

Giriş sonrası yönlendirme:

- `admin` kullanıcıları: `/admin/users`
- normal kullanıcılar: `/app/recommendation`

Çıkış yapmak için sol menüdeki çıkış düğmesi kullanılır.

## 3. Yönetim Bölümü

Yönetim bölümü sadece `admin` kullanıcılar içindir.

Ekranlar:

- `Kullanıcılar`
- `Malzemeler`
- `Makineler`
- `Takımlar`
- `Opsiyonlar`

Her yönetim ekranında ortak kullanım mantığı vardır:

- solda oluşturma / düzenleme formu
- sağda mevcut kayıtlar listesi
- `kaydet`, `yenile`, `düzenle`, `sil` işlemleri

### 3.1 Kullanıcılar

Bu ekrandan:

- yeni kullanıcı oluşturulur
- kullanıcı rolü `user` veya `admin` olarak belirlenir
- yorum alanı girilir
- mevcut kullanıcı düzenlenir

Not:
- kullanıcı listesi sadece admin tarafından görüntülenebilir

### 3.2 Malzemeler

Bu ekranda malzeme teknik verileri tanımlanır:

- ad
- çekme dayanımı
- akma dayanımı
- `K` faktörü
- Young modülü
- önerilen `V-die` faktörü
- minimum ve maksimum kalınlık

Bu veriler öneri motoru tarafından kullanılır.

### 3.3 Makineler

Bu ekranda makine katalog verileri tanımlanır:

- model
- maksimum tonaj
- çalışma boyu
- maksimum kalınlık
- baz fiyat

Önerilen makineler, burada tanımlanan katalogdan seçilir.

### 3.4 Takımlar

Bu ekranda takım verileri tanımlanır:

- takım adı
- `V-die`
- punç yarıçapı
- kalıp yarıçapı

### 3.5 Opsiyonlar

Bu ekranda teklif opsiyonları tanımlanır:

- kod
- ad
- fiyat

Seçilen opsiyonlar teklif toplamına eklenir.

## 4. Öneri Ekranı

Normal kullanıcıların temel çalışma ekranıdır: `/app/recommendation`

Bu ekran üç bölümden oluşur:

### 4.1 Adım 1: Girdiler

Girilen alanlar:

- `Malzeme`
- `Kalınlık mm`
- `Büküm Boyu mm`
- `Notlar`

`Öneri Getir` düğmesi basıldığında sistem:

- uygun makineleri listeler
- uygun takımları listeler
- kullanılabilir opsiyonları getirir

### 4.2 Adım 2: Müşteri Bilgileri

Bu alanda teklif müşterisi girilir:

- firma
- yetkili
- adres
- telefon
- e-posta
- vergi dairesi

Not:
- teklif kaydı için en az şu alanlar zorunludur:
  - firma
  - adres
  - telefon
  - vergi dairesi

### 4.3 Adım 3: Teklif Özeti

Bu bölümde seçilen veriler özetlenir:

- malzeme
- takım
- seçilen opsiyon sayısı
- opsiyon toplamı
- müşteri bilgileri hazır mı
- teklif hazır mı

`Teklifi Kaydet` ile teklif oluşturulur.

## 5. Teklif Oluşturma Akışı

Tipik kullanım sırası:

1. Malzeme seçin.
2. Kalınlık ve büküm boyunu girin.
3. `Öneri Getir` düğmesine basın.
4. Uygun makineyi seçin.
5. Uygun takımı seçin.
6. Gerekliyse opsiyonları seçin.
7. Müşteri bilgilerini doldurun.
8. Not girilecekse ekleyin.
9. `Teklifi Kaydet` düğmesine basın.

Başarılı kayıt sonrası sistem teklif kodu üretir.

Örnek:

- `Q-20260506-1`

## 6. Teklifler Ekranı

Ekran yolu:

- `/app/quotes`

Bu ekranda kullanıcı:

- kayıtlı teklifleri listeler
- teklif detayını görüntüler
- PDF indirir
- teklifi düzenler

Admin kullanıcılar ayrıca:

- teklif silebilir
- tüm teklifleri görebilir

Normal kullanıcılar:

- yalnızca kendi tekliflerini görür

### 6.1 Teklif Görüntüleme

Liste ekranında görüntüleme düğmesi ile teklif detayları sağ panelde açılır.

Gösterilen bilgiler:

- teklif kodu
- müşteri
- malzeme
- kalınlık
- büküm boyu
- makine
- takım
- makine fiyatı
- opsiyon toplamı
- notlar
- seçilen opsiyonlar

### 6.2 Teklif Düzenleme

Liste ekranındaki düzenleme düğmesi ile teklif, öneri ekranında açılır.

Sistem otomatik olarak:

- müşteri bilgilerini doldurur
- malzeme verisini yükler
- teklif notlarını doldurur
- kayıtlı makine / takım / opsiyon seçimini geri getirir

Değişiklikten sonra tekrar kaydedildiğinde:

- yeni teklif oluşturulmaz
- mevcut teklif güncellenir

### 6.3 PDF Alma

PDF düğmesi ile teklifin PDF çıktısı alınır.

PDF içinde:

- firma üst bilgisi
- teklif bilgileri
- `DİKKATİNE` alanı
- teklif kalemleri
- genel toplam
- yazıyla tutar
- diğer şartlar

## 7. Yetki Kuralları

### Admin kullanıcı

Şunları yapabilir:

- kullanıcı yönetimi
- malzeme yönetimi
- makine yönetimi
- takım yönetimi
- opsiyon yönetimi
- tüm teklifleri görme
- teklif silme

### Normal kullanıcı

Şunları yapabilir:

- öneri oluşturma
- teklif oluşturma
- kendi tekliflerini görüntüleme
- kendi tekliflerini düzenleme
- kendi teklifleri için PDF alma

Yapamaz:

- kullanıcı listesi görme
- admin katalog ekranlarına erişme
- teklif silme

## 8. Yerel Kurulum

## 8.1 Gereksinimler

- Node.js `20+`
- PostgreSQL veritabanı

## 8.2 Backend ortam değişkenleri

`backend/.env` içinde en az şu alanlar olmalıdır:

```env
DATABASE_URL=postgresql://kullanici:sifre@host:5432/veritabani
JWT_SECRET=guclu-bir-gizli-anahtar
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

## 8.3 Frontend ortam değişkenleri

`frontend/.env` içinde:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 8.4 Backend başlatma

```bash
cd backend
npm install
npm run dev
```

veya

```bash
cd backend
npm install
npm start
```

Backend açılırken:

- quote şeması otomatik kontrol edilir
- gerekli quote kolonları oluşturulur

## 8.5 Frontend başlatma

```bash
cd frontend
npm install
npm run dev
```

## 9. Yardımcı Komutlar

Backend klasöründe:

```bash
npm run patch:quotes
```

Amaç:
- quote tablosunu güncellemek

```bash
npm run backfill:quote-owners -- <username>
```

Amaç:
- sahibi olmayan eski teklifleri bir kullanıcıya bağlamak

Örnek:

```bash
npm run backfill:quote-owners -- operator
```

## 10. Sık Karşılaşılan Durumlar

### 10.1 Teklif kaydı sırasında UUID hatası

Örnek hata:

- `invalid input syntax for type uuid`

Anlamı:
- eski verilerde sayısal id kalmış olabilir

Durum:
- sistem bu konu için sertleştirildi
- yine de backend yeniden başlatılmalıdır

### 10.2 Eski teklifler kullanıcıda görünmüyor

Sebep:
- eski kayıtlarda `owner_user_id` olmayabilir

Çözüm:
- backfill komutu ile ilgili kullanıcıya bağlanmalıdır

### 10.3 PDF görünümü beklenen gibi değil

Kontrol edilmesi gerekenler:

- müşteri bilgileri eksik mi
- adres tek satır mı girildi
- backend yeniden başlatıldı mı
- en son PDF düzenleri deploy edildi mi

## 11. Önerilen Kullanım Disiplini

- önce katalog verilerini admin olarak düzgün girin
- sonra öneri ekranında gerçek teklifler oluşturun
- müşteri bilgilerini eksiksiz girin
- teklif kaydetmeden önce makine ve takım seçimini kontrol edin
- PDF’yi indirmeden önce teklif detayını teklif listesinde açıp gözden geçirin

## 12. Dosya Referansları

Ana kullanım ekranları:

- [frontend/src/views/app/RecommendationView.vue](/Users/alitumay/Desktop/Sales_PressBrake/frontend/src/views/app/RecommendationView.vue)
- [frontend/src/views/app/QuotesView.vue](/Users/alitumay/Desktop/Sales_PressBrake/frontend/src/views/app/QuotesView.vue)

Yönetim ekranları:

- [frontend/src/views/admin/AdminUsersView.vue](/Users/alitumay/Desktop/Sales_PressBrake/frontend/src/views/admin/AdminUsersView.vue)
- [frontend/src/views/admin/AdminMaterialsView.vue](/Users/alitumay/Desktop/Sales_PressBrake/frontend/src/views/admin/AdminMaterialsView.vue)
- [frontend/src/views/admin/AdminMachinesView.vue](/Users/alitumay/Desktop/Sales_PressBrake/frontend/src/views/admin/AdminMachinesView.vue)
- [frontend/src/views/admin/AdminToolingView.vue](/Users/alitumay/Desktop/Sales_PressBrake/frontend/src/views/admin/AdminToolingView.vue)
- [frontend/src/views/admin/AdminOptionsView.vue](/Users/alitumay/Desktop/Sales_PressBrake/frontend/src/views/admin/AdminOptionsView.vue)

Backend ana bileşenleri:

- [backend/src/app.js](/Users/alitumay/Desktop/Sales_PressBrake/backend/src/app.js)
- [backend/src/services/quoteService.js](/Users/alitumay/Desktop/Sales_PressBrake/backend/src/services/quoteService.js)
- [backend/src/services/quotePdfService.js](/Users/alitumay/Desktop/Sales_PressBrake/backend/src/services/quotePdfService.js)
- [backend/src/db/ensureQuotesSchema.js](/Users/alitumay/Desktop/Sales_PressBrake/backend/src/db/ensureQuotesSchema.js)
