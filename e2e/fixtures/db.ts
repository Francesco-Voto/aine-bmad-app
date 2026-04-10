const API = 'http://localhost:3000';

export async function resetDb(): Promise<void> {
  const res = await fetch(`${API}/api/todos`);
  const todos: { id: number }[] = await res.json();
  await Promise.all(
    todos.map((t) =>
      fetch(`${API}/api/todos/${t.id}`, { method: 'DELETE' })
    )
  );
}

export async function seedTodo(
  text: string
): Promise<{ id: number; text: string; completed: boolean; createdAt: string }> {
  const res = await fetch(`${API}/api/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return res.json();
}
