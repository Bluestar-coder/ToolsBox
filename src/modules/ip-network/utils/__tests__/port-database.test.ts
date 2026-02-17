import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  searchByPort,
  searchByService,
  filterByPortRange,
  getHighFrequencyPorts,
  getAllPorts,
} from '../port-database';

describe('port-database', () => {
  describe('searchByPort', () => {
    it('should find SSH port 22', () => {
      const results = searchByPort(22);
      expect(results).toHaveLength(1);
      expect(results[0].service).toBe('SSH');
      expect(results[0].riskLevel).toBe('high');
    });

    it('should find HTTP port 80', () => {
      const results = searchByPort(80);
      expect(results).toHaveLength(1);
      expect(results[0].service).toBe('HTTP');
      expect(results[0].protocol).toBe('TCP');
    });

    it('should return empty array for non-existent port', () => {
      const results = searchByPort(99999);
      expect(results).toHaveLength(0);
    });

    it('should find all high-frequency penetration testing ports', () => {
      const highFreqPorts = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 995, 1433, 1521, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 27017];
      
      highFreqPorts.forEach(port => {
        const results = searchByPort(port);
        expect(results.length).toBeGreaterThan(0);
        // At least one entry should be high risk
        const hasHighRisk = results.some(entry => entry.riskLevel === 'high');
        expect(hasHighRisk).toBe(true);
      });
    });
  });

  describe('searchByService', () => {
    it('should find SSH by service name', () => {
      const results = searchByService('ssh');
      expect(results.length).toBeGreaterThan(0);
      const sshEntry = results.find(r => r.port === 22);
      expect(sshEntry).toBeDefined();
    });

    it('should be case-insensitive', () => {
      const lowerResults = searchByService('http');
      const upperResults = searchByService('HTTP');
      const mixedResults = searchByService('HtTp');
      
      expect(lowerResults.length).toBeGreaterThan(0);
      expect(upperResults).toEqual(lowerResults);
      expect(mixedResults).toEqual(lowerResults);
    });

    it('should search in description field', () => {
      const results = searchByService('database');
      expect(results.length).toBeGreaterThan(0);
      // Should find MySQL, PostgreSQL, MongoDB, etc.
      const mysqlEntry = results.find(r => r.port === 3306);
      expect(mysqlEntry).toBeDefined();
    });

    it('should return empty array for non-matching keyword', () => {
      const results = searchByService('nonexistentservice12345');
      expect(results).toHaveLength(0);
    });

    it('should find partial matches', () => {
      const results = searchByService('SQL');
      expect(results.length).toBeGreaterThan(0);
      // Should find MySQL, MSSQL, PostgreSQL, etc.
      const hasMysql = results.some(r => r.port === 3306);
      const hasMssql = results.some(r => r.port === 1433);
      expect(hasMysql || hasMssql).toBe(true);
    });
  });

  describe('filterByPortRange', () => {
    it('should filter well-known ports (1-1024)', () => {
      const results = filterByPortRange(1, 1024);
      expect(results.length).toBeGreaterThan(0);
      results.forEach(entry => {
        expect(entry.port).toBeGreaterThanOrEqual(1);
        expect(entry.port).toBeLessThanOrEqual(1024);
      });
    });

    it('should filter registered ports (1024-49151)', () => {
      const results = filterByPortRange(1024, 49151);
      expect(results.length).toBeGreaterThan(0);
      results.forEach(entry => {
        expect(entry.port).toBeGreaterThanOrEqual(1024);
        expect(entry.port).toBeLessThanOrEqual(49151);
      });
    });

    it('should filter single port range', () => {
      const results = filterByPortRange(80, 80);
      expect(results.length).toBeGreaterThan(0);
      results.forEach(entry => {
        expect(entry.port).toBe(80);
      });
    });

    it('should return empty array for range with no ports', () => {
      const results = filterByPortRange(60000, 60001);
      expect(results).toHaveLength(0);
    });

    it('should handle reversed range gracefully', () => {
      const results = filterByPortRange(100, 50);
      expect(results).toHaveLength(0);
    });
  });

  describe('getHighFrequencyPorts', () => {
    it('should return only high-risk ports', () => {
      const results = getHighFrequencyPorts();
      expect(results.length).toBeGreaterThan(0);
      results.forEach(entry => {
        expect(entry.riskLevel).toBe('high');
      });
    });

    it('should include all specified high-frequency ports', () => {
      const results = getHighFrequencyPorts();
      const ports = results.map(r => r.port);
      
      // Check for key high-frequency ports
      const expectedPorts = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 995, 1433, 1521, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 27017];
      
      expectedPorts.forEach(port => {
        expect(ports).toContain(port);
      });
    });

    it('should have at least 24 high-frequency ports', () => {
      const results = getHighFrequencyPorts();
      expect(results.length).toBeGreaterThanOrEqual(24);
    });
  });

  describe('getAllPorts', () => {
    it('should return all ports in database', () => {
      const results = getAllPorts();
      expect(results.length).toBeGreaterThan(150); // Should have ~200 ports
    });

    it('should return a copy of the database', () => {
      const results1 = getAllPorts();
      const results2 = getAllPorts();
      expect(results1).toEqual(results2);
      expect(results1).not.toBe(results2); // Different array instances
    });

    it('should include all risk levels', () => {
      const results = getAllPorts();
      const riskLevels = new Set(results.map(r => r.riskLevel));
      
      expect(riskLevels.has('high')).toBe(true);
      expect(riskLevels.has('medium')).toBe(true);
      expect(riskLevels.has('low')).toBe(true);
      expect(riskLevels.has('info')).toBe(true);
    });

    it('should include all protocol types', () => {
      const results = getAllPorts();
      const protocols = new Set(results.map(r => r.protocol));
      
      expect(protocols.has('TCP')).toBe(true);
      expect(protocols.has('UDP')).toBe(true);
      expect(protocols.has('TCP/UDP')).toBe(true);
    });
  });

  // Property 7: Port search result correctness
  describe('Property 7: Port search result correctness', () => {
    it('searchByPort returns only entries with matching port number', () => {
      const testPorts = [22, 80, 443, 3306, 8080];
      
      testPorts.forEach(port => {
        const results = searchByPort(port);
        results.forEach(entry => {
          expect(entry.port).toBe(port);
        });
      });
    });

    it('searchByService returns only entries containing keyword', () => {
      const keywords = ['http', 'ssh', 'database', 'sql'];
      
      keywords.forEach(keyword => {
        const results = searchByService(keyword);
        results.forEach(entry => {
          const lowerKeyword = keyword.toLowerCase();
          const matchesService = entry.service.toLowerCase().includes(lowerKeyword);
          const matchesDescription = entry.description.toLowerCase().includes(lowerKeyword);
          expect(matchesService || matchesDescription).toBe(true);
        });
      });
    });

    it('filterByPortRange returns only entries within range', () => {
      const ranges = [
        { start: 1, end: 100 },
        { start: 1000, end: 2000 },
        { start: 8000, end: 9000 },
      ];
      
      ranges.forEach(({ start, end }) => {
        const results = filterByPortRange(start, end);
        results.forEach(entry => {
          expect(entry.port).toBeGreaterThanOrEqual(start);
          expect(entry.port).toBeLessThanOrEqual(end);
        });
      });
    });
  });
});

// Feature: ip-network-tool, Property 7: 端口搜索结果正确性

describe('Property 7: Port search result correctness (Property-Based Tests)', () => {
  /**
   * **Validates: Requirements 5.2, 5.3, 5.4**
   *
   * For any port number query, searchByPort returns records where port field equals the query.
   * For any service keyword query, searchByService returns records where service or description
   * contains the keyword (case-insensitive).
   * For any port range [start, end], filterByPortRange returns records where port is within the range.
   */

  describe('searchByPort correctness', () => {
    it('returns only entries with exact port match for any valid port number', () => {
      const portArbitrary = fc.integer({ min: 0, max: 65535 });

      fc.assert(
        fc.property(portArbitrary, (port) => {
          const results = searchByPort(port);
          
          // All returned entries must have the exact port number
          results.forEach(entry => {
            expect(entry.port).toBe(port);
          });
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('searchByService correctness', () => {
    it('returns only entries containing the keyword in service or description (case-insensitive)', () => {
      // Generate random keywords from common service terms
      const keywordArbitrary = fc.oneof(
        fc.constantFrom('http', 'ssh', 'ftp', 'sql', 'database', 'mail', 'dns', 'web', 'server', 'remote'),
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
      );

      fc.assert(
        fc.property(keywordArbitrary, (keyword) => {
          const results = searchByService(keyword);
          const lowerKeyword = keyword.toLowerCase();
          
          // All returned entries must contain the keyword in service or description
          results.forEach(entry => {
            const matchesService = entry.service.toLowerCase().includes(lowerKeyword);
            const matchesDescription = entry.description.toLowerCase().includes(lowerKeyword);
            expect(matchesService || matchesDescription).toBe(true);
          });
        }),
        { numRuns: 100 },
      );
    });

    it('is case-insensitive for any keyword', () => {
      const keywordArbitrary = fc.constantFrom('HTTP', 'http', 'HtTp', 'SSH', 'ssh', 'SsH', 'FTP', 'ftp');

      fc.assert(
        fc.property(keywordArbitrary, (keyword) => {
          const results = searchByService(keyword);
          const lowerKeyword = keyword.toLowerCase();
          
          // Verify case-insensitivity by checking all results match lowercase version
          results.forEach(entry => {
            const matchesService = entry.service.toLowerCase().includes(lowerKeyword);
            const matchesDescription = entry.description.toLowerCase().includes(lowerKeyword);
            expect(matchesService || matchesDescription).toBe(true);
          });
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('filterByPortRange correctness', () => {
    it('returns only entries within the specified range [start, end]', () => {
      const rangeArbitrary = fc.tuple(
        fc.integer({ min: 0, max: 65535 }),
        fc.integer({ min: 0, max: 65535 }),
      ).map(([a, b]) => {
        // Ensure start <= end
        const start = Math.min(a, b);
        const end = Math.max(a, b);
        return { start, end };
      });

      fc.assert(
        fc.property(rangeArbitrary, ({ start, end }) => {
          const results = filterByPortRange(start, end);
          
          // All returned entries must have port within [start, end]
          results.forEach(entry => {
            expect(entry.port).toBeGreaterThanOrEqual(start);
            expect(entry.port).toBeLessThanOrEqual(end);
          });
        }),
        { numRuns: 100 },
      );
    });

    it('handles single-port ranges correctly', () => {
      const portArbitrary = fc.integer({ min: 0, max: 65535 });

      fc.assert(
        fc.property(portArbitrary, (port) => {
          const results = filterByPortRange(port, port);
          
          // All returned entries must have exactly this port
          results.forEach(entry => {
            expect(entry.port).toBe(port);
          });
        }),
        { numRuns: 100 },
      );
    });

    it('returns empty array when start > end', () => {
      const reversedRangeArbitrary = fc.tuple(
        fc.integer({ min: 100, max: 65535 }),
        fc.integer({ min: 0, max: 99 }),
      );

      fc.assert(
        fc.property(reversedRangeArbitrary, ([start, end]) => {
          // start > end (reversed range)
          const results = filterByPortRange(start, end);
          expect(results).toHaveLength(0);
        }),
        { numRuns: 100 },
      );
    });
  });
});
