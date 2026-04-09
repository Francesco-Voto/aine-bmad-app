import type { FastifyPluginAsync } from 'fastify';

type DbRow = {
  id: number;
  text: string;
  completed: number;
  created_at: string;
};

function toTodo(row: DbRow) {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed === 1,
    createdAt: new Date(row.created_at.replace(' ', 'T') + 'Z').toISOString(),
  };
}

const postSchema = {
  body: {
    type: 'object',
    required: ['text'],
    properties: {
      text: { type: 'string', minLength: 1, maxLength: 500 },
    },
    additionalProperties: false,
  },
};

const patchSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'integer' } },
  },
  body: {
    type: 'object',
    required: ['completed'],
    properties: {
      completed: { type: 'boolean' },
    },
    additionalProperties: false,
  },
};

const deleteSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'integer' } },
  },
};

export const todosRoutes: FastifyPluginAsync = async (app) => {
  app.get('/todos', async (_req, reply) => {
    const rows = app.statements.selectAll.all() as DbRow[];
    return reply.send(rows.map(toTodo));
  });

  app.post('/todos', { schema: postSchema }, async (req, reply) => {
    const { text } = req.body as { text: string };
    const trimmed = text.trim();
    if (!trimmed) {
      return reply.status(400).send({ message: 'text must not be empty or whitespace-only' });
    }
    const row = app.statements.insertOne.get(trimmed) as DbRow;
    return reply.status(201).send(toTodo(row));
  });

  app.patch('/todos/:id', { schema: patchSchema }, async (req, reply) => {
    const { id } = req.params as { id: number };
    const { completed } = req.body as { completed: boolean };
    const row = app.statements.updateCompleted.get(completed ? 1 : 0, id) as DbRow | undefined;
    if (!row) return reply.status(404).send({ message: `Todo ${id} not found` });
    return reply.send(toTodo(row));
  });

  app.delete('/todos/:id', { schema: deleteSchema }, async (req, reply) => {
    const { id } = req.params as { id: number };
    const result = app.statements.deleteOne.run(id);
    if (result.changes === 0) return reply.status(404).send({ message: `Todo ${id} not found` });
    return reply.status(204).send();
  });
};
