import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HomePage } from "@/features/home";
import { HowItWorksPage } from "@/features/how-it-works";
import { MixingPage, SessionLookupPage } from "@/features/mixing";
import { FeesPage } from "@/features/fees";
import { FAQPage } from "@/features/faq";
import { ContactPage } from "@/features/contact";
import { NewSessionPage } from "@/features/session";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/mixing" element={<MixingPage />} />
          <Route path="/session" element={<SessionLookupPage />} />
          <Route path="/new-session" element={<NewSessionPage />} />
          <Route path="/fees" element={<FeesPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
