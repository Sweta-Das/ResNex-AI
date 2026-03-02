import "./globals.css";

export const metadata = {
  title: "STEM Collaborative Workspace",
  description: "Built for AI Hackathon",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning stops Grammarly from breaking the page */}
      <body suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}