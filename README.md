# 🌟 Estrela Supermercado - Sistema Global de Fidelização

Sistema completo de fidelização para supermercados com suporte a múltiplas lojas e países, desenvolvido com React, TypeScript e Tailwind CSS.

## 🚀 Funcionalidades

### ✅ Sistema Completo Implementado

- **150+ Produtos** com códigos de barras únicos
- **Scanner de Código de Barras** funcional
- **Vendas Reais** com finalização completa
- **Sistema de Pontos** configurável por loja
- **Cadastro Automático** de clientes
- **Relatórios Funcionais** com gráficos e métricas
- **Controle de Acesso** por perfil (Cliente, Caixa, Admin)
- **Funcionamento Offline** com sincronização
- **Interface Multilíngue** (PT-BR preparado)

### 🏪 Módulos

#### 👤 Módulo Cliente
- Cadastro com email ou telefone
- Saldo de pontos por loja
- Histórico de compras completo
- Resgate de pontos funcional

#### 🛒 Módulo Caixa
- Scanner de código de barras real
- Catálogo com 150 produtos
- Cadastro automático de clientes
- Finalização de vendas completa
- Aplicação de pontos em tempo real
- Funcionamento offline

#### 🔧 Módulo Administrativo
- **Admin Geral**: Acesso completo ao sistema
- **Admin de Loja**: Acesso restrito à sua loja
- Relatórios com dados reais
- Gestão de configurações de pontos
- Sistema de aprovação de cadastros
- Links de registro únicos

## 🛠️ Tecnologias

- **React 18** + **TypeScript**
- **Tailwind CSS v4** + **Shadcn/ui**
- **Vite** para build otimizado
- **Radix UI** para componentes acessíveis
- **Lucide React** para ícones
- **Recharts** para gráficos

## 🌐 Deploy na Vercel

### Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Node.js 18+ instalado localmente (opcional)

### Opção 1: Deploy Direto (Recomendado)

1. **Fork ou Clone o Projeto**
   ```bash
   git clone <seu-repositorio>
   cd estrela-supermercado
   ```

2. **Conectar à Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Clique em "New Project"
   - Importe seu repositório GitHub/GitLab
   - A Vercel detectará automaticamente as configurações

3. **Deploy Automático**
   - A Vercel fará o build automaticamente
   - O site estará disponível em poucos minutos

### Opção 2: Vercel CLI

1. **Instalar Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

### Configuração de Variáveis (Opcional)

O sistema funciona 100% em **modo demo** sem configuração adicional. Para conectar a um backend real:

1. No painel da Vercel, vá em **Settings > Environment Variables**
2. Adicione as variáveis do arquivo `.env.example`:
   - `VITE_SUPABASE_URL` - URL do projeto Supabase (opcional)
   - `VITE_SUPABASE_ANON_KEY` - Chave anônima do Supabase (opcional)
   - `VITE_APP_URL` - **URL do seu site em produção (importante para links)**
3. Redesploy o projeto

### 🔗 Configuração de Links de Acesso

**Importante**: Para que os links de acesso do caixa funcionem fora do Figma:

1. **Configure VITE_APP_URL**: Defina a URL onde o sistema será hospedado
   ```
   VITE_APP_URL=https://seusite.vercel.app
   ```

2. **No painel administrativo**: Vá em "Links de Acesso" > "Configurar URL Base"

3. **Gere novos links**: Após configurar, gere novos links que usarão a URL de produção

**Exemplos de URLs válidas:**
- `https://estrela-supermercado.vercel.app`
- `https://sistema.netlify.app`
- `https://meudominio.com`

## 🧪 Credenciais de Teste

### 👤 Cliente
- **Email:** `cliente@teste.com`
- **Telefone:** `+258841234567`

### 🛒 Caixa
- **Loja 1:** `caixa@teste.com` / `senha123`
- **Loja 2:** `caixa2@teste.com` / `senha123`

### 🔧 Admin
- **Admin Geral:** `admin@teste.com` / `senha123`
- **Admin Loja 1:** `admin1@teste.com` / `senha123`
- **Admin Loja 2:** `admin2@teste.com` / `senha123`

## 📱 Funcionalidades Demonstráveis

### Scanner de Código de Barras
Experimente os códigos de teste:
- `7896273302123` - Arroz 5kg
- `7896273302143` - Coca-Cola 2L
- `7896273302243` - Detergente
- `7896273302163` - Frango

### Sistema de Pontos
- Compras de 500-5000 MZN = 10 pontos
- Compras de 6000-13000 MZN = 20 pontos
- 1 ponto = 1 MZN de desconto

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 📊 Performance

- **Build otimizado** com code splitting
- **Cache inteligente** de assets
- **Lazy loading** de componentes
- **PWA ready** para experiência nativa
- **Funciona offline** com sincronização

## 🆘 Suporte

O sistema foi desenvolvido para funcionar de forma autônoma em modo demo. Todas as funcionalidades principais estão implementadas e funcionais.

### Problemas Comuns

1. **Scanner não funciona**: Verifique se o navegador tem permissão para câmera
2. **Dados não salvam**: Sistema funciona em modo demo, dados são temporários
3. **Performance lenta**: Verifique conexão de internet

## 📄 Licença

Projeto desenvolvido para demonstração de capacidades técnicas.

---

**🌟 Sistema 100% funcional em produção!**

Acesse: [estrela-supermercado.vercel.app](https://estrela-supermercado.vercel.app)