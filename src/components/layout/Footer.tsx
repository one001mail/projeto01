import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

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
            {["/", "/how-it-works", "/mixing", "/fees"].map((path) => (
              <Link key={path} to={path} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {path === "/" ? "Home" : path.slice(1).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-mono text-sm font-semibold mb-3 text-foreground">Support</h4>
          <div className="flex flex-col gap-2">
            <Link to="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link>
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
