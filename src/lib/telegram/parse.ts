export type IncomingMessage = {
  chatId: string;
  text: string;
};

export function parseUpdate(update: unknown): IncomingMessage | null {
  if (update === null || typeof update !== 'object') {
    return null;
  }

  const msg = (update as Record<string, unknown>).message;
  if (!msg || typeof msg !== 'object') {
    return null;
  }

  const chat = (msg as Record<string, unknown>).chat;
  if (!chat || typeof chat !== 'object') {
    return null;
  }

  const id = (chat as Record<string, unknown>).id;
  const text = (msg as Record<string, unknown>).text;

  if (id === undefined || text === undefined || typeof text !== 'string') {
    return null;
  }

  return {
    chatId: String(id),
    text,
  };
}