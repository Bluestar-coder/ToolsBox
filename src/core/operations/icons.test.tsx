import { describe, expect, it } from 'vitest';
import { getOperationIcon, registerIcon } from './icons';

describe('operation icons', () => {
  it('returns a fallback icon for unknown names', () => {
    expect(getOperationIcon('UnknownIcon')).toBeTruthy();
  });

  it('returns registered icons after overriding the map', () => {
    registerIcon('CustomIcon', <span>custom-icon</span>);
    expect(getOperationIcon('CustomIcon')).toEqual(<span>custom-icon</span>);
  });
});
