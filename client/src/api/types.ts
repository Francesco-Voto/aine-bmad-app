export type Todo = {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function throwIfNotOk(response: Response): Promise<void> {
  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new ApiError(response.status, (json as { message?: string }).message ?? 'Request failed');
  }
}
