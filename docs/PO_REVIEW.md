# FlexMe - PO Review & Đề Xuất Cải Tiến

> Review bởi: Product Owner
> Ngày: 28/02/2026
> Trạng thái: CẦN CHỈNH SỬA TRƯỚC KHI PHÁT TRIỂN

---

## 1. ĐÁNH GIÁ TỔNG QUAN

| Hạng mục | Điểm | Nhận xét |
|----------|------|----------|
| Ý tưởng sản phẩm | 8/10 | Đúng trend, đúng nhu cầu Gen Z |
| Phân biệt tính năng | 5/10 | 3 feature chưa rõ ranh giới, dễ gây nhầm lẫn |
| Khả thi kỹ thuật | 6/10 | Vertex AI Imagen chưa chắc đủ tốt cho face-swap |
| Chiến lược MVP | 4/10 | 3 feature cùng lúc = quá tham, cần ưu tiên |
| Rủi ro pháp lý/đạo đức | 5/10 | Chỉnh sửa cơ thể nhạy cảm, cần chính sách rõ |
| Trải nghiệm người dùng | 7/10 | Flow tốt nhưng thiếu nhiều edge case |
| Monetization | 6/10 | Pricing chưa được validate, cần A/B test |
| Viral/Growth | 7/10 | Có tiềm năng nhưng thiếu cơ chế cụ thể |

**Kết luận: 6.0/10 - Tiềm năng tốt nhưng cần chỉnh sửa đáng kể trước khi code.**

---

## 2. CÁC VẤN ĐỀ NGHIÊM TRỌNG

### Vấn đề 1: GlowUp KHÔNG CÓ LỢI THẾ CẠNH TRANH
**Mức độ: NGHIÊM TRỌNG**

Thị trường app làm đẹp đã BÃO HOÀ:
- FaceApp (500M+ downloads) - đổi tóc, trẻ hoá, đổi giới tính
- Facetune (200M+) - chỉnh mặt, body, da
- Snow/Meitu (phổ biến ở châu Á) - filter, làm đẹp
- Remini (100M+) - AI enhance

**Câu hỏi:** Tại sao người dùng bỏ app đang dùng để sang FlexMe chỉ để "làm mịn da"?

**Đề xuất:** GlowUp cần được tái định vị. Không nên là "app làm đẹp thông thường"
mà phải gắn vào bản sắc FlexMe = FLEX. Xem đề xuất cải tiến ở mục 4.

---

### Vấn đề 2: Ranh Giới 3 Feature Mờ Nhạt
**Mức độ: NGHIÊM TRỌNG**

Người dùng mới vào app sẽ bối rối:
- "Tôi muốn ảnh đẹp hơn" -> GlowUp hay FlexShot?
- "Tôi muốn ảnh ở Paris" -> FlexShot (1 ảnh) hay FlexTale (chuỗi ảnh)?
- "Tôi muốn ảnh mặc áo dài" -> GlowUp (đổi trang phục) hay FlexShot (template)?

**Vấn đề gốc:** 3 feature đang được phân chia theo KỸ THUẬT (edit vs generate vs series)
thay vì theo NHU CẦU NGƯỜI DÙNG.

**Đề xuất:** Phân chia lại theo hành trình cảm xúc của người dùng. Xem mục 4.

---

### Vấn đề 3: Scope MVP Quá Lớn
**Mức độ: NGHIÊM TRỌNG**

Phát triển 3 feature cùng lúc = rủi ro cao:
- Không feature nào được đầu tư đủ sâu
- Thời gian ra thị trường chậm
- Khó đo lường feature nào thực sự có giá trị

**Đề xuất:**
- MVP chỉ nên có 1 feature cốt lõi (FlexShot)
- Feature thứ 2 (FlexTale) ở phase 2
- Feature thứ 3 (GlowUp đã tái định vị) ở phase 3

---

### Vấn đề 4: Rủi Ro Về Chỉnh Sửa Cơ Thể
**Mức độ: CAO**

Các tính năng sau có thể gây tranh cãi và rủi ro pháp lý:
- "Nâng ngực", "Nâng mông" -> nhạy cảm, đặc biệt với người dùng trẻ (16+)
- "Fit body", "Chân dài" -> khuyến khích tiêu chuẩn ngoại hình không thực tế
- Có thể bị báo chí phản ứng tiêu cực
- Một số quốc gia có luật về quảng cáo sai lệch hình ảnh cơ thể

**Đề xuất:**
- Giới hạn tuổi: 18+ cho các tính năng chỉnh sửa cơ thể
- Đổi tên nhẹ nhàng hơn: "Fit body" thay vì "Nâng ngực/mông"
- Thêm disclaimer: "Ảnh được tạo bởi AI. Bạn đã hoàn hảo rồi!"
- Cân nhắc bỏ các option quá nhạy cảm ở giai đoạn đầu

---

### Vấn đề 5: Chất Lượng AI Chưa Được Kiểm Chứng
**Mức độ: CAO**

Toàn bộ sản phẩm phụ thuộc vào chất lượng AI:
- Vertex AI Imagen + Subject Reference: chưa test thực tế với khuôn mặt châu Á
- Face consistency trong FlexTale (10+ ảnh): rất khó, dễ bị "biến dạng"
- So sánh: Flux.1 + IP-Adapter cho kết quả face-swap tốt hơn Imagen hiện tại

**Đề xuất:**
- CẦN POC (Proof of Concept) ngay: test 50 ảnh với Vertex AI Imagen
- So sánh chất lượng với Flux.1 + IP-Adapter
- Chuẩn bị plan B: dùng Flux qua RunPod nếu Imagen không đủ tốt
- Xác định "ngưỡng chấp nhận được" trước khi code feature

---

### Vấn đề 6: Thiếu Chiến Lược Nội Dung (Content Pipeline)
**Mức độ: CAO**

Tài liệu liệt kê 30+ template và 15+ story pack nhưng:
- Ai tạo template? Quy trình nào?
- Ai viết prompt? Test prompt bao nhiêu lần?
- Ai tạo ảnh mẫu (sample image) cho mỗi template?
- Mỗi template cần bao nhiêu thời gian QA?
- Template update frequency? Ai quyết định thêm template mới?

**Đề xuất:**
- Cần 1 "Template Pipeline" rõ ràng
- MVP chỉ cần 10 template thật tốt, không cần 30 template trung bình
- Mỗi template cần qua QA: test ít nhất 20 khuôn mặt khác nhau
- Cần role "Content Creator / Prompt Engineer"

---

## 3. CÁC VẤN ĐỀ THIẾU SÓT

### Thiếu: Content Moderation
- Người dùng upload ảnh không phù hợp (NSFW)?
- Người dùng dùng ảnh người khác (không đồng ý)?
- AI tạo ra kết quả không phù hợp?
- **Cần:** Gemini content filter + Firebase ML Kit face detection

### Thiếu: Xử Lý Lỗi & Edge Cases
- Ảnh upload không có mặt người -> thông báo gì?
- Ảnh có nhiều người -> chọn mặt nào?
- AI tạo ra ảnh xấu -> refund credits tự động?
- Người dùng thoát app giữa lúc đang gen -> xử lý thế nào?
- Cloud Function timeout (>300s cho FlexTale) -> queue thế nào?

### Thiếu: Feedback Loop
- Người dùng đánh giá kết quả (tốt/xấu) ở đâu?
- Dữ liệu feedback dùng để cải thiện prompt thế nào?
- Report ảnh lỗi -> quy trình xử lý?

### Thiếu: Onboarding & Retention
- Người dùng mới vào -> hướng dẫn thế nào? Tutorial? Video?
- Người dùng dùng hết free credits -> push notification gì?
- Gamification: streak, achievement, level?
- Daily reward ngoài 3 credits?

### Thiếu: Social Features
- Có gallery công khai (community gallery) không?
- Người dùng có thể "like" ảnh người khác?
- Trending templates dựa trên tiêu chí nào?
- Challenge #FlexMe -> cơ chế cụ thể?

### Thiếu: Analytics & Tracking
- Đo gì để biết feature thành công?
- Funnel: Landing -> Register -> First Gen -> Payment?
- Churn rate tracking?
- A/B test cơ chế nào?

---

## 4. ĐỀ XUẤT CẢI TIẾN - TÁI ĐỊNH VỊ 3 FEATURE

### Nguyên tắc: Phân chia theo NHU CẦU, không theo kỹ thuật

Người dùng Gen Z khi mở FlexMe, họ nghĩ:
1. "Tôi muốn ẢNH ĐẸP HƠN ngay bây giờ" -> Nhanh, dễ
2. "Tôi muốn ẢNH WOW để flex" -> Ấn tượng, độc đáo
3. "Tôi muốn CẢ CÂU CHUYỆN để đăng" -> Dài hạn, thể hiện

### Đề Xuất Tái Định Vị:

```
+================================================================+
|                        FLEXME APP                               |
|                                                                 |
|  +------------------+  +----------------+  +-----------------+  |
|  |                  |  |                |  |                 |  |
|  |     GLOWUP       |  |   FLEXSHOT     |  |   FLEXTALE      |  |
|  |  (Nâng cấp)     |  |  (Hoá thân)   |  |  (Câu chuyện)  |  |
|  |                  |  |                |  |                 |  |
|  |  "Nâng cấp phiên |  |  "Hoá thân    |  |  "Sống trong   |  |
|  |   bản bạn"       |  |   1 giây"      |  |   câu chuyện"  |  |
|  |                  |  |                |  |                 |  |
|  |  CHỈNH SỬA ảnh  |  |  TẠO ảnh mới  |  |  TẠO bộ ảnh    |  |
|  |  gốc cho đẹp hơn |  |  hoàn toàn     |  |  có mạch truyện |  |
|  |                  |  |                |  |                 |  |
|  |  Kết quả: ảnh gốc|  |  Kết quả: ảnh  |  |  Kết quả: N ảnh|  |
|  |  + nâng cấp      |  |  mới 100%      |  |  + caption      |  |
|  +------------------+  +----------------+  +-----------------+  |
|                                                                 |
|  Rào cản thấp         Rào cản trung bình   Rào cản cao          |
|  (1 credit, 10s)      (1 credit, 20s)      (5-15 credits, 5m)  |
|  Entry point           Core feature        Premium feature       |
+================================================================+
```

### GlowUp - Tái Định Vị

**Cũ:** App làm đẹp thông thường (cạnh tranh với FaceApp, Facetune...)
**Mới:** "Nâng cấp phiên bản flex" - KHÔNG CHỈ làm đẹp mà còn NÂNG TẦM

**Thay đổi quan trọng:**
1. Bỏ các tuỳ chỉnh quá chi tiết (mắt to, mũi cao, V-line riêng lẻ)
2. Thay bằng CÁC PRESET PHONG CÁCH nhanh, dễ chọn
3. Mỗi preset = combo nhiều chỉnh sửa đã tối ưu sẵn
4. Thêm tuỳ chỉnh cơ thể nhưng tế nhị hơn

**Preset GlowUp mới:**

| Preset | Mô tả | Bao gồm |
|--------|-------|---------|
| Natural Glow | Đẹp tự nhiên, không thấy chỉnh | Mịn da, sáng da, chỉnh ánh sáng nhẹ |
| K-Beauty | Phong cách Hàn Quốc | Da trắng mịn, mắt sáng, môi hồng, V-line nhẹ |
| Boss Mode | Phong cách CEO / chuyên nghiệp | Sắc nét, nam tính/nữ tính, tự tin |
| Soft Glam | Glamorous nhẹ nhàng | Makeup nhẹ, da sáng, tóc mượt |
| Street Style | Phong cách đường phố | Cool, edgy, contrast cao |
| Date Night | Đi hẹn hò | Makeup đậm hơn, sexy nhẹ, ánh sáng ấm |
| Fitness Pro | Thể thao khoẻ mạnh | Body fit, da nâu khoẻ, rắn chắc |

**Ưu điểm:**
- Dễ chọn hơn (1 click thay vì 10 checkboxes)
- Tránh tranh cãi "nâng ngực, nâng mông"
- Mỗi preset đã QA sẵn -> chất lượng đồng đều
- Vẫn có "Tuỳ chỉnh nâng cao" cho ai muốn chi tiết

**Luồng mới:**
```
Upload ảnh -> Chọn preset (1 click) -> Xem kết quả (10s)
                  |
                  v (tuỳ chọn)
           "Tuỳ chỉnh thêm" -> chỉnh chi tiết
```

---

### FlexShot - Giữ Nguyên, Bổ Sung

FlexShot đã tốt, chỉ cần bổ sung:

1. **Thêm cơ chế "Trending":**
   - Template được dùng nhiều nhất tuần -> lên đầu
   - "Template mới" badge -> thu hút thử
   - Seasonal auto-rotate (Tết, Valentine, ...)

2. **Thêm "Quick FlexShot":**
   - AI tự chọn template phù hợp dựa trên ảnh user
   - User chỉ cần upload ảnh -> AI recommend 3 template tốt nhất
   - Giảm friction cho người dùng mới

3. **Thêm FlexShot Duo (Phase 2):**
   - 2 người trong 1 template (bạn bè, couple)
   - Upload 2 ảnh -> AI ghép cả 2 vào template
   - Viral potential rất cao

---

### FlexTale - Bổ Sung Quan Trọng

1. **Giới hạn Custom Story:**
   - MVP: chỉ Preset Stories, KHÔNG có Custom Story
   - Lý do: Custom story khó kiểm soát chất lượng, dễ bị lạm dụng
   - Custom Story = Phase 3 (sau khi có đủ dữ liệu và AI feedback)

2. **Thêm "Mini Tale" (3-5 ảnh):**
   - Story ngắn, rẻ hơn (3 credits)
   - Dành cho người dùng muốn thử nhưng chưa muốn trả nhiều
   - Conversion path: Mini Tale -> Full Tale

3. **Smart Caption:**
   - Caption phải tự nhiên, không bị "máy"
   - Hỗ trợ đa ngôn ngữ: Tiếng Việt, Tiếng Anh, Tienglish (trộn)
   - Tone tuỳ chọn: Hài hước / Sâu lắng / Flex thẳng

4. **Story Timeline View:**
   - Hiển thị story dạng timeline Instagram
   - Gợi ý lịch đăng cụ thể
   - "Đăng ảnh 1 vào thứ 2, ảnh 2 vào thứ 3..."

---

## 5. ĐỀ XUẤT CHIẾN LƯỢC MVP

### Ưu Tiên Phát Triển (Mới)

```
Phase 1 (MVP - 4 tuần): CHỈ FlexShot
  - 10 template chất lượng cao (đã QA)
  - Google login
  - Credit system + Stripe
  - Gallery
  - Share cơ bản
  -> Mục tiêu: Validate market fit

Phase 1.5 (2 tuần): GlowUp Lite
  - 7 preset (không custom chi tiết)
  - Quick, easy, 1-click
  -> Mục tiêu: Tăng daily engagement (GlowUp nhanh hơn, dùng thường xuyên hơn)

Phase 2 (4 tuần): FlexTale (Preset only)
  - 5 story pack có sẵn
  - Mini Tale (3-5 ảnh) + Full Tale (8-10 ảnh)
  - Realtime generation UI
  -> Mục tiêu: Tăng ARPU (FlexTale tốn nhiều credits hơn)

Phase 3 (4 tuần): Growth
  - FlexTale Custom Story
  - FlexShot Duo
  - GlowUp chi tiết
  - Social features, challenges
  -> Mục tiêu: Viral growth + retention
```

### Tại Sao FlexShot Trước?
1. **Dễ hiểu nhất:** Upload ảnh -> Chọn template -> Nhận kết quả
2. **Dễ viral nhất:** 1 ảnh WOW -> Người dùng share ngay
3. **Dễ QA nhất:** 1 ảnh, prompt cố định, dễ kiểm soát chất lượng
4. **Nhanh nhất:** 15-30s -> User không chờ lâu
5. **Rẻ nhất:** 1 credit -> Rào cản thấp, dễ convert

---

## 6. ĐỀ XUẤT BỔ SUNG VÀO TÀI LIỆU

### Cần Thêm Trước Khi Code:

| Tài liệu | Ưu tiên | Mô tả |
|-----------|---------|-------|
| Content Moderation Policy | P0 | Quy tắc kiểm duyệt ảnh input/output |
| Template Pipeline | P0 | Quy trình tạo, test, QA template |
| AI Quality Benchmark | P0 | Tiêu chuẩn chất lượng ảnh AI (POC) |
| Error Handling Spec | P1 | Xử lý tất cả edge cases |
| Onboarding Flow | P1 | Tutorial, first-time experience |
| Analytics Plan | P1 | Event tracking, funnel, KPIs |
| A/B Test Plan | P2 | Giá, UI, template order |
| Community Guidelines | P2 | Quy tắc cộng đồng |
| Terms of Service | P1 | Điều khoản sử dụng |
| Privacy Policy | P0 | Chính sách quyền riêng tư (bắt buộc) |

---

## 7. CHECKLIST TRƯỚC KHI BẮT ĐẦU CODE

- [ ] POC: Test Vertex AI Imagen với 50 ảnh khuôn mặt khác nhau
- [ ] POC: Test face consistency qua 10 ảnh liên tục
- [ ] Quyết định: Imagen đủ tốt hay cần fallback Flux.1?
- [ ] Tạo 10 template FlexShot hoàn chỉnh (prompt + QA)
- [ ] Viết Content Moderation Policy
- [ ] Viết Privacy Policy + Terms of Service
- [ ] Xác nhận pricing qua survey (hỏi 50-100 người Gen Z)
- [ ] Setup Firebase project + enable APIs
- [ ] Mua domain flexmenow.com (hoặc alternative)
- [ ] Tạo brand identity (logo, màu sắc, font chữ)

---

## 8. KẾT LUẬN PO

### Điểm Mạnh Cần Giữ:
- FlexTale (Story Series) là USP thực sự, chưa ai làm tốt
- Định vị "entertainment" đúng hướng
- Full Firebase stack giảm complexity
- Target Gen Z + MXH là thị trường lớn

### Cần Sửa Ngay:
1. **Thu hẹp MVP** -> Chỉ FlexShot trước
2. **Tái định vị GlowUp** -> Preset nhanh, không cạnh tranh app làm đẹp
3. **POC chất lượng AI** -> Trước khi code bất kỳ thứ gì
4. **Template Pipeline** -> Ai tạo, ai test, quy trình rõ ràng
5. **Xử lý rủi ro đạo đức** -> Bỏ "nâng ngực, nâng mông" ở MVP

### Hành Động Tiếp Theo:
1. Chạy AI POC (1 tuần)
2. Cập nhật tài liệu theo review này
3. Tạo 10 template FlexShot đầu tiên
4. Bắt đầu code Phase 1 (FlexShot only)

> **"Ship FlexShot trước. Nếu 1 ảnh đã làm người ta WOW,
> họ sẽ quay lại cho FlexTale. Nếu 1 ảnh không WOW được,
> 10 ảnh cũng vô nghĩa."**
