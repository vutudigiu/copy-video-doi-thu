import "./globals.css";

export const metadata = {
  title: "Copy Lời Thoại Video Đối Thủ",
  description: "Sao chép toàn bộ lời thoại từ Facebook Reel thành văn bản tiếng Việt.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
