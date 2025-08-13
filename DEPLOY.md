# 🚀 Deploy e Configuração de Produção

## Como Configurar URLs para Produção (Independente do Figma)

### 🔗 Problema dos Links no Figma

Quando o sistema é executado no Figma, os links gerados usam a URL do ambiente Figma, que não funciona fora da plataforma. Para resolver isso, você precisa configurar a URL base para produção.

### ✅ Soluções

#### 1. **Configuração via Variável de Ambiente (Recomendado)**

Adicione a variável `VITE_APP_URL` com a URL do seu site:

**Para Vercel:**
1. Vá em Settings > Environment Variables
2. Adicione: `VITE_APP_URL` = `https://seusite.vercel.app`
3. Redesploy o projeto

**Para Netlify:**
1. Vá em Site settings > Environment variables
2. Adicione: `VITE_APP_URL` = `https://seusite.netlify.app`
3. Redesploy o projeto

**Para desenvolvimento local:**
```bash
# .env.local
VITE_APP_URL=http://localhost:5173
```

#### 2. **Configuração via Interface Admin**

1. Faça login como administrador
2. Vá em **"Links de Acesso"** > **"Configurar URL Base"**
3. Digite a URL do seu site: `https://seusite.com`
4. Clique em **"Salvar"**
5. Gere novos links - agora usarão a URL configurada

### 🎯 URLs de Exemplo

```
✅ Correto para produção:
https://estrela-supermercado.vercel.app/caixa/store001_123456789
https://meudominio.com/caixa/store001_123456789

❌ Errado (URL do Figma):
https://figma.com/files/.../caixa/store001_123456789
```

### 📋 Passo a Passo Completo

#### 1. **Deploy Inicial**
```bash
# Clone o projeto
git clone <repositorio>
cd estrela-supermercado

# Deploy na Vercel
vercel --prod

# Ou deploy no Netlify
npm run build
# Faça upload da pasta dist/
```

#### 2. **Configurar URL Base**
- **Opção A**: Configure `VITE_APP_URL` no painel da hospedagem
- **Opção B**: Use a interface admin após o deploy

#### 3. **Gerar Links de Produção**
1. Acesse seu site em produção
2. Login como admin: `admin@teste.com` / `senha123`
3. Vá em "Links de Acesso"
4. Configure a URL se necessário
5. Gere links para cada loja
6. Compartilhe os links com operadores

#### 4. **Testar Links**
- Abra o link em uma nova aba/navegador
- Deve levar para a tela de login do caixa
- Use: `caixa@teste.com` / `senha123`
- Deve funcionar normalmente

### 🔧 Verificação

**Como saber se está funcionando:**

1. **URL detectada** na interface admin mostra sua URL real
2. **Links gerados** começam com sua URL real
3. **Teste**: Abrir link em navegador anônimo funciona
4. **Badge da fonte** mostra "Variável de ambiente" ou "Configuração salva"

### 🆘 Solução de Problemas

#### **Links ainda mostram URL do Figma**
- Verifique se a variável `VITE_APP_URL` foi configurada
- Redesploy após configurar variáveis
- Ou configure manualmente na interface admin

#### **Links não funcionam**
- Verifique se a URL está acessível na internet
- Teste a URL base no navegador primeiro
- Certifique-se que não há redirecionamentos

#### **"URL inválida" na configuração**
- Use formato completo: `https://seusite.com`
- Não adicione barra no final: ~~`https://seusite.com/`~~
- Verifique se o domínio está ativo

### 📱 URLs Testadas

**Plataformas compatíveis:**
- ✅ Vercel: `https://projeto.vercel.app`
- ✅ Netlify: `https://projeto.netlify.app`
- ✅ GitHub Pages: `https://usuario.github.io/projeto`
- ✅ Domínio próprio: `https://meusite.com`
- ✅ Subdominios: `https://app.meusite.com`

### 💡 Dicas

1. **Configure antes de gerar links** - Links já gerados mantêm a URL original
2. **Use HTTPS** - Sempre prefira URLs seguras
3. **Teste em incógnito** - Para verificar se funciona sem cache
4. **Documente para equipe** - Explique como acessar os links

---

**🌟 Com esta configuração, seus links funcionarão perfeitamente fora do Figma!**