# SharePay Hub

Mô-đun quỹ chung và chia tiền đề xuất tích hợp vào VCB Digibank. Đây là bản demo của Nhóm 1, môn Marketing ngân hàng (UIT). Mọi số liệu và tên trong app đều là dữ liệu giả, app hiển thị tên "Digibank (DEMO)".

## Cấu trúc

```
public/index.html   Toàn bộ app (giao diện, dữ liệu mẫu, kịch bản demo 10 bước)
api/state.js        API lưu trạng thái theo "phòng" vào Upstash Redis
test/api.test.js    Kiểm thử API (npm test)
test/devserver.js   Máy chủ chạy thử trên máy, giả lập Vercel và Redis
vercel.json         Cấu hình Vercel
```

## Cơ sở dữ liệu và phòng đồng bộ

- Không vào phòng: dữ liệu lưu trong trình duyệt (localStorage) như trước.
- Vào phòng (ví dụ `https://<ten-app>.vercel.app/?phong=nhom1`): dữ liệu lưu lên Upstash Redis, mọi máy mở cùng link thấy cùng một dữ liệu, cập nhật khoảng 2,5 giây một lần. Mỗi máy giữ tài khoản đang chọn của riêng mình, nên có thể một máy đóng vai Nguyên gửi yêu cầu, máy khác đóng vai Thịnh và Vy duyệt.
- Vào phòng ngay trong app: mở Bảng điều khiển demo (nút bánh răng trên điện thoại), mục "Phòng đồng bộ".
- Dữ liệu mỗi phòng giữ 30 ngày. Nếu chưa kết nối cơ sở dữ liệu, app vẫn chạy bình thường và báo "Chưa kết nối cơ sở dữ liệu".

## Triển khai lên Vercel

1. Đẩy thư mục này lên một repo GitHub.
2. Vào vercel.com, chọn Add New, Project, Import repo vừa tạo. Framework Preset để "Other", không cần đổi gì khác, bấm Deploy.
3. Trong project trên Vercel, mở tab Storage, chọn Create Database, chọn Upstash (Redis), gói Free, rồi Connect vào project. Vercel tự thêm biến môi trường `KV_REST_API_URL` và `KV_REST_API_TOKEN`.
4. Vào tab Deployments, bấm Redeploy để app nhận biến môi trường.
5. Kiểm tra: mở `https://<ten-app>.vercel.app/api/state`, thấy `{"ok":true,"db":true}` là đã nối cơ sở dữ liệu.

Có thể dùng Upstash tạo trực tiếp trên upstash.com, khi đó tự thêm hai biến `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN` vào Settings, Environment Variables của project.

## Chạy thử trên máy

```
npm test                 # kiểm thử API
node test/devserver.js   # mở http://127.0.0.1:8788/?phong=nhom1
```
