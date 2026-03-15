# Webhook Inspector - Backend

API REST desenvolvida para capturar, armazenar e inspecionar requisições de webhooks. Este projeto foi criado para fins de estudo e demonstração de conceitos modernos de desenvolvimento backend.

## 📋 Sobre o Projeto

O **Webhook Inspector Backend** é uma aplicação que atua como um receptor universal de webhooks, permitindo que desenvolvedores capturem, armazenem e analisem requisições HTTP recebidas de serviços externos. A aplicação oferece funcionalidades avançadas como geração automática de handlers TypeScript usando Inteligência Artificial.

## 🚀 Funcionalidades

### Captura de Webhooks
- **Endpoint Universal**: Rota `/capture/*` que aceita qualquer método HTTP (GET, POST, PUT, DELETE, etc.)
- **Captura Completa**: Armazena método, pathname, IP, status code, headers, query parameters e body
- **Flexível**: Aceita qualquer formato de conteúdo (JSON, XML, form-data, etc.)

### Gerenciamento de Webhooks
- **Listagem Paginada**: Lista webhooks com paginação baseada em cursor
- **Busca por ID**: Recupera detalhes completos de um webhook específico
- **Exclusão**: Remove webhooks do banco de dados

### Geração de Handlers com IA
- **Geração Automática**: Utiliza Google Gemini para gerar código TypeScript
- **Validação com Zod**: Gera schemas de validação automaticamente
- **Batch Processing**: Suporta processamento em lote de múltiplos webhooks
- **Type-Safe**: Código gerado com tipagem forte e validação robusta

### Documentação da API
- **Swagger/OpenAPI**: Documentação interativa disponível em `/docs`
- **Scalar API Reference**: Interface moderna para explorar a API
- **Validação Automática**: Schemas Zod integrados com Fastify

## 🛠️ Tecnologias

### Core
- **Fastify**: Framework web rápido e eficiente para Node.js
- **TypeScript**: Tipagem estática para maior segurança e produtividade
- **Zod**: Validação de schemas em runtime com inferência de tipos

### Banco de Dados
- **PostgreSQL**: Banco de dados relacional
- **Drizzle ORM**: ORM type-safe e moderno
- **Drizzle Kit**: Ferramentas de migração e gerenciamento de schema

### IA e Integrações
- **Vercel AI SDK**: SDK para integração com modelos de IA
- **Google Gemini 2.5 Flash Lite**: Modelo de IA para geração de código

### Ferramentas
- **Biome**: Linter e formatter rápido
- **Docker Compose**: Orquestração do banco de dados PostgreSQL
- **Pino**: Sistema de logging estruturado

## 📦 Estrutura do Projeto

```
back-webhooks/
├── src/
│   ├── db/
│   │   ├── schema/          # Schemas do Drizzle ORM
│   │   ├── migrations/      # Migrações do banco de dados
│   │   ├── index.ts         # Configuração do banco
│   │   └── seed.ts          # Script de seed (dados de exemplo)
│   ├── routes/              # Rotas da API
│   │   ├── capture-webhook.ts
│   │   ├── get-webhooks.ts
│   │   ├── get-webhook-by-id.ts
│   │   ├── delete-webhook.ts
│   │   └── generate-handler.ts
│   ├── utils/               # Utilitários
│   │   ├── env.ts           # Validação de variáveis de ambiente
│   │   └── logger.ts        # Configuração de logging
│   └── server.ts            # Arquivo principal do servidor
├── docker-compose.yml       # Configuração do PostgreSQL
├── drizzle.config.ts        # Configuração do Drizzle
└── package.json
```

## 🔧 Instalação

### Pré-requisitos
- Node.js 18+ (recomendado usar pnpm como gerenciador de pacotes)
- Docker e Docker Compose (para o banco de dados)

### Passos

1. **Clone o repositório** (se ainda não tiver feito):
```bash
cd back-webhooks
```

2. **Instale as dependências**:
```bash
pnpm install
```

3. **Configure as variáveis de ambiente**:
Crie um arquivo `.env` na raiz do projeto:
```env
NODE_ENV=dev
PORT=3100
DATABASE_URL=postgresql://docker:docker@localhost:5432/webhooks
GOOGLE_GENERATIVE_AI_API_KEY=sua_chave_api_aqui
FRONT_ORIGINS=http://localhost:3000
```

4. **Inicie o banco de dados**:
```bash
pnpm db:init
```

5. **Execute as migrações**:
```bash
pnpm db:migrate
```

6. **Inicie o servidor**:
```bash
pnpm dev
```

O servidor estará rodando em `http://localhost:3100` e a documentação da API estará disponível em `http://localhost:3100/docs`.

## 📚 Uso da API

### Capturar um Webhook

Qualquer requisição para `/capture/*` será capturada e armazenada:

```bash
# Exemplo: Capturar um webhook POST
curl -X POST http://localhost:3100/capture/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{"event": "payment.completed", "amount": 100}'

# Resposta: {"id": "018f1234-5678-..."}
```

### Listar Webhooks

```bash
GET http://localhost:3100/api/webhooks?limit=20&cursor=opcional
```

### Buscar Webhook por ID

```bash
GET http://localhost:3100/api/webhooks/{id}
```

### Gerar Handler TypeScript

```bash
POST http://localhost:3100/api/generate
Content-Type: application/json

{
  "webhookIds": ["id1", "id2", "id3"]
}
```

### Deletar Webhook

```bash
DELETE http://localhost:3100/api/webhooks/{id}
```

## 🗄️ Schema do Banco de Dados

A tabela `webhooks` armazena:
- `id`: UUID v7 (identificador único)
- `method`: Método HTTP (GET, POST, etc.)
- `pathname`: Caminho da requisição
- `ip`: Endereço IP do cliente
- `statusCode`: Código de status HTTP
- `contentType`: Tipo de conteúdo
- `contentLength`: Tamanho do conteúdo em bytes
- `queryParams`: Parâmetros de query (JSONB)
- `headers`: Headers HTTP (JSONB)
- `body`: Corpo da requisição (texto)
- `createdAt`: Timestamp de criação

## 🧪 Scripts Disponíveis

- `pnpm dev`: Inicia o servidor em modo desenvolvimento com hot-reload
- `pnpm start`: Inicia o servidor em modo produção
- `pnpm format`: Formata o código usando Biome
- `pnpm db:init`: Inicia o container do PostgreSQL
- `pnpm db:stop`: Para o container do PostgreSQL
- `pnpm db:down`: Remove o container do PostgreSQL
- `pnpm db:generate`: Gera migrações baseadas no schema
- `pnpm db:migrate`: Executa as migrações
- `pnpm db:studio`: Abre o Drizzle Studio (interface visual do banco)
- `pnpm db:seed`: Popula o banco com dados de exemplo

## 🔐 Variáveis de Ambiente

| Variável                       | Descrição                                                              | Obrigatório | Padrão               |
| ------------------------------ | ---------------------------------------------------------------------- | ----------- | -------------------- |
| `NODE_ENV`                     | Ambiente de execução (dev/prod/test)                                   | Não         | `dev`                |
| `PORT`                         | Porta do servidor                                                      | Não         | `3100`               |
| `DATABASE_URL`                 | URL de conexão do PostgreSQL                                           | Sim         | -                    |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Chave da API do Google Gemini                                          | Sim         | -                    |
| `FRONT_ORIGINS`                | Origens permitidas para acessar rotas `/api/*` (lista separada por ,) | Não         | `http://localhost:3000` |

## 🛡️ Segurança em Produção

- Rate limiting global configurado com `@fastify/rate-limit` (200 requisições por minuto por IP).
- O endpoint `/capture/*` é público para receber webhooks de qualquer origem.
- As rotas `/api/*` (listagem, visualização, deleção e geração de handlers) só aceitam chamadas de browsers cujo `Origin` esteja em `FRONT_ORIGINS`. Chamadas sem header `Origin` (ex.: `curl`, outros backends) continuam permitidas.

## 📝 Notas de Desenvolvimento

- Este projeto foi criado para fins de estudo e aprendizado
- A documentação da API (Swagger) só é disponibilizada em modo `dev`
- O endpoint `/capture/*` aceita qualquer método HTTP e pathname
- A geração de handlers usa o modelo `gemini-2.5-flash-lite` da Google
- O sistema de paginação usa cursor-based pagination para melhor performance

## 🤝 Contribuindo

Este é um projeto de estudo. Sinta-se livre para explorar, modificar e aprender com o código!

## 📄 Licença

ISC

