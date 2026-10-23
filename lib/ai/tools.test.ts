import { describe, expect, it } from 'vitest';
import { AI_TOOL_DEFINITIONS, executeAiTool } from './tools';

describe('AI tools', () => {
  it('exposes the expected read-only tools', () => {
    expect(AI_TOOL_DEFINITIONS.map((tool) => tool.function.name)).toEqual([
      'get_lab_overview',
      'list_rooms',
      'list_units',
      'list_components',
      'list_inventory',
      'list_purchase_requests',
      'list_applications',
    ]);
  });

  it('rejects unknown tools', async () => {
    await expect(executeAiTool('drop_database', '{}')).resolves.toEqual({
      error: 'Unknown tool "drop_database".',
    });
  });

  it('rejects malformed JSON arguments', async () => {
    await expect(executeAiTool('list_components', '{')).resolves.toEqual({
      error: 'Invalid tool arguments.',
    });
  });

  it('rejects invalid enum arguments before querying the database', async () => {
    const result = await executeAiTool(
      'list_components',
      JSON.stringify({ type: 'NOT_A_COMPONENT' }),
    );

    expect(result).toMatchObject({ error: 'Invalid tool arguments.' });
  });
});
