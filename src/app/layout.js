export const metadata = {
  title: "TileQuote Pro",
  description: "Tile Quotation & Billing System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}