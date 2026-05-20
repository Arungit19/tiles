export const metadata = {
  title: "TileQuote Pro",
  description: "Tile Quotation & Billing System",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, boxSizing: "border-box" }}>{children}</body>
    </html>
  );
}