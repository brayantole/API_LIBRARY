# api_biblioteca

API REST construida con Node.js, Express, TypeScript y MongoDB.
Arquitectura por capas (rutas → controlador → servicio → repositorio).

## Instalación

```bash
npm install
cp .env.example .env   # ajusta MONGO_URI
```

## Ejecución

```bash
npm run dev            # desarrollo con recarga
npm run build && npm start   # producción
```

## Endpoints del módulo autores

Base URL: `http://localhost:3000/api/v1/authors`

| Método | Ruta   | Descripción                  |
| ------ | ------ | ---------------------------- |
| POST   | /      | Crea un autor                |
| GET    | /      | Lista todos los autores     |
| GET    | /:id   | Obtiene un autor por id     |
| PUT    | /:id   | Actualiza un autor          |
| DELETE | /:id   | Elimina un autor            |

## Endpoints del módulo books

Base URL: `http://localhost:3000/api/v1/books`

| Método | Ruta   | Descripción                  |
| ------ | ------ | ---------------------------- |
| POST   | /      | Crea un libro                |
| GET    | /      | Lista todos los libros       |
| GET    | /:id   | Obtiene un libro por id      |
| PUT    | /:id   | Actualiza un libro           |
| DELETE | /:id   | Elimina un libro             |

Para crear un libro, envía `title`, `isbn`, `publicationYear`, `genre` y `authorId` (el ObjectId de un autor existente). `active` es opcional y por defecto es `true`.

Health check: `GET /health`
