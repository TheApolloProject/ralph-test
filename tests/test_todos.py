import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from app import app as flask_app, reset_todos


@pytest.fixture
def client():
    flask_app.config['TESTING'] = True
    with flask_app.test_client() as client:
        reset_todos()
        yield client


class TestListTodos:
    def test_returns_empty_array_initially(self, client):
        res = client.get('/todos')
        assert res.status_code == 200
        assert res.get_json() == []

    def test_returns_all_todos(self, client):
        client.post('/todos', json={'title': 'Test todo'})
        res = client.get('/todos')
        assert res.status_code == 200
        assert len(res.get_json()) == 1


class TestGetTodo:
    def test_returns_todo_by_id(self, client):
        create_res = client.post('/todos', json={'title': 'Test todo'})
        todo_id = create_res.get_json()['id']

        res = client.get(f'/todos/{todo_id}')
        assert res.status_code == 200
        assert res.get_json()['title'] == 'Test todo'

    def test_returns_404_for_non_existent_todo(self, client):
        res = client.get('/todos/non-existent-id')
        assert res.status_code == 404
        assert res.get_json()['error'] == 'Todo not found'


class TestCreateTodo:
    def test_creates_new_todo(self, client):
        res = client.post('/todos', json={'title': 'New todo'})
        assert res.status_code == 201
        body = res.get_json()
        assert body['title'] == 'New todo'
        assert body['completed'] is False
        assert 'id' in body
        assert 'createdAt' in body

    def test_creates_todo_with_completed_status(self, client):
        res = client.post('/todos', json={'title': 'Done todo', 'completed': True})
        assert res.status_code == 201
        assert res.get_json()['completed'] is True

    def test_trims_whitespace_from_title(self, client):
        res = client.post('/todos', json={'title': '  Trimmed title  '})
        assert res.get_json()['title'] == 'Trimmed title'

    def test_returns_400_for_missing_title(self, client):
        res = client.post('/todos', json={})
        assert res.status_code == 400
        assert 'Title is required and must be a non-empty string' in res.get_json()['errors']

    def test_returns_400_for_empty_title(self, client):
        res = client.post('/todos', json={'title': '   '})
        assert res.status_code == 400

    def test_returns_400_for_title_too_long(self, client):
        res = client.post('/todos', json={'title': 'a' * 201})
        assert res.status_code == 400
        assert 'Title must be 200 characters or less' in res.get_json()['errors']

    def test_returns_400_for_invalid_completed_type(self, client):
        res = client.post('/todos', json={'title': 'Test', 'completed': 'true'})
        assert res.status_code == 400
        assert 'Completed must be a boolean' in res.get_json()['errors']


class TestUpdateTodo:
    def test_updates_todo_title(self, client):
        create_res = client.post('/todos', json={'title': 'Original'})
        todo_id = create_res.get_json()['id']

        res = client.put(f'/todos/{todo_id}', json={'title': 'Updated'})
        assert res.status_code == 200
        body = res.get_json()
        assert body['title'] == 'Updated'
        assert 'updatedAt' in body

    def test_updates_todo_completed_status(self, client):
        create_res = client.post('/todos', json={'title': 'Test'})
        todo_id = create_res.get_json()['id']

        res = client.put(f'/todos/{todo_id}', json={'completed': True})
        assert res.status_code == 200
        assert res.get_json()['completed'] is True

    def test_returns_404_for_non_existent_todo(self, client):
        res = client.put('/todos/non-existent-id', json={'title': 'Updated'})
        assert res.status_code == 404

    def test_validates_input_on_update(self, client):
        create_res = client.post('/todos', json={'title': 'Test'})
        todo_id = create_res.get_json()['id']

        res = client.put(f'/todos/{todo_id}', json={'title': ''})
        assert res.status_code == 400


class TestDeleteTodo:
    def test_deletes_todo(self, client):
        create_res = client.post('/todos', json={'title': 'To delete'})
        todo_id = create_res.get_json()['id']

        delete_res = client.delete(f'/todos/{todo_id}')
        assert delete_res.status_code == 204

        get_res = client.get(f'/todos/{todo_id}')
        assert get_res.status_code == 404

    def test_returns_404_for_non_existent_todo(self, client):
        res = client.delete('/todos/non-existent-id')
        assert res.status_code == 404
