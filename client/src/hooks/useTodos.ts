import { useQuery } from '@tanstack/react-query';

import { getTodos } from '../api/todos';
import type { Todo } from '../api/types';

export function useTodos() {
  return useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: getTodos,
  });
}
