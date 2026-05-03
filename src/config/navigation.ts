export interface NavItem {
  to: string;
  label: string;
}

export const navLinks: NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/mixing", label: "Mix" },
  { to: "/session", label: "Status" },
  { to: "/fees", label: "Fees" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];
