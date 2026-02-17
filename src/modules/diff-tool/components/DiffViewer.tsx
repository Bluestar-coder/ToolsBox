import React, { useMemo } from 'react';
import type { Change } from 'diff';
import styles from './styles/DiffTool.module.css';

interface DiffViewerProps {
  changes: Change[];
  splitView?: boolean;
}

interface RenderRow {
  left?: { line: number; content: string; type: 'removed' | 'unchanged' };
  right?: { line: number; content: string; type: 'added' | 'unchanged' };
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ changes, splitView = true }) => {
  const splitRows = useMemo(() => {
    if (!splitView) return [];
    
    const result: RenderRow[] = [];
    let leftLine = 1;
    let rightLine = 1;

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      const nextChange = changes[i + 1];
      const lines = change.value.replace(/\n$/, '').split('\n');

      // Handle Modification (Removed followed by Added) - Align them
      if (change.removed && nextChange?.added) {
        const removedLines = lines;
        const addedLines = nextChange.value.replace(/\n$/, '').split('\n');
        const maxLen = Math.max(removedLines.length, addedLines.length);

        for (let j = 0; j < maxLen; j++) {
          result.push({
            left: removedLines[j] !== undefined 
              ? { line: leftLine++, content: removedLines[j], type: 'removed' } 
              : undefined,
            right: addedLines[j] !== undefined 
              ? { line: rightLine++, content: addedLines[j], type: 'added' } 
              : undefined,
          });
        }
        i++; // Skip next change
      } 
      // Handle Removed
      else if (change.removed) {
        lines.forEach(line => {
          result.push({
            left: { line: leftLine++, content: line, type: 'removed' },
            right: undefined,
          });
        });
      } 
      // Handle Added
      else if (change.added) {
        lines.forEach(line => {
          result.push({
            left: undefined,
            right: { line: rightLine++, content: line, type: 'added' },
          });
        });
      } 
      // Handle Unchanged
      else {
        lines.forEach(line => {
          result.push({
            left: { line: leftLine++, content: line, type: 'unchanged' },
            right: { line: rightLine++, content: line, type: 'unchanged' },
          });
        });
      }
    }
    return result;
  }, [changes, splitView]);

  const unifiedRows = useMemo(() => {
    if (splitView) return [];

    const result: { leftLine?: number; rightLine?: number; content: string; type: 'added' | 'removed' | 'unchanged' }[] = [];
    let leftLine = 1;
    let rightLine = 1;

    changes.forEach(change => {
      const lines = change.value.replace(/\n$/, '').split('\n');
      
      if (change.removed) {
        lines.forEach(line => {
          result.push({
            leftLine: leftLine++,
            content: line,
            type: 'removed'
          });
        });
      } else if (change.added) {
        lines.forEach(line => {
          result.push({
            rightLine: rightLine++,
            content: line,
            type: 'added'
          });
        });
      } else {
        lines.forEach(line => {
          result.push({
            leftLine: leftLine++,
            rightLine: rightLine++,
            content: line,
            type: 'unchanged'
          });
        });
      }
    });
    return result;
  }, [changes, splitView]);

  if (splitView) {
    return (
      <div className={styles.diffContainer}>
        <div className={styles.diffContent}>
          <table className={styles.diffTable}>
            <colgroup>
              <col width="50" />
              <col />
              <col width="50" />
              <col />
            </colgroup>
            <tbody>
              {splitRows.map((row, index) => (
                <tr key={index} className={styles.diffRow}>
                  {/* Left Side */}
                  <td className={`${styles.lineNumber} ${row.left?.type === 'removed' ? styles.gutterRemoved : ''}`}>
                    {row.left?.line || ''}
                  </td>
                  <td className={`${styles.codeCell} ${row.left?.type === 'removed' ? styles.removed : ''} ${!row.left ? styles.emptyRow : ''}`}>
                    {row.left?.content || ''}
                  </td>
                  
                  {/* Right Side */}
                  <td className={`${styles.lineNumber} ${row.right?.type === 'added' ? styles.gutterAdded : ''}`}>
                    {row.right?.line || ''}
                  </td>
                  <td className={`${styles.codeCell} ${row.right?.type === 'added' ? styles.added : ''} ${!row.right ? styles.emptyRow : ''}`}>
                    {row.right?.content || ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Unified View
  return (
    <div className={styles.diffContainer}>
      <div className={styles.diffContent}>
        <table className={styles.diffTable}>
          <colgroup>
            <col width="50" />
            <col width="50" />
            <col />
          </colgroup>
          <tbody>
            {unifiedRows.map((row, index) => {
              let rowClass = '';
              let gutterLeftClass = '';
              let gutterRightClass = '';
              
              if (row.type === 'added') {
                rowClass = styles.added;
                gutterRightClass = styles.gutterAdded;
              } else if (row.type === 'removed') {
                rowClass = styles.removed;
                gutterLeftClass = styles.gutterRemoved;
              }

              return (
                <tr key={index} className={styles.diffRow}>
                  <td className={`${styles.lineNumber} ${gutterLeftClass}`}>{row.leftLine || ''}</td>
                  <td className={`${styles.lineNumber} ${gutterRightClass}`}>{row.rightLine || ''}</td>
                  <td className={`${styles.codeCell} ${rowClass}`}>{row.content}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
