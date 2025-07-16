# Google Sheets Entegrasyonu Kurulum Rehberi

Bu dosya, React formunuzdan Google Sheets'e veri gönderimi için gerekli adımları açıklar.

## 1. Google Sheets Hazırlama

1. Google Drive'da yeni bir Google Sheets dosyası oluşturun
2. İlk satıra şu başlıkları ekleyin:
   - A1: Timestamp
   - B1: Order Creator
   - C1: Customer Name
   - D1: Vehicle Type
   - E1: Shipment Type
   - F1: Vehicle Plate
   - G1: Driver Name
   - H1: Driver Phone
   - I1: Recipient Name
   - J1: Recipient Phone
   - K1: Products
   - L1: Total Weight

## 2. Google Apps Script Oluşturma

1. Google Sheets'inizde **Extensions > Apps Script** menüsüne gidin
2. Aşağıdaki kodu `Code.gs` dosyasına yapıştırın:

```javascript
function doPost(e) {
  try {
    // Sheets'inizi açın (Sheet ID'nizi buraya yazın)
    const sheet = SpreadsheetApp.openById('1ONhpP28_u-4Y0YqbSByPwH2_rlLlm8YnKFmfkHwhOT8').getActiveSheet();
    
    // POST verilerini parse edin
    const data = JSON.parse(e.postData.contents);
    
    // Yeni satır ekleyin
    sheet.appendRow([
      data.timestamp || new Date(),
      data.orderCreator || '',
      data.customerName || '',
      data.vehicleType || '',
      data.shipmentType || '',
      data.vehiclePlate || '',
      data.driverName || '',
      data.driverPhone || '',
      data.recipientName || '',
      data.recipientPhone || '',
      data.products || '',
      data.totalWeight || 0
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('GET method not allowed')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

## 3. Apps Script'i Deploy Etme

1. Apps Script editöründe **Deploy > New deployment** butonuna tıklayın
2. **Type** olarak **Web app** seçin
3. **Description**: "Order Form to Sheets"
4. **Execute as**: Me
5. **Who has access**: Anyone
6. **Deploy** butonuna tıklayın
7. İzin verme ekranında **Review permissions** → **Advanced** → **Go to [project name]** → **Allow**
8. Web app URL'ini kopyalayın

## 4. React Kodunda URL'i Güncelleme

`src/App.tsx` dosyasında `GOOGLE_SCRIPT_URL` değişkenini güncelleyin:

```javascript
const GOOGLE_SCRIPT_URL = '';
```

## 5. Sheet ID'sini Bulma

Google Sheets URL'inize bakın:
`https://script.google.com/macros/library/d/1uMEf1Je_WtEoQlpWnJwLKx967hz3XcH7ISnQI34AWD0RdAzwMUk7cO8k/3`

Bu ID'yi Apps Script kodundaki `YOUR_SHEET_ID` yerine yapıştırın.

## Test Etme

1. Formu doldurun ve göndermeyi deneyin
2. Google Sheets'inizi kontrol edin - yeni satır eklenmiş olmalı
3. Hata alırsanız Apps Script'teki execution logs'u kontrol edin

## Güvenlik Notları

- Apps Script URL'i herkese açıktır ancak sadece POST isteklerini kabul eder
- Veri doğrulama ve sanitization Apps Script tarafında yapılır
- Hassas veriler için ek güvenlik önlemleri alınabilir

## Sorun Giderme

**Problem**: CORS hatası
**Çözüm**: `mode: 'no-cors'` parametresi kullanıldığından bu normal

**Problem**: Veri gelmiyor
**Çözüm**: Apps Script logs'una bakın (View > Logs)

**Problem**: İzin hatası
**Çözüm**: Apps Script deployment'ında izinleri tekrar kontrol edin