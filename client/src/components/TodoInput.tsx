import * as React from 'react';

import { useCreateTodo } from '../hooks/useCreateTodo';
import { InlineError } from './InlineError';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

const TodoInput: React.FC = () => {
  const [text, setText] = React.useState('');
  const [shaking, setShaking] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { mutate, isPending, isError } = useCreateTodo();

  const handleSubmit = (e: React.SubmitEvent) => {
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
      onError: () => {
        inputRef.current?.focus();
      },
    });
  };

  const showCounter = text.length >= 400;
  const atLimit = text.length >= 500;

  return (
    <>
      <form
        role="form"
        aria-label="Add a task"
        className="input-container"
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '6px 6px 6px 14px',
          position: 'relative',
        }}
      >
        <Input
          ref={inputRef}
          id="todo-input"
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setText('');
              inputRef.current?.blur();
            }
          }}
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
              position: 'absolute',
              bottom: 2,
              right: 8,
              fontSize: 'var(--text-xs)',
              color: atLimit ? 'var(--color-error)' : 'var(--color-text-secondary)',
              pointerEvents: 'none',
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
          }}
        >
          Add
        </Button>
      </form>
      <InlineError
        message={isError ? "Couldn't save — check your connection." : undefined}
        variant="input"
      />
    </>
  );
};

export { TodoInput };
