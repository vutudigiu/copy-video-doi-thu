import "./globals.css";

export const metadata = {
  title: "Copy Video Đối Thủ — Video Intelligence",
  description: "Tải video, trích lời thoại và tái tạo cấu trúc nội dung từ Facebook Reel.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
