import { describe, expect, it } from 'vitest';
import {
  extractTables,
  generateInsertTemplate,
  generateSelectTemplate,
  lowercaseKeywords,
  parseSqlStatements,
  removeComments,
  uppercaseKeywords,
  validateSql,
} from './sql-utils';

describe('sql-utils', () => {
  it('parses statement types and referenced tables', () => {
    const statements = parseSqlStatements(`
      SELECT id, name FROM users;
      UPDATE projects SET name = 'ToolsBox' WHERE id = 1;
      INSERT INTO audit_logs (action) VALUES ('open');
    `);

    expect(statements).toHaveLength(3);
    expect(statements[0]).toMatchObject({
      type: 'SELECT',
      tables: ['users'],
      columns: ['id', 'name'],
    });
    expect(statements[1]).toMatchObject({
      type: 'UPDATE',
      tables: ['projects'],
    });
    expect(statements[2]).toMatchObject({
      type: 'INSERT',
      tables: ['audit_logs'],
    });
  });

  it('normalizes keyword casing and strips comments', () => {
    const sql = `
      select * from users -- inline comment
      /* block comment */
      where id = 1
    `;

    expect(uppercaseKeywords(sql)).toContain('SELECT * FROM users');
    expect(lowercaseKeywords('SELECT NAME FROM USERS')).toBe('select NAME from USERS');
    expect(removeComments(sql)).not.toContain('comment');
  });

  it('extracts tables and reports validation warnings', () => {
    const sql = `
      SELECT * FROM users
      JOIN teams ON users.team_id = teams.id
      WHERE 1 = 1
    `;

    expect(extractTables(sql)).toEqual(['users', 'teams']);

    const validation = validateSql(sql);
    expect(validation.valid).toBe(true);
    expect(validation.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining('SELECT *'),
        expect.stringContaining('WHERE 1=1'),
      ])
    );
  });

  it('builds reusable statement templates', () => {
    expect(generateInsertTemplate('users', ['id', 'name'])).toBe(
      'INSERT INTO users (id, name)\nVALUES (?, ?);'
    );
    expect(generateSelectTemplate('projects', ['id', 'slug'])).toBe(
      'SELECT id, slug\nFROM projects\nWHERE 1 = 1;'
    );
  });
});
