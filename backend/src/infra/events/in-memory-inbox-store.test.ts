import { describe, expect, it } from 'vitest';
import { createInMemoryInboxStore } from './in-memory-inbox-store.js';

describe('in-memory inbox store', () => {
  it('tryClaim returns true the first time, false thereafter', async () => {
    const inbox = createInMemoryInboxStore();
    expect(await inbox.tryClaim('e1', 'h1')).toBe(true);
    expect(await inbox.tryClaim('e1', 'h1')).toBe(false);
    expect(await inbox.tryClaim('e1', 'h1')).toBe(false);
  });

  it('tryClaim scopes to (eventId, handlerName)', async () => {
    const inbox = createInMemoryInboxStore();
    expect(await inbox.tryClaim('e1', 'h1')).toBe(true);
    expect(await inbox.tryClaim('e1', 'h2')).toBe(true);
    expect(await inbox.tryClaim('e2', 'h1')).toBe(true);
    expect(await inbox.tryClaim('e1', 'h1')).toBe(false);
  });

  it('hasProcessed reflects prior claims', async () => {
    const inbox = createInMemoryInboxStore();
    expect(await inbox.hasProcessed('e1', 'h1')).toBe(false);
    await inbox.tryClaim('e1', 'h1');
    expect(await inbox.hasProcessed('e1', 'h1')).toBe(true);
  });

  it('reset clears claims', async () => {
    const inbox = createInMemoryInboxStore();
    await inbox.tryClaim('e1', 'h1');
    inbox.reset();
    expect(await inbox.tryClaim('e1', 'h1')).toBe(true);
  });
});
