import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

import { deleteTodo, toggleTodo } from '../api/todos';
import type { Todo } from '../api/types';
import { Checkbox } from './ui/Checkbox';

interface TodoItemProps {
  todo: Todo;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo }) => {
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = React.useState(false);

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      toggleTodo(id, completed),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      const previous = queryClient.getQueryData<Todo[]>(['todos']);
      queryClient.setQueryData<Todo[]>(
        ['todos'],
        (old) => old?.map((t) => (t.id === id ? { ...t, completed } : t)) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['todos'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTodo(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      const previous = queryClient.getQueryData<Todo[]>(['todos']);
      setCollapsed(true);
      queryClient.setQueryData<Todo[]>(['todos'], (old) => old?.filter((t) => t.id !== id) ?? []);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      setCollapsed(false);
      if (context?.previous) {
        queryClient.setQueryData(['todos'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const handleToggle = (checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
      toggleMutation.mutate({ id: todo.id, completed: checked });
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate(todo.id);
  };

  const collapseStyle: React.CSSProperties = collapsed
    ? {
        opacity: 0,
        maxHeight: 0,
        overflow: 'hidden',
        marginBottom: 0,
        padding: 0,
        transition: 'opacity 150ms, max-height 200ms ease-out',
      }
    : { opacity: 1, maxHeight: '200px', transition: 'opacity 150ms, max-height 200ms ease-out' };

  const textStyle: React.CSSProperties = todo.completed
    ? {
        flex: 1,
        fontSize: 'var(--text-base)',
        textDecoration: 'line-through',
        opacity: 0.6,
        color: 'var(--color-text-disabled)',
      }
    : {
        flex: 1,
        fontSize: 'var(--text-base)',
        color: 'var(--color-text-primary)',
      };

  return (
    <div
      className="todo-card"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 6,
        padding: '12px 14px',
        marginBottom: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        ...collapseStyle,
      }}
    >
      <Checkbox
        checked={todo.completed}
        onCheckedChange={handleToggle}
        aria-label={`Complete: ${todo.text}`}
      />
      <span style={textStyle}>{todo.text}</span>
      <button
        className="delete-btn"
        aria-label={`Delete: ${todo.text}`}
        onClick={handleDelete}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
          fontSize: 16,
          lineHeight: 1,
          padding: '2px 4px',
        }}
      >
        ✕
      </button>
    </div>
  );
};

export { TodoItem };
