# Todo API

A REST API for managing todos with full CRUD operations, implemented in Python with Flask.

## Requirements

- Python 3.10+
- pip

## Installation

1. Clone the repository and navigate to the project directory.

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

## Running the Server

```bash
cd src
python main.py
```

The server starts on port **3000** by default. Set the `PORT` environment variable to use a different port:

```bash
PORT=8080 python main.py
```

## Running the Tests

```bash
pytest tests/
```

## API Reference

### List all todos

```
GET /todos
```

**Response `200 OK`**

```json
[
  {
    "id": "3f2a1b4c-...",
    "title": "Buy groceries",
    "completed": false,
    "createdAt": "2026-03-06T12:00:00+00:00"
  }
]
```

---

### Get a todo

```
GET /todos/<id>
```

**Response `200 OK`**

```json
{
  "id": "3f2a1b4c-...",
  "title": "Buy groceries",
  "completed": false,
  "createdAt": "2026-03-06T12:00:00+00:00"
}
```

**Response `404 Not Found`**

```json
{ "error": "Todo not found" }
```

---

### Create a todo

```
POST /todos
Content-Type: application/json
```

**Request body**

| Field       | Type    | Required | Description                         |
|-------------|---------|----------|-------------------------------------|
| `title`     | string  | Yes      | Non-empty, max 200 characters       |
| `completed` | boolean | No       | Defaults to `false`                 |

**Example**

```bash
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries"}'
```

**Response `201 Created`**

```json
{
  "id": "3f2a1b4c-...",
  "title": "Buy groceries",
  "completed": false,
  "createdAt": "2026-03-06T12:00:00+00:00"
}
```

**Response `400 Bad Request`**

```json
{ "errors": ["Title is required and must be a non-empty string"] }
```

---

### Update a todo

```
PUT /todos/<id>
Content-Type: application/json
```

**Request body** — include only the fields you want to update:

| Field       | Type    | Description                        |
|-------------|---------|------------------------------------|
| `title`     | string  | Non-empty, max 200 characters      |
| `completed` | boolean | Completion status                  |

**Example**

```bash
curl -X PUT http://localhost:3000/todos/3f2a1b4c-... \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

**Response `200 OK`**

```json
{
  "id": "3f2a1b4c-...",
  "title": "Buy groceries",
  "completed": true,
  "createdAt": "2026-03-06T12:00:00+00:00",
  "updatedAt": "2026-03-06T13:00:00+00:00"
}
```

**Response `404 Not Found`**

```json
{ "error": "Todo not found" }
```

---

### Delete a todo

```
DELETE /todos/<id>
```

**Example**

```bash
curl -X DELETE http://localhost:3000/todos/3f2a1b4c-...
```

**Response `204 No Content`** — empty body on success.

**Response `404 Not Found`**

```json
{ "error": "Todo not found" }
```

## Project Structure

```
.
├── requirements.txt       # Python dependencies
├── src/
│   ├── app.py             # Flask application and route handlers
│   └── main.py            # Entry point (starts the server)
└── tests/
    └── test_todos.py      # pytest test suite
```
