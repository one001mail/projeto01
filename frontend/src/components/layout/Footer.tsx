import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { navLinks } from "@/config/navigation";

const Footer = () => (
  <footer className="border-t border-border bg-card/50 py-12">
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 font-mono text-lg font-bold mb-3">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-gradient-green">CryptoMix</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Privacy-focused cryptocurrency mixing service. Your transactions, your business.
          </p>
        </div>
        <div>
          <h4 className="font-mono text-sm font-semibold mb-3 text-foreground">Navigation</h4>
          <div className="flex flex-col gap-2">
            {navLinks.filter((l) => ["/", "/how-it-works", "/mixing", "/fees"].includes(l.to)).map((link) => (
              <Link key={link.to} to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-mono text-sm font-semibold mb-3 text-foreground">Support</h4>
          <div className="flex flex-col gap-2">
            {navLinks.filter((l) => ["/faq", "/contact"].includes(l.to)).map((link) => (
              <Link key={link.to} to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-mono text-sm font-semibold mb-3 text-foreground">Disclaimer</h4>
          <p className="text-xs text-muted-foreground">
            This service is for educational and privacy purposes only. Users are responsible for compliance with local laws.
          </p>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CryptoMix. All rights reserved. This is a demonstration application.
      </div>
    </div>
  </footer>
);

export default Footer;
