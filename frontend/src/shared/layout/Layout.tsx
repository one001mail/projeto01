import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { GlobalDisclaimerBanner } from "@/shared/ui/GlobalDisclaimerBanner";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => (
  <div className="min-h-screen flex flex-col">
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
    >
      Pular para o conteúdo
    </a>
    <GlobalDisclaimerBanner />
    <Header />
    <main id="main-content" className="flex-1">
      {children}
    </main>
    <Footer />
  </div>
);

export default Layout;
