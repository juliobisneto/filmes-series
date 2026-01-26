# 🎬 Sistema de Gerenciamento de Filmes e Séries

Sistema completo para cadastrar, gerenciar e acompanhar filmes e séries que você quer ver ou já assistiu, com integração ao IMDB através da API OMDb.

## 🚀 Tecnologias

### Backend
- Node.js + Express
- SQLite3
- Axios (para integração com OMDb API)
- CORS

### Frontend
- React
- React Router
- Axios
- CSS responsivo (Mobile-first)

## 📋 Funcionalidades

### ✨ Principais Recursos
- ✅ Cadastro manual de filmes e séries
- 🔍 Busca automática no IMDB via OMDb API
- 📥 Importação automática de dados (poster, sinopse, elenco, diretor, avaliação IMDB)
- ⭐ Sistema de avaliação pessoal (1-5 estrelas)
- 📝 Anotações pessoais
- 🎯 Status: "Quero Ver" ou "Já Vi"
- 🔎 Filtros avançados (status, tipo, gênero)
- 📱 Interface responsiva (mobile e desktop)
- 🎨 Design moderno inspirado em Netflix

### 🎯 Dados Gerenciados
- Título, tipo (filme/série), gênero
- Poster, sinopse, ano, duração
- Diretor e elenco principal
- Avaliação pessoal e do IMDB
- Datas (cadastro e quando assistiu)
- Link direto para o IMDB

## 📦 Instalação

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

### 1. Clone ou navegue até o diretório do projeto

```bash
cd Filmes_e_Series
```

### 2. Configurar o Backend

```bash
cd backend
npm install
```

#### Configurar a chave da OMDb API

1. Obtenha uma chave gratuita em: http://www.omdbapi.com/apikey.aspx
2. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edite o arquivo `.env` e adicione sua chave:
   ```
   PORT=3001
   OMDB_API_KEY=sua_chave_aqui
   ```

**Nota:** A API gratuita permite 1.000 requisições por dia.

### 3. Configurar o Frontend

```bash
cd ../frontend
npm install
```

O frontend já está configurado para se conectar ao backend em `http://localhost:3001/api`.

## 🎮 Como Usar

### Iniciar o Backend

Em um terminal, execute:

```bash
cd backend
npm start
```

O backend estará rodando em: `http://localhost:3001`

### Iniciar o Frontend

Em outro terminal, execute:

```bash
cd frontend
npm start
```

O frontend abrirá automaticamente em: `http://localhost:3000`

## 📖 Guia de Uso

### 1. Adicionar um Filme/Série

**Opção A: Buscar no IMDB**
1. Clique em "Adicionar" no menu
2. Digite o nome do filme/série no campo de busca do IMDB
3. Clique em "Buscar"
4. Selecione o resultado desejado
5. Os dados serão importados automaticamente
6. Ajuste informações pessoais (status, avaliação, anotações)
7. Clique em "Adicionar"

**Opção B: Cadastro Manual**
1. Clique em "Adicionar" no menu
2. Preencha os campos manualmente
3. Clique em "Adicionar"

### 2. Visualizar Detalhes
- Na lista, clique em qualquer card para ver os detalhes completos
- Visualize sinopse, elenco, diretor, avaliações e suas anotações
- Acesse o link direto para o IMDB (se disponível)

### 3. Editar
- Clique em "Editar" no card ou na página de detalhes
- Modifique as informações
- Clique em "Atualizar"

### 4. Excluir
- Clique em "Excluir" no card ou na página de detalhes
- Confirme a ação

### 5. Filtrar
Use os filtros disponíveis na página inicial:
- **Buscar**: Digite o título, ator ou diretor
- **Status**: Filtre por "Quero Ver" ou "Já Vi"
- **Tipo**: Filtre por "Filmes" ou "Séries"
- **Gênero**: Digite o gênero desejado

Os filtros são aplicados automaticamente enquanto você digita.

## 🏗️ Estrutura do Projeto

```
Filmes_e_Series/
├── backend/
│   ├── server.js              # Servidor Express
│   ├── database.js            # Conexão e queries SQLite
│   ├── routes/
│   │   ├── media.js           # Rotas CRUD de filmes/séries
│   │   └── omdb.js            # Rotas integração OMDb
│   ├── package.json
│   ├── .env                   # Configurações (não versionado)
│   └── .env.example           # Exemplo de configuração
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   │   ├── Header.js
│   │   │   ├── MediaCard.js
│   │   │   ├── Filters.js
│   │   │   └── Loading.js
│   │   ├── pages/             # Páginas da aplicação
│   │   │   ├── Home.js
│   │   │   ├── FormPage.js
│   │   │   └── DetailsPage.js
│   │   ├── services/
│   │   │   └── api.js         # Configuração Axios
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
│
└── README.md
```

## 🔌 API Endpoints

### Filmes e Séries (Media)

- `GET /api/media` - Listar todos (com filtros opcionais)
- `GET /api/media/:id` - Buscar por ID
- `GET /api/media/search/local?q=termo` - Buscar localmente
- `POST /api/media` - Cadastrar novo
- `PUT /api/media/:id` - Atualizar
- `DELETE /api/media/:id` - Remover

### OMDb API (IMDB)

- `GET /api/omdb/search?title=nome` - Buscar no IMDB
- `GET /api/omdb/:imdbId` - Obter detalhes por IMDB ID
- `GET /api/omdb/title/:title` - Buscar título específico

## 📱 Responsividade

O sistema é totalmente responsivo com breakpoints para:
- **Mobile**: < 768px (1 coluna)
- **Tablet**: 768px - 1200px (2-3 colunas)
- **Desktop**: > 1200px (4 colunas)

Recursos mobile:
- Menu hambúrguer
- Cards adaptados
- Formulários em coluna única
- Touch-friendly

## 🎨 Paleta de Cores

- **Primária**: #e50914 (vermelho Netflix)
- **Secundária**: #221f1f (cinza escuro)
- **Background**: #141414 (preto suave)
- **Cards**: #2f2f2f (cinza médio)
- **Sucesso**: #46d369 (verde)
- **Aviso**: #ffa500 (laranja)

## 🔧 Desenvolvimento

### Backend
```bash
cd backend
npm run dev  # Com nodemon (recarrega automaticamente)
```

### Frontend
```bash
cd frontend
npm start    # Modo de desenvolvimento
npm run build  # Build para produção
```

## 🐛 Solução de Problemas

### Backend não conecta
- Verifique se a porta 3001 está livre
- Confirme que as dependências foram instaladas
- Verifique o arquivo `.env`

### Busca no IMDB não funciona
- Verifique se a chave da OMDb API está configurada no `.env`
- Confirme que a chave é válida
- Verifique se não excedeu o limite de 1.000 requisições/dia

### Frontend não carrega dados
- Confirme que o backend está rodando
- Verifique a URL da API no código (deve ser `http://localhost:3001/api`)
- Abra o console do navegador para ver erros

### Erro de CORS
- Verifique se o CORS está habilitado no backend
- Confirme que as URLs estão corretas

## 📝 Notas

- O banco de dados SQLite (`filmes_series.db`) é criado automaticamente na primeira execução
- Os dados são persistidos localmente
- Para resetar o banco, apenas delete o arquivo `.db`
- A API do OMDb tem limite de 1.000 requisições/dia no plano gratuito

## 🚀 Próximas Melhorias Sugeridas

- [ ] Sistema de autenticação de usuários
- [ ] Compartilhamento de listas
- [ ] Modo escuro/claro
- [ ] Exportação de dados (CSV/JSON)
- [ ] Integração com mais APIs (TMDb, Rotten Tomatoes)
- [ ] Notificações de lançamentos
- [ ] Estatísticas e gráficos
- [ ] PWA (Progressive Web App)

## 📄 Licença

Este projeto é de código aberto e está disponível para uso pessoal e educacional.

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se livre para abrir issues ou pull requests.

---

Desenvolvido com ❤️ usando React e Node.js
