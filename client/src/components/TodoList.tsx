import * as React from 'react';

import type { Todo } from '../api/types';
import { useTodos } from '../hooks/useTodos';
import { TodoItem } from './TodoItem';

const TodoList: React.FC = () => {
  const { isLoading, isError, data } = useTodos();

  return (
    <div aria-live="polite">
      {isLoading && (
        <div aria-busy="true" aria-label="Loading tasks">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                height: 48,
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                marginBottom: 6,
              }}
            />
          ))}
        </div>
      )}
      {isError && !isLoading && (
        <p
          style={{
            textAlign: 'center',
            color: 'var(--color-error)',
            fontSize: 'var(--text-sm)',
            marginTop: 'var(--space-6)',
          }}
        >
          Something went wrong. Please try again.
        </p>
      )}
      {!isLoading && !isError && (!data || data.length === 0) && (
        <p
          style={{
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--text-sm)',
            marginTop: 'var(--space-6)',
          }}
        >
          No tasks yet. Add one above.
        </p>
      )}
      {!isLoading && !isError && data && data.length > 0 && (
        <>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-2)',
            }}
          >
            TASKS
          </p>
          <ul role="list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {data.map((todo: Todo) => (
              <li key={todo.id} role="listitem">
                <TodoItem todo={todo} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export { TodoList };
