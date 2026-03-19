import React, { useMemo, useState } from 'react';

export interface SimpleTableFilterOption {
  text: React.ReactNode;
  value: string;
}

export interface SimpleTableColumn<T> {
  title: React.ReactNode;
  key: string;
  dataIndex?: keyof T | string;
  width?: number | string;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  sorter?: (a: T, b: T) => number;
  filters?: SimpleTableFilterOption[];
  onFilter?: (value: string, record: T) => boolean;
}

export interface SimpleTablePagination {
  pageSize: number;
  showSizeChanger?: boolean;
  pageSizeOptions?: string[];
  showTotal?: (total: number) => React.ReactNode;
}

interface SimpleDataTableProps<T> {
  columns: SimpleTableColumn<T>[];
  dataSource: T[];
  rowKey: keyof T | ((record: T, index: number) => string);
  pagination?: false | SimpleTablePagination;
  scroll?: { x?: number | string; y?: number | string };
  emptyText?: React.ReactNode;
}

type SortOrder = 'asc' | 'desc' | null;

function getCellValue<T>(record: T, dataIndex?: keyof T | string) {
  if (!dataIndex) {
    return undefined;
  }
  if (typeof dataIndex === 'string') {
    return (record as Record<string, unknown>)[dataIndex];
  }
  return record[dataIndex];
}

function getRowKey<T>(
  record: T,
  index: number,
  rowKey: keyof T | ((record: T, index: number) => string)
) {
  if (typeof rowKey === 'function') {
    return rowKey(record, index);
  }
  return String(record[rowKey]);
}

function SortButton({
  active,
  order,
  onClick,
}: {
  active: boolean;
  order: SortOrder;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="sort"
      style={{
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        color: active ? '#1677ff' : '#999',
        padding: 0,
        marginLeft: 6,
        fontSize: 12,
      }}
    >
      {order === 'asc' ? '↑' : order === 'desc' ? '↓' : '↕'}
    </button>
  );
}

export default function SimpleDataTable<T>({
  columns,
  dataSource,
  rowKey,
  pagination = false,
  scroll,
  emptyText = 'No data',
}: SimpleDataTableProps<T>) {
  const paginationConfig = pagination || undefined;
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(paginationConfig?.pageSize ?? 10);

  const filteredAndSorted = useMemo(() => {
    let result = [...dataSource];

    result = result.filter((record) =>
      columns.every((column) => {
        const filterValue = filterValues[column.key];
        if (!filterValue || !column.onFilter) {
          return true;
        }
        return column.onFilter(filterValue, record);
      })
    );

    if (sortKey && sortOrder) {
      const column = columns.find((item) => item.key === sortKey);
      if (column?.sorter) {
        result.sort((a, b) => {
          const value = column.sorter!(a, b);
          return sortOrder === 'asc' ? value : -value;
        });
      }
    }

    return result;
  }, [columns, dataSource, filterValues, sortKey, sortOrder]);

  const total = filteredAndSorted.length;
  const totalPages =
    paginationConfig && pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  const currentPageSafe = Math.min(currentPage, totalPages);

  const pagedRows = useMemo(() => {
    if (!paginationConfig) {
      return filteredAndSorted;
    }
    const start = (currentPageSafe - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [currentPageSafe, filteredAndSorted, pageSize, paginationConfig]);

  const wrapperStyle: React.CSSProperties = {
    width: '100%',
    overflowX: scroll?.x ? 'auto' : undefined,
    overflowY: scroll?.y ? 'auto' : undefined,
    maxHeight: typeof scroll?.y === 'number' ? scroll.y : scroll?.y,
    border: '1px solid #f0f0f0',
    borderRadius: 8,
  };

  return (
    <div>
      <div style={wrapperStyle}>
        <table
          role="table"
          style={{
            width: scroll?.x ? 'max-content' : '100%',
            minWidth: '100%',
            borderCollapse: 'collapse',
            background: '#fff',
          }}
        >
          <thead>
            <tr>
              {columns.map((column) => {
                const active = sortKey === column.key && sortOrder !== null;
                return (
                  <th
                    key={column.key}
                    style={{
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: 13,
                      padding: '10px 12px',
                      borderBottom: '1px solid #f0f0f0',
                      background: '#fafafa',
                      width: column.width,
                      verticalAlign: 'top',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>{column.title}</span>
                      {column.sorter && (
                        <SortButton
                          active={active}
                          order={sortKey === column.key ? sortOrder : null}
                          onClick={() => {
                            setCurrentPage(1);
                            if (sortKey !== column.key) {
                              setSortKey(column.key);
                              setSortOrder('asc');
                              return;
                            }
                            if (sortOrder === 'asc') {
                              setSortOrder('desc');
                            } else if (sortOrder === 'desc') {
                              setSortOrder(null);
                              setSortKey(null);
                            } else {
                              setSortOrder('asc');
                            }
                          }}
                        />
                      )}
                    </div>
                    {column.filters && column.onFilter && (
                      <select
                        aria-label={`filter-${column.key}`}
                        value={filterValues[column.key] ?? ''}
                        onChange={(event) => {
                          setCurrentPage(1);
                          setFilterValues((previous) => ({
                            ...previous,
                            [column.key]: event.target.value,
                          }));
                        }}
                        style={{
                          marginTop: 8,
                          width: '100%',
                          padding: '4px 6px',
                          fontSize: 12,
                        }}
                      >
                        <option value="">All</option>
                        {column.filters.map((option) => (
                          <option key={option.value} value={option.value}>
                            {typeof option.text === 'string' ? option.text : option.value}
                          </option>
                        ))}
                      </select>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pagedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ padding: 24, textAlign: 'center', color: '#999' }}
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              pagedRows.map((record, index) => (
                <tr key={getRowKey(record, index, rowKey)}>
                  {columns.map((column) => {
                    const value = getCellValue(record, column.dataIndex);
                    return (
                      <td
                        key={column.key}
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid #f5f5f5',
                          verticalAlign: 'top',
                          width: column.width,
                        }}
                      >
                        {column.render ? column.render(value, record, index) : String(value ?? '')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {paginationConfig && total > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginTop: 12,
            flexWrap: 'wrap',
            fontSize: 12,
          }}
        >
          <div>{paginationConfig.showTotal ? paginationConfig.showTotal(total) : `Total ${total}`}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {paginationConfig.showSizeChanger && (
              <select
                aria-label="page-size"
                value={String(pageSize)}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
              >
                {(paginationConfig.pageSizeOptions ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option} / page
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPageSafe <= 1}
            >
              Prev
            </button>
            <span>
              {currentPageSafe} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPageSafe >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
