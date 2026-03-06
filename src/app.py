from flask import Flask, request, jsonify
from uuid import uuid4
from datetime import datetime, timezone

app = Flask(__name__)

# In-memory storage for todos
todos = []


def validate_todo(data, is_post=False):
    errors = []
    title = data.get('title')
    completed = data.get('completed')

    if is_post or 'title' in data:
        if not isinstance(title, str) or len(title.strip()) == 0:
            errors.append('Title is required and must be a non-empty string')
        elif len(title) > 200:
            errors.append('Title must be 200 characters or less')

    if 'completed' in data and not isinstance(completed, bool):
        errors.append('Completed must be a boolean')

    return errors


# GET /todos - List all todos
@app.get('/todos')
def list_todos():
    return jsonify(todos)


# GET /todos/<id> - Get a single todo
@app.get('/todos/<todo_id>')
def get_todo(todo_id):
    todo = next((t for t in todos if t['id'] == todo_id), None)
    if todo is None:
        return jsonify({'error': 'Todo not found'}), 404
    return jsonify(todo)


# POST /todos - Create a new todo
@app.post('/todos')
def create_todo():
    data = request.get_json(silent=True) or {}
    errors = validate_todo(data, is_post=True)
    if errors:
        return jsonify({'errors': errors}), 400

    todo = {
        'id': str(uuid4()),
        'title': data.get('title', '').strip(),
        'completed': data.get('completed', False),
        'createdAt': datetime.now(timezone.utc).isoformat(),
    }
    todos.append(todo)
    return jsonify(todo), 201


# PUT /todos/<id> - Update a todo
@app.put('/todos/<todo_id>')
def update_todo(todo_id):
    index = next((i for i, t in enumerate(todos) if t['id'] == todo_id), None)
    if index is None:
        return jsonify({'error': 'Todo not found'}), 404

    data = request.get_json(silent=True) or {}
    errors = validate_todo(data)
    if errors:
        return jsonify({'errors': errors}), 400

    updated_todo = {
        **todos[index],
        'title': data['title'].strip() if 'title' in data else todos[index]['title'],
        'completed': data['completed'] if 'completed' in data else todos[index]['completed'],
        'updatedAt': datetime.now(timezone.utc).isoformat(),
    }
    todos[index] = updated_todo
    return jsonify(updated_todo)


# DELETE /todos/<id> - Delete a todo
@app.delete('/todos/<todo_id>')
def delete_todo(todo_id):
    index = next((i for i, t in enumerate(todos) if t['id'] == todo_id), None)
    if index is None:
        return jsonify({'error': 'Todo not found'}), 404

    todos.pop(index)
    return '', 204


def reset_todos():
    """Reset todos (for testing)."""
    todos.clear()
