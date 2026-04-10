import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

import type { Todo } from '../api/types';
import { useTodos } from '../hooks/useTodos';
import { InlineError } from './InlineError';
import { TodoItem } from './TodoItem';
import { Button } from './ui/Button';

const TodoList: React.FC = () => {
  const { isLoading, isError, data } = useTodos();
  const queryClient = useQueryClient();

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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-6)',
          }}
        >
          <InlineError message="Couldn't load your tasks. Check your connection." />
          <Button
            variant="ghost"
            onClick={() => queryClient.refetchQueries({ queryKey: ['todos'] })}
          >
            Retry
          </Button>
        </div>
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
