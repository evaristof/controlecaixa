# Controle Caixa - CRUD de Produtos

## Backend (Java Spring Boot)
- API REST para gerenciamento de produtos
- Spring Boot 3.2 + Spring Data JPA + H2 Database
- Endpoints: GET, POST, PUT, DELETE em `/api/produtos`

### Como rodar o backend:
```bash
cd backend
mvn package -DskipTests
java -jar target/api-0.0.1-SNAPSHOT.jar
```
O servidor inicia em http://localhost:8080

## Frontend (React + TypeScript)
- Interface para cadastro, listagem, edição e exclusão de produtos
- React 18 + Vite + Tailwind CSS + Lucide Icons

### Como rodar o frontend:
```bash
cd produto-frontend
npm install
npm run dev
```
O frontend inicia em http://localhost:5173

## Endpoints da API
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/produtos | Listar todos os produtos |
| GET | /api/produtos/{id} | Buscar produto por ID |
| POST | /api/produtos | Criar novo produto |
| PUT | /api/produtos/{id} | Atualizar produto |
| DELETE | /api/produtos/{id} | Excluir produto |

