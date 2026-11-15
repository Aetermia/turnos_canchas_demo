# Direction

**Reading this as:** a public booking site plus light staff panel for a neighbourhood sports club, for players booking on a phone, in a warm editorial language, dial ENERGY 2 / RHYTHM 2 / MOTION 1.

## Why this identity (one line each)

- **Paper over white** (`#f7f4ee`): a club feels like printed paper and chalk, not a SaaS dashboard. Pure white is the AI default.
- **Deep green as structure** (`#12503c`): the colour of a court at dusk. Holds headers, navigation and confirmed states, so it is never spent on decoration.
- **Terracotta as the only accent** (`#a9491f`): the brick dust of a clay court. Its single job is the reservation action and the one motif rule, so it stays meaningful.
- **Bricolage Grotesque for display**: slightly irregular letterforms read as made by a human sign painter rather than a template. Used for headings, prices and times, never for body copy.
- **Instrument Sans for body**: tall x-height and compact widths keep hour and price tables legible at 13px on a 360px screen.
- **Court line as motif**: a 1px terracotta rule with square end marks, drawn from the object the product sells. It repeats above section titles and inside the calendar, and it replaces the stock-photo hero we do not have.
- **No dark mode**: the identity is daylight on paper. A toggle would be a second brand, not a feature. Template owners can change the tokens instead.
- **MOTION 1**: hover and focus transitions only. The site runs on shared hosting with no build-time animation library.

## Template mechanics

Everything visual hangs off these tokens in `resources/css/app.css`:

```
--color-paper  --color-ink  --color-brand  --color-accent  --color-line
--font-display --font-body  --radius-*
```

`establishment_settings.accent_color` overrides `--color-accent` at runtime, and `logo_path` replaces the wordmark. A new client is a new token set plus a logo, not a new stylesheet.

## Assets

- Logo: text wordmark from the establishment name until a real logo exists (no invented mark).
- Photos: none shipped. Court diagrams are line art, labelled as the slot where real photos go.
- Numbers, testimonials and team: none. Demo data comes from the seeder and is labelled as demo.
