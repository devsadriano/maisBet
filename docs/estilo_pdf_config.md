# 🎨 Diretrizes de Estilo e Layout do +BET (Para Geração de PDF)

Este arquivo contém as especificações de design do sistema **+BET** para serem fornecidas a uma inteligência artificial (como o Gemini) para estilizar e exportar o manual [manual_jogador.md](file:///c:/Antigravity/+BET/docs/manual_jogador.md) em um formato PDF altamente profissional e visualmente idêntico à plataforma.

---

## 📋 Instruções de Prompt para o Gemini (Copie e cole este prompt junto com o manual)

> **PROMPT PARA O GEMINI:**
> *"Por favor, utilize o conteúdo do arquivo `manual_jogador.md` e crie um documento PDF (ou o código HTML/CSS necessário para gerar o PDF via navegador) aplicando a identidade visual descrita nas diretrizes de layout do +BET abaixo. O design deve parecer uma extensão da própria plataforma: moderno, premium, com cantos arredondados generosos, fontes esportivas e contrastes nítidos. Dê preferência ao **Dark Mode** como tema principal do documento, pois é a identidade mais premium do sistema."*

---

## 🎨 Design Tokens Oficiais (+BET)

### 1. Paleta de Cores (Temas)

Você pode escolher gerar o PDF no **Tema Escuro (Recomendado)** ou **Tema Claro**.

#### 🌌 Tema Escuro (Identidade Principal do +BET)
*   **Fundo Principal (Background):** `#0d0d0d` (Preto puro)
*   **Fundo de Cards/Containers:** `#161616` (Cinza muito escuro/chumbo)
*   **Texto Principal:** `#f1f5f9` (Slate-100 / Branco suave)
*   **Texto Secundário:** `#cbd5e1` (Slate-300 / Cinza claro)
*   **Texto Muted/Legendas:** `#64748b` (Slate-500)
*   **Cor Destaque Principal (Brand):** `#00e87a` (Verde Neon / Esmeralda Vibrante)
*   **Bordas:** `rgba(255, 255, 255, 0.07)` (Translúcido suave)
*   **Destaque Gold (Avisos/Premiação):** `#facc15` (Amarelo Ouro)
*   **Destaque Danger (Erros):** `#f87171` (Vermelho Suave)

#### ☀️ Tema Claro
*   **Fundo Principal (Background):** `#f1f5f9` (Cinza claro azulado)
*   **Fundo de Cards/Containers:** `#ffffff` (Branco puro)
*   **Texto Principal:** `#0f172a` (Slate-900 / Preto azulado)
*   **Texto Secundário:** `#334155` (Slate-700)
*   **Texto Muted/Legendas:** `#64748b` (Slate-500)
*   **Cor Destaque Principal (Brand):** `#15803d` (Verde Esmeralda Profundo)
*   **Bordas:** `rgba(15, 23, 42, 0.08)`
*   **Destaque Gold:** `#b45309` (Amber-700)
*   **Destaque Danger:** `#b91c1c` (Vermelho Profundo)

---

### 2. Tipografia
*   **Títulos Principais (H1, H2, H3):** Fonte **Bebas Neue** (ou similar sem serifa de estilo condensado/esportivo).
    *   *Estilo:* Caixa alta (UPPERCASE), espaçamento de letras largo (letter-spacing), visual impactante.
*   **Corpo do Texto (Parágrafos, Listas):** Fonte **Inter** (ou similar sem serifa geométrica como Roboto, Arial, Helvetica).
    *   *Estilo:* Leitura limpa, peso leve/médio (300 a 500).

---

### 3. Elementos Visuais e Bordas
*   **Arredondamento (Border Radius):**
    *   Cards, Imagens e Caixas de Destaque: `24px` (ou `1.5rem`).
    *   Botões e Inputs: `16px` (ou `1rem`).
*   **Sombras (Box Shadow):**
    *   Efeito de elevação suave: `0 4px 24px rgba(0,0,0,0.4)` no Dark Mode.
*   **Efeito Glassmorphism (Vidro):**
    *   Bordas finas de `1px` em `rgba(255, 255, 255, 0.08)` com leve transparência no fundo para dar profundidade.

---

## 📄 Código CSS Pronto para Geração do PDF (HTML-to-PDF / Print CSS)

Se você for gerar o PDF usando uma ferramenta que aceita HTML/CSS, utilize o código abaixo para estilizar a página:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Bebas+Neue&display=swap');

@page {
  size: A4;
  margin: 20mm;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: #0d0d0d;
  color: #f1f5f9;
  line-height: 1.6;
  font-size: 11pt;
}

/* Títulos Premium */
h1, h2, h3 {
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #ffffff;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

h1 {
  font-size: 28pt;
  border-bottom: 2px solid #00e87a;
  padding-bottom: 10px;
  margin-top: 0;
}

h2 {
  font-size: 20pt;
  color: #00e87a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 5px;
}

h3 {
  font-size: 14pt;
  color: #cbd5e1;
}

/* Links */
a {
  color: #00e87a;
  text-decoration: none;
}

/* Sumário / Tabelas */
ul, ol {
  padding-left: 20px;
  margin-bottom: 1.5em;
}

li {
  margin-bottom: 8px;
}

/* Cards de Informação e Destaques (BaseCard +BET) */
.card, blockquote {
  background-color: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 20px;
  margin: 1.5em 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

/* Caixas de Alerta Customizadas (Markdown alerts) */
.alert-tip {
  border-left: 4px solid #00e87a;
  background-color: rgba(0, 232, 122, 0.05);
}

.alert-warning {
  border-left: 4px solid #facc15;
  background-color: rgba(250, 204, 21, 0.05);
  color: #facc15;
}

.alert-important {
  border-left: 4px solid #f87171;
  background-color: rgba(248, 113, 113, 0.05);
}

/* Estilo de Passos (Tabelas e Listas Ordenadas) */
ol li::marker {
  color: #00e87a;
  font-weight: bold;
}

/* Tabelas */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  background-color: #161616;
  border-radius: 12px;
  overflow: hidden;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

th {
  background-color: rgba(0, 232, 122, 0.1);
  color: #00e87a;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 0.1em;
  font-size: 12pt;
}

td {
  color: #cbd5e1;
}

/* Linha Horizontal */
hr {
  border: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 2em 0;
}

/* Destaque de Teclas / Códigos */
code {
  font-family: monospace;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  color: #00e87a;
}
```
