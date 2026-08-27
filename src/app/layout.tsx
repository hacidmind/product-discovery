import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Product Discovery Agent",
  description: "AI-powered product discovery for Product Managers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="h-full">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("theme")==="light")document.documentElement.classList.add("light")}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}