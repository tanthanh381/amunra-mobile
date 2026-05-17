# Security Audit - Amunra Mobile

Ngày thực hiện: 2026-05-17
Phạm vi: static storefront và trang Admin trên GitHub Pages.

## Tóm tắt

Dự án hiện là static site, không có backend/API/database. Vì vậy các nhóm lỗi như SQL Injection, SSRF, server-side auth, server logging không thể kiểm thử đầy đủ ở tầng server. Pentest tập trung vào rủi ro phía client: access control của Admin, XSS DOM/localStorage, dependency CDN, security headers dạng meta, input validation và clickjacking.

## OWASP Top 10 mapping

| OWASP | Trạng thái | Nhận định |
|---|---|---|
| A01 Broken Access Control | Fixed một phần | Admin public đã được ẩn khỏi menu và thêm PIN gate client-side. Cần backend auth thật cho production. |
| A02 Cryptographic Failures | N/A một phần | Không xử lý dữ liệu nhạy cảm/server-side. PIN client-side chỉ là lớp chặn nhẹ, không phải bảo mật mạnh. |
| A03 Injection | Fixed một phần | Dữ liệu render qua escape HTML. Admin thêm giới hạn input và chuẩn hóa URL. |
| A04 Insecure Design | Fixed một phần | Thêm báo cáo, noindex Admin, giảm lộ link Admin. Cần thiết kế backend auth/role nếu vận hành thật. |
| A05 Security Misconfiguration | Fixed một phần | Thêm CSP meta, referrer policy, frame-ancestors. Với GitHub Pages không thay được HTTP headers đầy đủ. |
| A06 Vulnerable and Outdated Components | Open | Còn dùng CDN `unpkg.com/lucide`. Nên vendor file icon hoặc pin version cụ thể. |
| A07 Identification and Authentication Failures | Fixed tạm | Admin có PIN gate sessionStorage. Production cần đăng nhập server-side, rate limit, audit log. |
| A08 Software and Data Integrity Failures | Open một phần | CDN bên ngoài chưa có SRI. Nên bỏ CDN hoặc pin SRI. |
| A09 Security Logging and Monitoring Failures | N/A hiện tại | Static site không có server logging. Cần backend/logging khi có đăng nhập thật. |
| A10 SSRF | N/A | Không có server-side request. |

## Fix đã thực hiện

- Ẩn link Admin khỏi menu công khai trên `index.html`.
- Thêm CSP meta cho `index.html` và `admin.html`.
- Thêm `frame-ancestors 'none'` trong CSP để giảm clickjacking.
- Thêm `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
- Thêm `referrer` policy.
- Thêm `noindex, nofollow, noarchive` cho Admin.
- Thêm PIN gate cho `admin.html` bằng `sessionStorage`.
- Chuẩn hóa và giới hạn dữ liệu Admin trước khi lưu vào localStorage.
- Chỉ cho banner link nội bộ dạng `#section` hoặc `./file`.
- Chỉ cho ảnh `http/https`; URL không hợp lệ fallback về ảnh mặc định.
- Giới hạn số lượng item trong danh sách specs/badges.
- Giới hạn độ dài input bằng HTML và JavaScript.

## Rủi ro còn lại

1. **Admin PIN client-side không phải xác thực thật**  
   Người dùng kỹ thuật vẫn có thể xem mã nguồn và bypass. Đây chỉ là lớp bảo vệ nhẹ cho static site.

2. **LocalStorage không phải database bảo mật**  
   Dữ liệu chỉ nằm trên trình duyệt hiện tại. Không dùng để lưu mật khẩu, token, thông tin khách hàng thật.

3. **CDN bên ngoài**  
   `https://unpkg.com/lucide...` cần được thay bằng bản local hoặc pin version + SRI.

4. **Không có audit log/rate limit**  
   Static site không có server, không có nhật ký truy cập, không có giới hạn đăng nhập.

## Khuyến nghị production

- Chuyển Admin sang backend thật, ví dụ Firebase Auth/Supabase/Auth0 hoặc backend Node/PHP.
- Dùng role `admin/editor/viewer`.
- Lưu dữ liệu trong database có rule phân quyền.
- Bật HTTP security headers ở Cloudflare/Netlify/Vercel:
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`
- Bỏ CDN icon hoặc tự host dependency.
- Thêm logging cho thao tác Admin: tạo/sửa/xóa sản phẩm, sửa banner, reset dữ liệu.

## Admin PIN hiện tại

PIN mặc định: `2468`

Chỉ dùng để demo. Không sử dụng PIN này cho môi trường production.
