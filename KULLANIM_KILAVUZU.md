# ABKANT SATIŞ PROGRAMI KULLANIM KILAVUZU

## İÇİNDEKİLER

## 1. Genel Bakış

Bu kılavuz, `Sales Press Brake` uygulamasının günlük kullanımını anlatır.

Uygulama iki ana kullanım alanına sahiptir:

- `Yönetim Bölümü`
- `Teklif / Öneri Bölümü`

Sistemde iki temel kullanıcı tipi vardır:

- `Yönetici`
- `Kullanıcı`

### 1.1 Yönetici

Yönetici kullanıcılar şunları yapabilir:

- kullanıcıları yönetebilir
- malzemeleri yönetebilir
- makineleri yönetebilir
- takımları yönetebilir
- opsiyonları yönetebilir
- tüm teklifleri görüntüleyebilir
- teklif silebilir

### 1.2 Kullanıcı

Normal kullanıcılar şunları yapabilir:

- öneri oluşturabilir
- teklif oluşturabilir
- kendi tekliflerini görüntüleyebilir
- kendi tekliflerini düzenleyebilir
- kendi tekliflerinin PDF çıktısını alabilir

## 2. Sisteme Giriş

Giriş ekranında:

- kullanıcı adı girilir
- şifre girilir
- oturum açılır

Girişten sonra:

- yönetici kullanıcılar yönetim ekranına yönlendirilir
- normal kullanıcılar öneri ekranına yönlendirilir

Çıkış yapmak için sol menüdeki çıkış düğmesi kullanılır.

## 3. Yönetim Bölümü

Bu bölüm yalnızca yönetici kullanıcılar içindir.

Yönetim ekranları:

- `Kullanıcılar`
- `Malzemeler`
- `Makineler`
- `Takımlar`
- `Opsiyonlar`

Her ekranda genel yapı aynıdır:

- solda kayıt oluşturma veya düzenleme formu bulunur
- sağda mevcut kayıtların listesi bulunur

Ortak işlemler:

- yeni kayıt oluşturma
- mevcut kaydı düzenleme
- kayıtları yenileme
- kayıt silme

### 3.1 Kullanıcılar

Bu ekranda:

- yeni kullanıcı oluşturulur
- kullanıcı rolü belirlenir
- kullanıcı yorumları girilir
- mevcut kullanıcılar güncellenir

### 3.2 Malzemeler

Bu ekranda büküm hesaplamalarında kullanılacak malzeme verileri tanımlanır.

Girilen başlıca bilgiler:

- malzeme adı
- çekme dayanımı
- akma dayanımı
- K faktörü
- Young modülü
- önerilen V-kalıp faktörü
- minimum kalınlık
- maksimum kalınlık

### 3.3 Makineler

Bu ekranda makine katalog bilgileri tanımlanır.

Girilen başlıca bilgiler:

- model
- maksimum tonaj
- çalışma boyu
- maksimum kalınlık
- baz fiyat

### 3.4 Takımlar

Bu ekranda takım bilgileri tanımlanır.

Girilen başlıca bilgiler:

- takım adı
- V-kalıp değeri
- punç yarıçapı
- kalıp yarıçapı

### 3.5 Opsiyonlar

Bu ekranda teklifte kullanılacak ek opsiyonlar tanımlanır.

Girilen başlıca bilgiler:

- opsiyon kodu
- opsiyon adı
- fiyat

## 4. Öneri Ekranı

Öneri ekranı, teklif oluşturma sürecinin ana ekranıdır.

Bu ekran üç adımdan oluşur:

- `Adım 1: Girdiler`
- `Adım 2: Müşteri Bilgileri`
- `Adım 3: Teklif Özeti`

### 4.1 Adım 1: Girdiler

Bu bölümde şu bilgiler girilir:

- malzeme
- kalınlık
- büküm boyu
- notlar
- diğer şartlar

`Öneri Getir` düğmesine basıldığında sistem:

- uygun makineleri listeler
- uygun takımları listeler
- mevcut opsiyonları getirir

### 4.2 Adım 2: Müşteri Bilgileri

Bu bölümde müşteri bilgileri girilir:

- firma
- yetkili
- adres
- telefon
- e-posta
- vergi dairesi

Teklif kaydı için zorunlu alanlar:

- firma adı
- adres
- telefon
- vergi dairesi

### 4.3 Adım 3: Teklif Özeti

Bu bölümde seçilen teklifin özeti gösterilir.

Gösterilen bilgiler:

- malzeme
- takım
- seçilen opsiyon sayısı
- opsiyon toplamı
- müşteri bilgileri hazır mı
- teklif hazır mı

Bu bölümden `Teklifi Kaydet` işlemi yapılır.

## 5. Teklif Oluşturma

Tipik kullanım sırası aşağıdaki gibidir:

1. Malzeme seçin.
2. Kalınlık bilgisini girin.
3. Büküm boyunu girin.
4. Gerekirse not ekleyin.
5. Gerekirse `Diğer Şartlar` alanını doldurun.
6. `Öneri Getir` düğmesine basın.
7. Önerilen makinelerden uygun olanı seçin.
8. Önerilen takımlardan uygun olanı seçin.
9. Gerekli opsiyonları işaretleyin.
10. Müşteri bilgilerini doldurun.
11. `Teklifi Kaydet` düğmesine basın.

Başarılı kayıt sonrası sistem bir teklif kodu üretir.

Örnek:

- `Q-20260506-1`

## 6. Teklifler Ekranı

Bu ekran, kaydedilmiş teklifleri yönetmek için kullanılır.

Kullanıcı bu ekranda:

- teklif listesini görebilir
- teklif detayını açabilir
- teklifi düzenleyebilir
- PDF çıktısı alabilir

Yönetici kullanıcı ayrıca teklif silebilir.

### 6.1 Teklif Görüntüleme

Teklif listesindeki görüntüleme düğmesi ile teklif detayları açılır.

Detay bölümünde görülebilen bilgiler:

- teklif kodu
- müşteri adı
- malzeme
- kalınlık
- büküm boyu
- makine
- takım
- makine fiyatı
- opsiyon toplamı
- notlar
- diğer şartlar
- seçilen opsiyonlar

### 6.2 Teklif Düzenleme

Teklif listesindeki düzenleme düğmesi ile seçilen teklif düzenleme ekranında açılır.

Sistem otomatik olarak:

- müşteri bilgilerini getirir
- malzeme seçimini getirir
- notları getirir
- diğer şartları getirir
- seçilmiş makineyi getirir
- seçilmiş takımı getirir
- seçilmiş opsiyonları getirir

Düzenleme yapıldıktan sonra tekrar kaydedildiğinde:

- yeni teklif oluşturulmaz
- mevcut teklif güncellenir

### 6.3 PDF Alma

Teklif listesindeki PDF düğmesi ile teklifin PDF çıktısı indirilir.

PDF içinde yer alan temel bölümler:

- firma üst bilgisi
- teklif bilgileri
- müşteri alanı
- teklif kalemleri
- genel toplam
- yazıyla tutar
- diğer şartlar

## 7. Günlük Kullanım Önerisi

Uygulamayı verimli kullanmak için önerilen sıra:

1. Yönetici olarak katalog verilerinin doğru girildiğinden emin olun.
2. Teklif hazırlayacak kullanıcı sisteme giriş yapsın.
3. Öneri ekranından teklif hazırlansın.
4. Teklif kaydedilsin.
5. Teklifler ekranından kontrol edilsin.
6. Gerekirse düzenleme yapılsın.
7. Son haliyle PDF çıktısı alınsın.

## 8. Dikkat Edilmesi Gerekenler

- Müşteri bilgileri eksikse teklif kaydı tamamlanamaz.
- Makine seçilmeden teklif kaydedilmemelidir.
- Takım seçimi yapılması önerilir.
- PDF almadan önce teklif detayları kontrol edilmelidir.
- Kullanıcılar yalnızca kendi tekliflerini görebilir.
- Teklif silme işlemi yalnızca yönetici tarafından yapılabilir.
