# Como funciona Tailwind + CSS Variables (shadcn/ui)

## 📚 Explicação

O **shadcn/ui** usa uma abordagem híbrida que combina **CSS Custom Properties** (variáveis CSS) com **Tailwind CSS**:

### 1. **CSS Custom Properties** (`globals.css`)
Define as variáveis CSS com valores HSL:

```css
:root {
  --primary: 334 80% 60%;  /* #ea4c89 em HSL (sem hsl()) */
  --neutral-light-gray: 240 4% 86%;  /* #dbdbde */
}
```

**Por que HSL sem a função `hsl()`?**
- As variáveis CSS armazenam apenas os valores (H S L)
- O Tailwind adiciona `hsl()` quando usa: `hsl(var(--primary))`

### 2. **Tailwind Config** (`tailwind.config.ts`)
Referencia as variáveis CSS usando `hsl(var(--nome-var))`:

```typescript
colors: {
  primary: {
    DEFAULT: 'hsl(var(--primary))',  // Tailwind adiciona hsl() aqui
  },
  neutral: {
    'light-gray': 'hsl(var(--neutral-light-gray))',
  }
}
```

### 3. **Uso no código** (JSX/TSX)
Usa classes Tailwind normalmente:

```tsx
<h1 className="text-primary">  {/* Gera: color: hsl(334, 80%, 60%) */}
<button className="bg-primary">  {/* Gera: background-color: hsl(334, 80%, 60%) */}
<div className="border-neutral-light-gray">  {/* Gera: border-color: hsl(240, 4%, 86%) */}
```

## 🔄 Fluxo Completo

```
globals.css (define variável)
  ↓
  --primary: 334 80% 60%
  ↓
tailwind.config.ts (referencia variável)
  ↓
  primary: 'hsl(var(--primary))'
  ↓
Componente React (usa classe Tailwind)
  ↓
  className="text-primary"
  ↓
CSS gerado pelo Tailwind
  ↓
  color: hsl(334, 80%, 60%)
```

## ✅ Vantagens desta Abordagem

1. **Temas dinâmicos**: Muda `--primary` no CSS, todos os componentes atualizam
2. **Dark mode**: Basta mudar variáveis no `.dark { }`
3. **Consistência**: Uma fonte de verdade (CSS variables)
4. **Padrão shadcn/ui**: É assim que o shadcn/ui funciona

## 🎯 Resumo

- **CSS Variables** = Armazena valores (HSL sem função)
- **Tailwind Config** = Referencia com `hsl(var(--nome))`
- **Classes Tailwind** = Usa normalmente: `text-primary`, `bg-primary`, etc.

**Não estamos aplicando direto no CSS!** Estamos usando o padrão shadcn/ui que combina CSS variables + Tailwind.
