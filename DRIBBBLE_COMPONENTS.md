# 🎨 Componentes Dribbble - Análise Completa

## Componentes identificados no Dribbble.com

### 1. **Badges & Pills**
```tsx
// Dribbble usa badges arredondadas com cores sutis
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-50 text-pink-700">
  Pro
</span>

// Status badges
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
  Available
</span>
```

**Cores Dribbble para badges:**
- Pro: `bg-pink-50 text-pink-700`
- Team: `bg-purple-50 text-purple-700`
- Hiring: `bg-green-50 text-green-700`
- New: `bg-blue-50 text-blue-700`

---

### 2. **Avatar com status indicator**
```tsx
<div className="relative">
  <img
    src="/avatar.jpg"
    className="w-10 h-10 rounded-full ring-2 ring-white"
  />
  {/* Status indicator */}
  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
</div>
```

**Padrões Dribbble:**
- Avatar arredondado com `ring-2 ring-white`
- Status: Verde (online), Cinza (offline)
- Tamanhos: 24px, 32px, 40px, 48px, 64px

---

### 3. **Dropdown Menu (estilo Dribbble)**
```tsx
<div className="w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2">
  <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3">
    <UserIcon className="w-4 h-4" />
    <span>View Profile</span>
  </button>
  <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3">
    <SettingsIcon className="w-4 h-4" />
    <span>Settings</span>
  </button>
  <div className="h-px bg-gray-100 my-2" />
  <button className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3">
    <LogOutIcon className="w-4 h-4" />
    <span>Sign out</span>
  </button>
</div>
```

**Características:**
- `rounded-2xl` (16px)
- `shadow-xl` suave
- Hover: `bg-gray-50` (não usa scale)
- Ícones 16px ao lado do texto
- Divider: `h-px bg-gray-100`

---

### 4. **Tooltip (Dribbble style)**
```tsx
<div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg whitespace-nowrap">
  Like this shot
  {/* Arrow */}
  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
</div>
```

**Padrões:**
- Fundo escuro (`bg-gray-900`)
- Texto branco pequeno (`text-xs`)
- Arrow/pointer com `rotate-45`
- Padding compacto

---

### 5. **Search Bar (Dribbble header)**
```tsx
<div className="relative w-full max-w-md">
  <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
  <input
    type="text"
    placeholder="Search..."
    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm placeholder:text-gray-400 focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-pink-100 transition-all"
  />
</div>
```

**Características:**
- Ícone dentro do input (esquerda)
- `bg-gray-50` → `bg-white` no focus
- `ring-4 ring-pink-100` no focus
- `rounded-xl` (12px)

---

### 6. **Toggle/Switch (Dribbble settings)**
```tsx
<button className="relative w-11 h-6 bg-gray-200 rounded-full transition-colors duration-300 data-[enabled]:bg-pink-500">
  <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 data-[enabled]:translate-x-5" />
</button>
```

**Padrões:**
- Transição suave (300ms)
- Cor: `bg-pink-500` quando ativo
- Shadow na bolinha
- `rounded-full`

---

### 7. **Shot Card (cartão de projeto)**
```tsx
<div className="group cursor-pointer">
  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
    <img
      src="/shot.jpg"
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
    {/* Overlay no hover */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <button className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30">
            <HeartIcon className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium">124</span>
        </div>
        <div className="flex items-center gap-2">
          <EyeIcon className="w-5 h-5" />
          <span className="text-sm">2.3k</span>
        </div>
      </div>
    </div>
  </div>

  {/* Info abaixo do card */}
  <div className="mt-3 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <img src="/avatar.jpg" className="w-6 h-6 rounded-full" />
      <span className="text-sm font-medium text-gray-700">Designer Name</span>
      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-pink-50 text-pink-700">Pro</span>
    </div>
    <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
      <BookmarkIcon className="w-5 h-5 text-gray-400" />
    </button>
  </div>
</div>
```

**Características importantes:**
- Hover: `scale-105` na imagem (não no card todo)
- Overlay com gradient `from-black/60`
- Backdrop blur nos botões
- Transições longas (500ms na imagem)
- Avatar pequeno (24px) com nome

---

### 8. **Filter Pills/Chips**
```tsx
<div className="flex items-center gap-2 flex-wrap">
  <button className="px-4 py-2 bg-pink-500 text-white rounded-full text-sm font-medium hover:bg-pink-600 transition-colors">
    All
  </button>
  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
    Web Design
  </button>
  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
    Mobile
  </button>
</div>
```

**Padrões:**
- Ativo: `bg-pink-500 text-white`
- Inativo: `bg-gray-100 text-gray-700`
- `rounded-full` sempre
- Padding horizontal maior que vertical

---

### 9. **Stats/Metrics (profile page)**
```tsx
<div className="flex items-center gap-8">
  <div>
    <div className="text-2xl font-bold text-gray-900">1.2k</div>
    <div className="text-sm text-gray-500">Followers</div>
  </div>
  <div>
    <div className="text-2xl font-bold text-gray-900">847</div>
    <div className="text-sm text-gray-500">Following</div>
  </div>
  <div>
    <div className="text-2xl font-bold text-gray-900">156</div>
    <div className="text-sm text-gray-500">Shots</div>
  </div>
</div>
```

---

### 10. **Loading Skeleton (Dribbble style)**
```tsx
<div className="animate-pulse">
  <div className="aspect-[4/3] bg-gray-200 rounded-2xl" />
  <div className="mt-3 flex items-center gap-2">
    <div className="w-6 h-6 bg-gray-200 rounded-full" />
    <div className="h-4 bg-gray-200 rounded w-32" />
  </div>
</div>
```

---

## 🎨 Paleta de Cores Completa

```css
/* Primária (Rosa Dribbble) */
--pink-50: #fdf2f8;
--pink-100: #fce7f3;
--pink-200: #fbcfe8;
--pink-300: #f9a8d4;
--pink-400: #f472b6;
--pink-500: #ea4c89;  /* COR PRINCIPAL */
--pink-600: #db2777;
--pink-700: #be185d;

/* Cinzas */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

---

## ⚡ Micro-interações Dribbble

### Hover Effects comuns:
1. **Cards:** `hover:scale-105` (imagem) + overlay fade in
2. **Buttons:** `hover:-translate-y-0.5` + shadow increase
3. **Links:** `hover:text-pink-500` transition
4. **Icons:** `hover:rotate-12` ou `hover:scale-110`

### Transições:
```css
/* Rápida (hover simples) */
transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

/* Normal (botões, links) */
transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);

/* Suave (imagens, cards) */
transition: all 500ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 📐 Grid e Layout

### Grid de Shots
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Shot cards */}
</div>
```

### Espaçamento padrão:
- Gap entre cards: `24px` (gap-6)
- Padding lateral: `40px` (px-10)
- Padding vertical: `48px` (py-12)

---

## 🔤 Tipografia Completa

```css
/* Headings (Source Serif) */
.heading-xl { font-size: 48px; line-height: 1.2; font-weight: 700; }
.heading-lg { font-size: 36px; line-height: 1.2; font-weight: 700; }
.heading-md { font-size: 24px; line-height: 1.3; font-weight: 700; }
.heading-sm { font-size: 20px; line-height: 1.4; font-weight: 600; }

/* Body (Inter) */
.body-lg { font-size: 18px; line-height: 1.6; font-weight: 400; }
.body { font-size: 16px; line-height: 1.5; font-weight: 400; }
.body-sm { font-size: 14px; line-height: 1.5; font-weight: 400; }
.caption { font-size: 12px; line-height: 1.4; font-weight: 400; }
```
