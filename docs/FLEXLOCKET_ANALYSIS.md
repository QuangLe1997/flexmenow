# FlexLocket - Phân Tích & Thiết Kế Tính Năng

> Pivot GlowUp -> FlexLocket
> Ngày: 28/02/2026

---

## 1. TẠI SAO FLEXLOCKET LÀ NƯỚC ĐI ĐÚNG

### Insight Cốt Lõi

```
+------------------------------------------------------------------+
|                                                                    |
|   Người dùng Gen Z có MÂU THUẪN NỘI TÂM:                        |
|                                                                    |
|   "Tôi muốn ảnh CHÂN THỰC,     NHƯNG    tôi vẫn muốn            |
|    bắt khoảnh khắc NOW,                   trông ĐẸP trong        |
|    không giả tạo,                          ảnh đó"                |
|    không bị nhận ra                                                |
|    là chỉnh sửa"                                                  |
|                                                                    |
|   => SWEET SPOT: Ảnh trông THẬT nhưng tôi trông TUYỆT            |
|                                                                    |
+------------------------------------------------------------------+
```

### Tại Sao Locket Đang Viral?

| Yếu tố | Mô tả |
|---------|-------|
| **Chân thực** | Ảnh chụp ngay lúc đó, không filter nặng, không pose |
| **Thân mật** | Gửi cho người thân, bạn bè thân - không public |
| **Bất ngờ** | Nhận ảnh bất ngờ trên widget -> cảm xúc thật |
| **FOMO** | "Bạn bè đang dùng, mình cũng muốn" |
| **Anti-Instagram** | Phản ứng lại văn hoá ảnh quá chỉnh sửa |

### Vấn Đề Của Locket Hiện Tại
> Người dùng THÍCH ý tưởng chân thực, nhưng vẫn KHÔNG TỰ TIN
> gửi ảnh chưa chỉnh sửa gì.

Thực tế: Rất nhiều người chụp Locket 3-5 lần mới gửi 1 tấm.
Họ muốn "candid" nhưng vẫn muốn trông đẹp.

### FlexLocket Giải Quyết Đúng Vấn Đề Này

```
+------------------------------------------------------------------+
|                                                                    |
|   FaceApp/Facetune          FlexLocket           Locket thuần     |
|   ──────────────            ──────────           ──────────────   |
|   Chỉnh quá rõ             Sweet spot           Không chỉnh gì   |
|   Ai cũng nhận ra           Đẹp mà tự nhiên     Đôi khi xấu     |
|   Giả tạo                  Không ai nhận ra      Chân thực 100%  |
|   "Sống ảo"                "Photogenic tự nhiên"  "Thật quá"     |
|                                  ↑                                |
|                            ĐÂY LÀ CHỖ                           |
|                            CHƯA AI LÀM TỐT                       |
|                                                                    |
+------------------------------------------------------------------+
```

**FlexLocket = "AI làm bạn photogenic tự nhiên, không ai biết"**

---

## 2. FLEXLOCKET LÀ GÌ

### Định Nghĩa
FlexLocket là tính năng nâng cấp ảnh SIÊU TINH TẾ bằng AI.
Kết quả trông như ảnh chụp tự nhiên, đẹp sẵn - KHÔNG trông như đã chỉnh sửa.

### Nguyên Tắc Vàng

```
+------------------------------------------+
|                                           |
|   5 QUY TẮC CỦA FLEXLOCKET              |
|                                           |
|   1. KHÔNG AI NHẬN RA đã chỉnh sửa      |
|   2. Giữ 100% BỐI CẢNH gốc              |
|   3. Giữ 100% KHOẢNH KHẮC gốc           |
|   4. Chỉ nâng cấp NGƯỜI trong ảnh       |
|   5. Kết quả = "hôm đó mình đẹp thật"   |
|                                           |
+------------------------------------------+
```

### So Sánh Với GlowUp Cũ

| | GlowUp (cũ) | FlexLocket (mới) |
|---|-------------|------------------|
| **Triết lý** | "Làm đẹp cho bạn" | "Bạn đã đẹp, AI chỉ giúp camera thấy điều đó" |
| **Mức chỉnh** | Mạnh, rõ ràng | Tinh tế, không nhận ra |
| **Kết quả** | Trước/Sau khác biệt rõ | Trước/Sau gần giống, chỉ "sáng" hơn |
| **Cảm giác** | "Mình chỉnh ảnh" | "Hôm đó mình đẹp thật" |
| **Cạnh tranh** | FaceApp, Facetune (thua) | CHƯA AI LÀM (thắng) |
| **Phù hợp Locket** | Không | Hoàn toàn - gửi ảnh "thật" mà đẹp |
| **Phù hợp BeReal** | Không | Hoàn toàn - trông candid |
| **Phù hợp Stories** | Một phần | Hoàn toàn - trông tự nhiên |

---

## 3. FLEXLOCKET NÂNG CẤP NHỮNG GÌ

### Các Cấp Độ Nâng Cấp

```
+------------------------------------------------------------------+
|                                                                    |
|   CẤP 1: SKIN (Tự động - luôn bật)                               |
|   ├── Cân bằng tông da (không trắng bệch, không vàng)            |
|   ├── Xoá mụn, vết thâm NHẸ (vẫn giữ nốt ruồi, tàn nhang)     |
|   ├── Mịn da tự nhiên (không mịn như sáp)                        |
|   └── Giảm bóng dầu, quầng thâm mắt                             |
|                                                                    |
|   CẤP 2: LIGHT (Tự động - luôn bật)                              |
|   ├── Cân bằng ánh sáng trên mặt                                 |
|   ├── Giảm bóng đổ xấu (shadow dưới mắt, cằm)                  |
|   ├── Làm sáng vùng mắt một chút                                 |
|   └── Soft light nhẹ (như có ring light tự nhiên)                 |
|                                                                    |
|   CẤP 3: ENHANCE (Tuỳ chọn - thanh trượt 0-100%)               |
|   ├── Gọn mặt cực nhẹ (2-5%, không ai nhận ra)                  |
|   ├── Mắt sáng hơn một chút                                      |
|   ├── Môi có màu hơn một chút                                    |
|   ├── Tóc gọn gàng hơn                                           |
|   └── Body tone nhẹ (nếu ảnh toàn thân)                          |
|                                                                    |
|   CẤP 4: VIBE (Tuỳ chọn - chọn mood)                            |
|   ├── Warm & Cozy: tông ấm, cam nhẹ                              |
|   ├── Cool & Clean: tông mát, sắc nét                            |
|   ├── Golden Hour: ánh vàng hoàng hôn                             |
|   ├── Soft Dream: mềm mại, mờ nhẹ viền                          |
|   └── Night Mood: tương phản cao, sắc nét ban đêm               |
|                                                                    |
+------------------------------------------------------------------+
```

### Quan Trọng: NHỮNG GÌ FLEXLOCKET KHÔNG LÀM

```
+------------------------------------------+
|                                           |
|   FLEXLOCKET KHÔNG BAO GIỜ:             |
|                                           |
|   ✗ Thay đổi hình dáng khuôn mặt nhiều  |
|   ✗ Phóng to mắt quá mức                |
|   ✗ Thu nhỏ mũi rõ ràng                  |
|   ✗ Đổi màu tóc                          |
|   ✗ Thay đổi cơ thể rõ ràng             |
|   ✗ Thêm makeup đậm                      |
|   ✗ Đổi nền / bối cảnh                   |
|   ✗ Bất kỳ thứ gì nhận ra được           |
|                                           |
|   => Nếu muốn thay đổi lớn              |
|      -> Dùng FlexShot hoặc FlexTale      |
|                                           |
+------------------------------------------+
```

**Đây chính là ranh giới RÕ RÀNG giữa FlexLocket và FlexShot:**
- **FlexLocket:** Vẫn là BẠN, trong ảnh THẬT của bạn, chỉ đẹp hơn tự nhiên
- **FlexShot:** HOÀN TOÀN MỚI - bạn trong bối cảnh/phong cách mới

---

## 4. LUỒNG SỬ DỤNG FLEXLOCKET

### Luồng Chính (Siêu Nhanh - 3 giây)

```
Mở FlexLocket
       |
       v
Chụp ảnh HOẶC chọn ảnh có sẵn
       |
       v
AI tự động nâng cấp (Cấp 1 + Cấp 2)
  |- Xử lý: 2-3 giây
  |- KHÔNG CẦN chọn gì
       |
       v
Hiển thị kết quả ngay lập tức
  |- Slider so sánh Trước/Sau
  |- Sự khác biệt TINH TẾ
       |
       v
[Tuỳ chọn] Tuỳ chỉnh thêm:
  |- Thanh trượt Enhance: 0% -------- 100%
  |- Chọn Vibe: Warm | Cool | Golden | Soft | Night
       |
       v
Lưu / Chia sẻ
  |- Lưu vào thư viện điện thoại
  |- Gửi qua Locket widget
  |- Đăng Story Instagram / TikTok
  |- Gửi qua tin nhắn
```

### Điểm Khác Biệt Về UX

```
GlowUp cũ:                          FlexLocket mới:
────────────                         ────────────────
Upload ảnh                           Chụp/Chọn ảnh
   |                                      |
Chọn 7-10 tuỳ chỉnh    vs           TỰ ĐỘNG (không chọn gì)
   |                                      |
Chờ 10-20 giây                       2-3 giây
   |                                      |
Xem kết quả                          Xem kết quả
   |                                      |
4 phiên bản                           1 phiên bản tốt nhất
                                          |
                                     [Tuỳ chọn] Fine-tune
                                     nếu muốn

Tổng: 5-7 bước, 30+ giây            Tổng: 2-3 bước, 5 giây
```

---

## 5. GIAO DIỆN FLEXLOCKET

### Màn Hình Chính
```
+------------------------------------------+
|                FLEXLOCKET                 |
|------------------------------------------|
|                                           |
|  +----------------------------------+    |
|  |                                  |    |
|  |                                  |    |
|  |        [CAMERA VIEWFINDER]       |    |
|  |                                  |    |
|  |         Hoặc kéo ảnh vào        |    |
|  |                                  |    |
|  |                                  |    |
|  +----------------------------------+    |
|                                           |
|         [  O  ]    <- Nút chụp           |
|                                           |
|  [Thư viện]              [Đổi camera]    |
|                                           |
+------------------------------------------+
```

### Sau Khi Chụp/Chọn (Tự Động Enhance)
```
+------------------------------------------+
|  < Quay lại        FLEXLOCKET            |
|------------------------------------------|
|                                           |
|  +----------------------------------+    |
|  |                                  |    |
|  |     [ẢNH ĐÃ ĐƯỢC NÂNG CẤP]     |    |
|  |                                  |    |
|  |  <- kéo sang trái để xem GỐC    |    |
|  |                                  |    |
|  +----------------------------------+    |
|                                           |
|  Enhance: [===========|---] 70%          |
|                                           |
|  Vibe:                                    |
|  ( ) Gốc  (•) Warm  ( ) Cool            |
|  ( ) Golden  ( ) Soft  ( ) Night         |
|                                           |
|  +----------------------------------+    |
|  |  [Lưu ảnh]     [Chia sẻ ->]     |    |
|  +----------------------------------+    |
|                                           |
+------------------------------------------+
```

### So Sánh Trước/Sau (Slide Reveal)
```
+------------------------------------------+
|                                           |
|  +----------------------------------+    |
|  |          |                       |    |
|  |  TRƯỚC   |       SAU             |    |
|  |          |                       |    |
|  |  (gốc)   |    (đã nâng cấp)     |    |
|  |          |                       |    |
|  |     <----|---->                  |    |
|  |      Kéo thanh để so sánh       |    |
|  |          |                       |    |
|  +----------------------------------+    |
|                                           |
|  "Sự khác biệt tinh tế - đúng không?"   |
|                                           |
+------------------------------------------+
```

---

## 6. CÁC VIBE PRESET CHI TIẾT

| Vibe | Mô tả | Phù hợp khi | Ví dụ |
|------|-------|-------------|-------|
| **Original+** | Giữ nguyên tone, chỉ enhance người | Muốn giữ màu gốc | Ảnh trong nhà, ánh sáng đủ |
| **Warm & Cozy** | Tông ấm, cam nhẹ, mềm mại | Ảnh buổi chiều, café, indoor | Giống ảnh film Kodak |
| **Cool & Clean** | Tông mát, sắc nét, tươi sáng | Ảnh ban ngày, ngoài trời | Giống ảnh iPhone Pro |
| **Golden Hour** | Ánh vàng hoàng hôn, dreamy | Ảnh chiều tà, outdoor | Giống ảnh "giờ vàng" |
| **Soft Dream** | Mềm mại, mờ viền nhẹ, pastel | Selfie, ảnh thân mật | Giống ảnh analog |
| **Night Mood** | Tương phản cao, sắc nét, moody | Ảnh ban đêm, bar, party | Giống ảnh VSCO dark |
| **Fresh Morning** | Tươi sáng, trong trẻo, xanh nhẹ | Ảnh buổi sáng | Giống ảnh "vừa ngủ dậy đẹp" |

---

## 7. CHI TIẾT KỸ THUẬT

### AI Pipeline FlexLocket

```
Ảnh đầu vào
       |
       v
Gemini AI (phân tích - 500ms):
  |- Phát hiện khuôn mặt, vị trí, kích thước
  |- Phân tích ánh sáng hiện tại
  |- Phát hiện vấn đề: mụn, quầng thâm, bóng đổ, bóng dầu
  |- Xác định giới tính, tuổi, tông da
  |- Tạo editing prompt TỐI THIỂU (chỉ sửa những gì cần)
  |- Nguyên tắc prompt: "subtle, undetectable, natural"
       |
       v
Vertex AI Imagen (chỉnh sửa - 2-3 giây):
  |- Model: imagen-3.0-edit-001
  |- Chế độ: INPAINTING nhẹ (chỉ vùng da, ánh sáng)
  |- Strength: THẤP (0.3-0.5, không phải 0.7-1.0)
  |- Giữ nguyên: bố cục, nền, quần áo, biểu cảm
  |- Chỉ thay đổi: da, ánh sáng mặt, chi tiết nhỏ
       |
       v
Post-processing (500ms):
  |- Áp dụng Vibe filter (nếu người dùng chọn)
  |- Blend với ảnh gốc (đảm bảo tự nhiên)
  |- Final check: so sánh histogram với ảnh gốc
  |- Nếu thay đổi > 15% -> giảm cường độ xuống
       |
       v
Kết quả: 1 ảnh tự nhiên, đẹp hơn một chút
  |- Tổng thời gian: 2-4 giây
  |- Chi phí: 0.5 credit (rẻ hơn FlexShot)
```

### Tham Số AI Quan Trọng

```typescript
const FLEXLOCKET_CONFIG = {
  // Cường độ chỉnh sửa TỐI ĐA
  maxEditStrength: 0.5,        // FlexShot dùng 0.8-1.0

  // Ngưỡng thay đổi cho phép
  maxPixelChange: 15,          // % pixel thay đổi so với gốc
  maxColorShift: 10,           // % thay đổi màu sắc

  // Vùng được chỉnh sửa
  editableAreas: [
    'skin_texture',            // Mịn da
    'skin_tone',               // Cân bằng tông da
    'under_eye',               // Quầng thâm
    'facial_lighting',         // Ánh sáng trên mặt
    'minor_blemish',           // Mụn nhỏ, vết thâm
    'oil_shine',               // Bóng dầu
  ],

  // Vùng KHÔNG ĐƯỢC chỉnh sửa
  protectedAreas: [
    'face_shape',              // Hình dáng khuôn mặt
    'eye_size',                // Kích thước mắt
    'nose_shape',              // Hình dạng mũi
    'lip_shape',               // Hình dạng môi
    'body_shape',              // Hình dáng cơ thể
    'background',              // Nền
    'clothing',                // Quần áo
    'expression',              // Biểu cảm
    'freckles',                // Tàn nhang (giữ lại)
    'moles',                   // Nốt ruồi (giữ lại)
    'wrinkles_natural',        // Nếp nhăn tự nhiên (giữ lại)
  ],

  // Gemini system prompt
  systemPrompt: `
    Bạn là chuyên gia chỉnh sửa ảnh TỐI THIỂU.
    Nguyên tắc tối cao: KẾT QUẢ PHẢI TRÔNG TỰ NHIÊN,
    KHÔNG AI NHẬN RA ĐÃ CHỈNH SỬA.

    CHỈ được sửa:
    - Mụn nhỏ, vết thâm (KHÔNG sửa nốt ruồi, tàn nhang)
    - Cân bằng ánh sáng trên mặt
    - Giảm bóng dầu nhẹ
    - Giảm quầng thâm mắt nhẹ

    TUYỆT ĐỐI KHÔNG:
    - Thay đổi hình dáng bất kỳ bộ phận nào
    - Làm trắng da quá mức
    - Phóng to/thu nhỏ bất kỳ thứ gì
    - Thêm makeup
    - Thay đổi bối cảnh

    Cường độ chỉnh sửa: TỐI THIỂU CÓ THỂ.
    Nếu không chắc có nên sửa hay không -> KHÔNG SỬA.
  `
};
```

---

## 8. PRICING FLEXLOCKET

### Đề Xuất: FlexLocket MIỄN PHÍ hoặc RẤT RẺ

| Lý do | Giải thích |
|-------|-----------|
| **Entry point** | FlexLocket là cửa ngõ để người dùng biết đến FlexMe |
| **Daily habit** | Người dùng chụp ảnh mỗi ngày -> dùng FlexLocket mỗi ngày |
| **Upsell** | Dùng FlexLocket thường xuyên -> muốn thử FlexShot, FlexTale |
| **Chi phí thấp** | Edit nhẹ tốn ít compute hơn generate mới |
| **Viral** | Ảnh đẹp tự nhiên -> bạn bè hỏi "chụp bằng gì?" -> giới thiệu app |

**Đề xuất pricing:**

| Gói | FlexLocket | FlexShot | FlexTale |
|-----|-----------|----------|----------|
| Free | 10 ảnh/ngày | 2 ảnh/ngày | Xem preview |
| Basic ($4.99/th) | Không giới hạn | 80 credits | 20 credits |
| Pro ($9.99/th) | Không giới hạn | 200 credits | 80 credits |

FlexLocket miễn phí nhiều hơn -> người dùng quay lại mỗi ngày
-> Thấy FlexShot, FlexTale trên home -> Tò mò thử -> Mua credits.

---

## 9. TÁI CẤU TRÚC 3 TÍNH NĂNG (FINAL)

### Mô Hình Mới

```
+==================================================================+
|                         FLEXME APP                                |
|                                                                   |
|   Bạn muốn gì?                                                   |
|                                                                   |
|   +------------------+  +-----------------+  +-----------------+ |
|   |                  |  |                 |  |                 | |
|   |   FLEXLOCKET     |  |    FLEXSHOT     |  |    FLEXTALE     | |
|   |                  |  |                 |  |                 | |
|   |  "Đẹp hơn       |  |  "Hoá thân      |  |  "Sống trong    | |
|   |   1 chút thôi"  |  |   1 giây"       |  |   câu chuyện"   | |
|   |                  |  |                 |  |                 | |
|   +------------------+  +-----------------+  +-----------------+ |
|   |                  |  |                 |  |                 | |
|   |  Ảnh THẬT       |  |  Ảnh MỚI        |  |  BỘ ẢNH MỚI    | |
|   |  của bạn        |  |  hoàn toàn      |  |  có câu chuyện  | |
|   |  + nâng cấp nhẹ |  |  + phong cách   |  |  + caption      | |
|   |                  |  |                 |  |                 | |
|   +------------------+  +-----------------+  +-----------------+ |
|   |                  |  |                 |  |                 | |
|   |  2-3 giây       |  |  15-30 giây     |  |  2-10 phút      | |
|   |  0.5 credit     |  |  1-2 credits    |  |  5-15 credits   | |
|   |  HÀNG NGÀY      |  |  KHI MUỐN FLEX  |  |  DỊP ĐẶC BIỆT  | |
|   |                  |  |                 |  |                 | |
|   +------------------+  +-----------------+  +-----------------+ |
|                                                                   |
|   Tần suất dùng:                                                 |
|   Hàng ngày            Vài lần/tuần         Vài lần/tháng       |
|                                                                   |
|   Mức "ảo":                                                      |
|   0% (thật 100%)       80% (ảnh mới)       100% (story ảo)      |
|                                                                   |
+==================================================================+
```

### Ranh Giới Rõ Ràng

```
Câu hỏi người dùng:                   -> Tính năng:

"Tôi vừa chụp selfie,
 muốn đẹp hơn tí nhưng vẫn tự nhiên"  -> FLEXLOCKET (nâng cấp nhẹ)

"Tôi muốn ảnh mình ở Paris /
 mặc áo dài / lái Lamborghini"         -> FLEXSHOT (tạo ảnh mới)

"Tôi muốn cả bộ ảnh đi du lịch /
 có ny / CEO lifestyle"                -> FLEXTALE (tạo câu chuyện)
```

### Hành Trình Người Dùng Điển Hình

```
Ngày 1: Biết đến FlexMe qua bạn bè share ảnh
     |
     v
Ngày 1: Thử FlexLocket (miễn phí, nhanh, dễ)
     |  -> "Wow ảnh mình đẹp hơn mà tự nhiên"
     |  -> Dùng hàng ngày
     v
Tuần 2: Tò mò FlexShot, thử template Paris
     |  -> "Ảnh mình ở Paris đẹp quá!"
     |  -> Share lên Instagram
     |  -> Bạn bè hỏi "đi Paris thật à?"
     v
Tuần 3: Muốn thử FlexTale
     |  -> Tạo story "Du lịch Tokyo 7 ngày"
     |  -> Đăng 10 ảnh trong 7 ngày
     |  -> Cả feed nghĩ đi Tokyo thật
     v
Tháng 2: Mua gói Basic ($4.99)
     |  -> FlexLocket không giới hạn
     |  -> 80 credits cho FlexShot + FlexTale
     v
Ongoing: Dùng hàng ngày, trả phí hàng tháng
```

---

## 10. SO SÁNH FINAL

| | FLEXLOCKET | FLEXSHOT | FLEXTALE |
|---|-----------|---------|----------|
| **Tagline** | "Đẹp hơn 1 chút thôi" | "Hoá thân 1 giây" | "Sống trong câu chuyện" |
| **Bản chất** | Nâng cấp ảnh THẬT | Tạo ảnh MỚI | Tạo BỘ ẢNH có truyện |
| **Mức thay đổi** | 5-15% (không nhận ra) | 100% (ảnh khác hoàn toàn) | 100% x N ảnh |
| **Bối cảnh** | Giữ nguyên 100% | Thay đổi 100% | Tạo mới 100% |
| **Danh tính** | Giữ nguyên 100% | Giữ mặt, đổi hết | Giữ mặt xuyên suốt |
| **Thời gian** | 2-3 giây | 15-30 giây | 2-10 phút |
| **Credits** | 0.5 (hoặc miễn phí) | 1-2 | 5-15 |
| **Tần suất** | Hàng ngày | Vài lần/tuần | Vài lần/tháng |
| **Người dùng nghĩ** | "Ảnh tự nhiên đẹp" | "Flex ảnh wow" | "Đi du lịch thật" |
| **Người xem nghĩ** | "Hôm nay đẹp thật" | "Biết là AI rồi" | "Ảo nhưng vui" |
| **Vai trò** | Entry point + Daily habit | Core flex feature | Premium feature |
| **Growth** | Retention (quay lại mỗi ngày) | Acquisition (viral share) | Revenue (tốn credits) |

---

## 11. TẠI SAO CẤU TRÚC NÀY TỐT HƠN

### 1. Mỗi Feature Có Vai Trò Rõ Ràng Trong Funnel

```
FLEXLOCKET (Retention)
  "Dùng mỗi ngày, miễn phí, tạo thói quen"
       |
       v
FLEXSHOT (Acquisition + Engagement)
  "Tạo ảnh WOW, share lên MXH, bạn bè thấy -> tải app"
       |
       v
FLEXTALE (Revenue)
  "Tốn nhiều credits nhất, mua gói Pro"
```

### 2. Không Còn Nhầm Lẫn Feature

| Tôi muốn... | Feature | Rõ ràng? |
|-------------|---------|----------|
| Ảnh selfie đẹp tự nhiên | FlexLocket | ✅ Rõ |
| Ảnh mình ở Paris | FlexShot | ✅ Rõ |
| Bộ ảnh đi du lịch 7 ngày | FlexTale | ✅ Rõ |
| Gửi ảnh cho ny trông đẹp | FlexLocket | ✅ Rõ |
| Ảnh mình mặc áo dài | FlexShot | ✅ Rõ |
| Story có ny | FlexTale | ✅ Rõ |

### 3. GlowUp Cũ = Vùng Chết, FlexLocket = Vùng Xanh

```
Thị trường làm đẹp ảnh:

  Chỉnh mạnh    FaceApp ██████████
  (GlowUp cũ)   Facetune ████████
                 Snow ██████████████
                 Meitu ████████████
                 => ĐỎ: Quá đông, không vào được

  Chỉnh nhẹ     FlexLocket ░░░░░░░░░░
  tự nhiên       => XANH: Chưa ai làm tốt
  không nhận ra
```

---

## 12. KẾT LUẬN

FlexLocket giải quyết 3 vấn đề lớn nhất từ PO Review:

| Vấn đề | GlowUp (cũ) | FlexLocket (mới) |
|---------|------------|------------------|
| Không có lợi thế cạnh tranh | ✗ Cạnh tranh FaceApp | ✅ Blue ocean, chưa ai làm |
| Ranh giới mờ với FlexShot | ✗ Cả 2 đều "làm đẹp" | ✅ Locket=nâng cấp nhẹ, Shot=tạo mới |
| Rủi ro đạo đức | ✗ Nâng ngực, nâng mông | ✅ Chỉ chỉnh tinh tế, tự nhiên |

**Bonus:**
- Tạo daily habit (dùng mỗi ngày) -> tăng retention
- Entry point rào cản thấp -> tăng acquisition
- Upsell tự nhiên sang FlexShot, FlexTale -> tăng revenue
- Phù hợp trend Locket/BeReal -> dễ viral
- Chi phí AI thấp (edit nhẹ) -> margin cao hơn
