import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createTodo } from '../api/todos';
import type { Todo } from '../api/types';

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
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
}
