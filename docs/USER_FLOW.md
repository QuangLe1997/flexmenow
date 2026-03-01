# FlexMe - User Flow

## Onboarding Flow

```
Mo app (flexmenow.com)
    |
    v
Landing Page
    |- Hero: "Flex cuoc doi trong mo"
    |- Demo gallery: anh mau da gen
    |- CTA: "Bat dau Flex ngay!"
    |
    v
Login / Register
    |- Google SSO (chinh)
    |- Apple SSO
    |- Email + OTP
    |
    v
Welcome Screen
    |- Nhan 3 credits mien phi
    |- Huong dan nhanh (3 buoc)
    |
    v
Home Dashboard
```

## Feature 1: Flex Anh (Single Image)

```
Home -> Tab "Flex Anh"
    |
    v
Upload anh chan dung
    |- Chup truc tiep (camera)
    |- Chon tu thu vien
    |- Yeu cau: ro mat, chinh dien tot nhat
    |
    v
Chon Template
    |- Categories: Travel, Luxury, Lifestyle, Fun, ...
    |- Preview template truoc khi chon
    |- Filter: Popular, New, Free, Premium
    |
    v
Customize (Optional)
    |- Chon style (Realistic, Artistic, Anime)
    |- Chinh do tuoi, bieu cam
    |- Them text/caption
    |
    v
Confirm & Generate
    |- Hien thi: "Dang Flex cho ban... (~15-30s)"
    |- Progress bar / animation vui
    |- Tru 1 credit
    |
    v
Result Screen
    |- Hien anh da gen
    |- Options:
    |   |- Download HD
    |   |- Share len IG / TikTok / FB
    |   |- Luu vao Gallery
    |   |- Gen lai (ton them 1 credit)
    |
    v
Done -> Quay ve Home
```

## Feature 2: Flex Story (Story Series)

```
Home -> Tab "Flex Story"
    |
    v
Upload anh chan dung
    |- Tuong tu Feature 1
    |
    v
Chon Story Pack
    |- "Du lich Paris 7 ngay" - 10 anh
    |   Preview: Eiffel Tower, Cafe, Louvre, Seine, ...
    |
    |- "Co ny roi ne" - 8 anh
    |   Preview: First date, holding hands, dinner, selfie, ...
    |
    |- "CEO Lifestyle" - 6 anh
    |   Preview: Office, Meeting, Supercar, Private jet, ...
    |
    |- "Gym Transformation" - 8 anh
    |   Preview: Before, training, progress, after, ...
    |
    v
Preview Story Timeline
    |- Hien thi cac scene se duoc gen
    |- User co the bo bot / them scene
    |- Chon style chung cho ca story
    |
    v
Confirm & Generate
    |- "Dang tao Story cho ban... (~2-5 phut)"
    |- Hien tung anh khi gen xong
    |- Tru 5-10 credits
    |
    v
Story Review Screen
    |- Xem toan bo chuoi anh
    |- Swipe qua tung anh
    |- Edit tung anh:
    |   |- Re-generate 1 anh cu the
    |   |- Crop / Filter
    |   |- Them caption
    |
    v
Export Options
    |- Download all (ZIP)
    |- Share tung anh
    |- Schedule post (Pro feature)
    |   |- Chon ngay/gio cho tung anh
    |   |- Tu dong post len IG/FB
    |
    v
Done -> Luu vao Gallery
```

## Gallery Flow

```
Home -> Tab "Gallery"
    |
    v
Tat ca anh/story da gen
    |- Filter: Anh don / Story / Yeu thich
    |- Sort: Moi nhat / Cu nhat
    |
    v
Chon 1 anh/story
    |- Xem chi tiet
    |- Download lai
    |- Share lai
    |- Xoa
```

## Payment Flow

```
Het credit -> Hien popup
    |
    v
Chon plan
    |- Basic: $4.99/thang
    |- Pro: $9.99/thang
    |- Mua le: $1.99 = 20 credits
    |
    v
Thanh toan
    |- Stripe (quoc te)
    |- MoMo / ZaloPay / VNPay (VN)
    |
    v
Xac nhan -> Credits duoc cong ngay
```
