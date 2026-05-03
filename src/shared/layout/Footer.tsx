import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { navLinks } from "@/config/navigation";
import { DISCLAIMERS } from "@/shared/content";

const productLinks = navLinks.filter((l) => ["/", "/how-it-works", "/mixing", "/fees"].includes(l.to));
const supportLinks = navLinks.filter((l) => ["/faq", "/contact"].includes(l.to));

const Footer = () => (
  <footer className="border-t border-border bg-card/50 py-12" aria-labelledby="footer-heading">
    <h2 id="footer-heading" className="sr-only">Rodapé</h2>
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 font-mono text-lg font-bold mb-3">
            <Shield aria-hidden="true" className="h-5 w-5 text-primary" />
            <span className="text-gradient-green">CryptoMix</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Aplicação de demonstração que ilustra um fluxo de criação de sessão para distribuição de valores entre múltiplos endereços. Conteúdo educacional.
          </p>
        </div>
        <nav aria-label="Produto">
          <h3 className="font-mono text-sm font-semibold mb-3 text-foreground">Produto</h3>
          <ul className="flex flex-col gap-2">
            {productLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Suporte">
          <h3 className="font-mono text-sm font-semibold mb-3 text-foreground">Suporte</h3>
          <ul className="flex flex-col gap-2">
            {supportLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h3 className="font-mono text-sm font-semibold mb-3 text-foreground">Aviso</h3>
          <p className="text-xs text-muted-foreground">{DISCLAIMERS.responsibility}</p>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CryptoMix — ambiente de demonstração. Todos os direitos reservados.
      </div>
    </div>
  </footer>
);

export default Footer;
