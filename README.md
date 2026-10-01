# API de Biblioteca

API REST para gestionar autores, libros y préstamos con Node.js, Express, TypeScript y MongoDB. Cada módulo sigue la arquitectura por capas: rutas, controlador, servicio y repositorio.

## Requisitos

- Node.js y npm
- Una instancia de MongoDB local o remota

## Instalación y ejecución

```powershell
npm install
Copy-Item .env.example .env
```

Configura `MONGO_URI` y `MONGO_DB_NAME` en `.env`. Luego ejecuta:

```powershell
npm run dev
```

Para compilar y ejecutar la versión de producción:

```powershell
npm run build
npm start
```

La API usa `http://localhost:3000` por defecto. MongoDB crea un índice único para el ISBN al iniciar.

## Modelos y reglas

- **Authors:** `name` y `nationality` son obligatorios; `birthYear` es opcional y debe ser un entero positivo. No se elimina un autor con libros asociados.
- **Books:** `title`, `isbn` y `authorId` son obligatorios; `isbn` es único; `year` es opcional y entero. `available` se crea en `true` y solo cambia como parte de las operaciones de préstamo.
- **Loans:** `bookId`, `userName` y `loanDate` son obligatorios. `returnDate` es opcional y `returned` se crea en `false`. Solo se puede prestar un libro disponible; al registrar su devolución vuelve a estar disponible.

Las fechas se envían en formato ISO 8601, por ejemplo `2026-10-01T12:00:00.000Z`. Los identificadores son ObjectId de MongoDB.

## Endpoints

Todos los recursos usan el prefijo `http://localhost:3000/api/v1`.

| Método | Ruta | Descripción |
| ------ | ---- | ----------- |
| POST | `/authors` | Crear autor |
| GET | `/authors` | Listar autores |
| GET | `/authors/:id` | Consultar autor |
| PUT | `/authors/:id` | Actualizar autor |
| DELETE | `/authors/:id` | Eliminar autor si no tiene libros asociados |
| POST | `/books` | Crear libro |
| GET | `/books` | Listar libros |
| GET | `/books/:id` | Consultar libro |
| PUT | `/books/:id` | Actualizar libro |
| DELETE | `/books/:id` | Eliminar libro disponible |
| POST | `/loans` | Registrar préstamo de un libro disponible |
| GET | `/loans` | Listar préstamos |
| GET | `/loans/:id` | Consultar préstamo |
| PUT | `/loans/:id` | Actualizar préstamo o devolver el libro |
| DELETE | `/loans/:id` | Eliminar préstamo; un préstamo activo devuelve primero el libro |
| GET | `/health` | Comprobar estado de la API |

Las operaciones correctas responden con `201` al crear, `200` al consultar/actualizar y `204` al eliminar. Los errores de validación responden `400`, los recursos inexistentes `404` y los errores inesperados `500`.

## Ejemplos con curl

En estos ejemplos, sustituye `<authorId>`, `<bookId>` y `<loanId>` por los `_id` devueltos por las peticiones anteriores.

```powershell
curl.exe -X POST http://localhost:3000/api/v1/authors -H "Content-Type: application/json" -d '{"name":"Gabriel García Márquez","nationality":"Colombiana","birthYear":1927}'

curl.exe -X POST http://localhost:3000/api/v1/books -H "Content-Type: application/json" -d '{"title":"Cien años de soledad","isbn":"9780307474728","authorId":"<authorId>","year":1967}'

curl.exe -X POST http://localhost:3000/api/v1/loans -H "Content-Type: application/json" -d '{"bookId":"<bookId>","userName":"Ana Pérez","loanDate":"2026-10-01T12:00:00.000Z"}'

curl.exe -X PUT http://localhost:3000/api/v1/loans/<loanId> -H "Content-Type: application/json" -d '{"returned":true}'
```

Para probar todos los endpoints en orden, usa [requests.http](requests.http) desde VS Code con la extensión REST Client.
