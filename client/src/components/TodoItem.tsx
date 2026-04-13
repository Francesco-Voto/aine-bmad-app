import * as React from 'react';

import type { Todo } from '../api/types';
import { useDeleteTodo } from '../hooks/useDeleteTodo';
import { useToggleTodo } from '../hooks/useToggleTodo';
import { InlineError } from './InlineError';
import { Checkbox } from './ui/Checkbox';

interface TodoItemProps {
  todo: Todo;
  onDeleteFocus?: () => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onDeleteFocus }) => {
  const [collapsed, setCollapsed] = React.useState(false);

  const { mutate: toggleMutate, isError: toggleIsError } = useToggleTodo();
  const { mutate: deleteMutate, isError: deleteIsError } = useDeleteTodo();

  const handleToggle = (checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
      toggleMutate({ id: todo.id, completed: checked });
    }
  };

  const handleDelete = () => {
    onDeleteFocus?.();
    setCollapsed(true);
    deleteMutate(todo.id, {
      onError: () => setCollapsed(false),
    });
  };

  const getItemError = (): string | undefined => {
    if (toggleIsError) return "Couldn't update — try again.";
    if (deleteIsError) return "Couldn't delete — try again.";
    return undefined;
  };

  const collapseStyle: React.CSSProperties = collapsed
    ? {
        opacity: 0,
        maxHeight: 0,
        overflow: 'hidden',
        marginBottom: 0,
        padding: 0,
      }
    : { opacity: 1, maxHeight: '200px' };

  const textStyle: React.CSSProperties = todo.completed
    ? {
        flex: 1,
        fontSize: 'var(--text-base)',
        textDecoration: 'line-through',
        opacity: 0.6,
        color: 'var(--color-text-disabled)',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
      }
    : {
        flex: 1,
        fontSize: 'var(--text-base)',
        color: 'var(--color-text-primary)',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
      };

  return (
    <div className="todo-item" style={{ marginBottom: 6 }}>
      <div
        className="todo-card"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          ...collapseStyle,
        }}
      >
        <Checkbox
          id={`checkbox-${todo.id}`}
          checked={todo.completed}
          onCheckedChange={handleToggle}
          aria-label={`Complete: ${todo.text}`}
        />
        <span className="todo-text" style={textStyle}>
          {todo.text}
        </span>
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
      <InlineError message={getItemError()} variant="item" />
    </div>
  );
};

export { TodoItem };
