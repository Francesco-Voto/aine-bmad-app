import { throwIfNotOk, type Todo } from './types';

export async function getTodos(): Promise<Todo[]> {
  const res = await fetch('/api/todos');
  await throwIfNotOk(res);
  return res.json();
}

export async function createTodo(text: string): Promise<Todo> {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  await throwIfNotOk(res);
  return res.json();
}

export async function toggleTodo(id: number, completed: boolean): Promise<Todo> {
  const res = await fetch(`/api/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  });
  await throwIfNotOk(res);
  return res.json();
}

export async function deleteTodo(id: number): Promise<void> {
  const res = await fetch(`/api/todos/${id}`, {
    method: 'DELETE',
  });
  await throwIfNotOk(res);
}
