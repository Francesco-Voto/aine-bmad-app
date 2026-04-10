import { PageShell } from './components/PageShell';
import { TodoInput } from './components/TodoInput';
import { TodoList } from './components/TodoList';

export default function App() {
  return (
    <PageShell title="Todo">
      <TodoInput />
      <div style={{ height: 'var(--space-6)' }} />
      <TodoList />
    </PageShell>
  );
}
