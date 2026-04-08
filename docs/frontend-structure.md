# Frontend Structure

## Pages

| Page | Route | Objective | Components |
|------|-------|-----------|------------|
| Home | `/` | Landing page with value proposition | Hero, Features grid, Disclaimer |
| How It Works | `/how-it-works` | Explain mixing process step-by-step | Step cards, Warning notice |
| Mixing | `/mixing` | Mix session creation form | Form inputs, Fee calculator, Status flow |
| Fees | `/fees` | Transparent pricing display | Pricing table, Formula explanation |
| FAQ | `/faq` | Answer common questions | Accordion items |
| Contact | `/contact` | Contact form submission | Form with DB persistence |

## Folder Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx      # Navigation + mobile menu
│   │   ├── Footer.tsx      # Footer with links + disclaimer
│   │   └── Layout.tsx      # Wrapper with header/footer
│   └── ui/                 # shadcn components
├── pages/
│   ├── Index.tsx           # Home
│   ├── HowItWorks.tsx      # Process explanation
│   ├── Mixing.tsx          # Mix session form
│   ├── Fees.tsx            # Pricing table
│   ├── FAQ.tsx             # Frequently asked questions
│   ├── Contact.tsx         # Contact form
│   └── NotFound.tsx        # 404
├── hooks/                  # Custom hooks
├── integrations/
│   └── supabase/           # Auto-generated client
├── lib/                    # Utilities
└── App.tsx                 # Router configuration
```

## UX Behavior

- All pages show disclaimers about simulated nature
- Mixing page has multi-step status flow: idle → submitting → processing → complete
- Contact form persists to Supabase with success confirmation
- Error states show toast notifications
- Mobile-responsive with hamburger menu

## Error Prevention

- Input validation before submission
- Disabled states during processing
- Clear error messages via toast system
- Amount validation (> 0)
- Address minimum length validation
