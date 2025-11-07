# 🎨 Okê Sports Design System
*Inspirado no Dribbble.com (2023-2024)*

## Tipografia

### Fontes
- **Headings/Títulos:** Source Serif Pro
- **Body/UI:** Inter (similar ao Mona Sans usado pelo Dribbble)
- **Monospace:** JetBrains Mono (para códigos/números)

### Escala Tipográfica
```
Display: 48px / 3rem (weight: 700)
H1: 36px / 2.25rem (weight: 700)
H2: 30px / 1.875rem (weight: 600)
H3: 24px / 1.5rem (weight: 600)
H4: 20px / 1.25rem (weight: 600)
Body Large: 18px / 1.125rem (weight: 400)
Body: 16px / 1rem (weight: 400)
Body Small: 14px / 0.875rem (weight: 400)
Caption: 12px / 0.75rem (weight: 400)
```

---

## Cores (inspirado em Dribbble)

### Primárias
```css
--pink-primary: #ea4c89;      /* Rosa Dribbble */
--pink-dark: #c9357a;
--pink-light: #f082a8;

--dark: #0d0c22;              /* Quase preto */
--gray-900: #1a1a2e;
--gray-800: #2d2d44;
--gray-700: #4a4a5e;
--gray-600: #6e6e82;
--gray-500: #9191a3;
--gray-400: #b4b4c2;
--gray-300: #d7d7e1;
--gray-200: #eaeaf0;
--gray-100: #f5f5f7;
--white: #ffffff;
```

### Secundárias (Accents)
```css
--blue: #4353ff;
--green: #00d68f;
--orange: #ff6b35;
--purple: #7b68ee;
--yellow: #ffc107;
```

### Estados
```css
--success: #00d68f;
--warning: #ffc107;
--error: #ff4757;
--info: #4353ff;
```

---

## Espaçamento (Sistema 4px)

```
--space-1: 4px     (0.25rem)
--space-2: 8px     (0.5rem)
--space-3: 12px    (0.75rem)
--space-4: 16px    (1rem)
--space-5: 20px    (1.25rem)
--space-6: 24px    (1.5rem)
--space-8: 32px    (2rem)
--space-10: 40px   (2.5rem)
--space-12: 48px   (3rem)
--space-16: 64px   (4rem)
--space-20: 80px   (5rem)
--space-24: 96px   (6rem)
```

---

## Border Radius

```
--radius-sm: 6px
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 24px
--radius-full: 9999px
```

---

## Sombras

```css
/* Dribbble usa sombras sutis e suaves */
--shadow-sm: 0 1px 2px 0 rgba(13, 12, 34, 0.05);
--shadow-md: 0 4px 6px -1px rgba(13, 12, 34, 0.08);
--shadow-lg: 0 10px 15px -3px rgba(13, 12, 34, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(13, 12, 34, 0.12);
--shadow-2xl: 0 25px 50px -12px rgba(13, 12, 34, 0.15);
```

---

## Botões (estilo Dribbble)

### Primary (Rosa)
```css
background: var(--pink-primary);
color: white;
padding: 12px 24px;
border-radius: 12px;
font-weight: 600;
shadow: 0 4px 12px rgba(234, 76, 137, 0.2);

hover: background: var(--pink-dark);
active: transform: scale(0.98);
```

### Secondary (Outline)
```css
background: transparent;
border: 2px solid var(--gray-300);
color: var(--dark);
padding: 12px 24px;
border-radius: 12px;
font-weight: 600;

hover: border-color: var(--pink-primary);
hover: color: var(--pink-primary);
```

### Ghost
```css
background: transparent;
color: var(--gray-700);
padding: 12px 16px;

hover: background: var(--gray-100);
```

---

## Cards (estilo Dribbble)

```css
background: white;
border-radius: 16px;
padding: 24px;
border: 1px solid var(--gray-200);
box-shadow: var(--shadow-sm);

hover: box-shadow: var(--shadow-lg);
hover: transform: translateY(-2px);
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Inputs

```css
background: white;
border: 2px solid var(--gray-200);
border-radius: 12px;
padding: 12px 16px;
font-size: 16px;
color: var(--dark);

focus: border-color: var(--pink-primary);
focus: box-shadow: 0 0 0 3px rgba(234, 76, 137, 0.1);

placeholder: color: var(--gray-500);
```

---

## Layout

### Container
```
max-width: 1280px (xl)
padding: 0 24px (mobile)
padding: 0 40px (desktop)
```

### Grid
```
columns: 12
gap: 24px
```

---

## Animações (Dribbble usa animações suaves)

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Micro-interações
- Hover: scale(1.02) + shadow
- Click: scale(0.98)
- Cards: translateY(-4px) on hover
- Fade in: opacity 0 → 1

---

## Ícones
- **Biblioteca:** Lucide React (similar ao que Dribbble usa)
- **Tamanho padrão:** 20px
- **Stroke width:** 2px
