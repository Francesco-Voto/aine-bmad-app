import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

import { createTodo } from '../api/todos';
import type { Todo } from '../api/types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

const TodoInput: React.FC = () => {
  const queryClient = useQueryClient();
  const [text, setText] = React.useState('');
  const [shaking, setShaking] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: (newText: string) => createTodo(newText),
    onMutate: async (newText) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      const previous = queryClient.getQueryData<Todo[]>(['todos']);
      const optimisticTodo: Todo = {
        id: Date.now() * -1,
        text: newText,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<Todo[]>(['todos'], (old) => [optimisticTodo, ...(old ?? [])]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setShaking(true);
      return;
    }
    mutate(trimmed, {
      onSuccess: () => {
        setText('');
        inputRef.current?.focus();
      },
    });
  };

  const showCounter = text.length >= 400;
  const atLimit = text.length >= 500;

  return (
    <form
      aria-label="Add task form"
      className="input-container"
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '6px 6px 6px 14px',
      }}
    >
      <Input
        ref={inputRef}
        id="todo-input"
        name="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a task…"
        autoFocus
        maxLength={500}
        aria-label="Task text"
        className={shaking ? 'shake' : ''}
        onAnimationEnd={() => setShaking(false)}
        style={{ border: 'none', background: 'transparent', padding: 0, outline: 'none' }}
      />
      {showCounter && (
        <span
          style={{
            flexShrink: 0,
            fontSize: 'var(--text-xs)',
            color: atLimit ? 'var(--color-error)' : 'var(--color-text-secondary)',
            marginRight: 'var(--space-2)',
            whiteSpace: 'nowrap',
          }}
        >
          {text.length}/500
        </span>
      )}
      <Button
        type="submit"
        disabled={isPending || atLimit}
        style={{
          flexShrink: 0,
          marginLeft: 'var(--space-2)',
          opacity: isPending ? 0.5 : 1,
          cursor: isPending ? 'not-allowed' : 'pointer',
        }}
      >
        Add
      </Button>
    </form>
  );
};

export { TodoInput };
