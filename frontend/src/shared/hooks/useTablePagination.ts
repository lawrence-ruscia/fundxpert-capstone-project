// hooks/useTablePagination.ts
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useTablePagination(defaultPageSize = 10) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get pagination values from URL or use defaults
  const pageIndex = parseInt(searchParams.get('page') || '1', 10) - 1;
  const pageSize = parseInt(
    searchParams.get('size') || defaultPageSize.toString(),
    10
  );

  const [pagination, setPagination] = useState({
    pageIndex: Math.max(0, pageIndex),
    pageSize: [10, 20, 30, 40, 50].includes(pageSize)
      ? pageSize
      : defaultPageSize,
  });

  // Sync pagination changes to URL
  const handlePaginationChange = useCallback(
    (updater: unknown) => {
      const newPagination =
        typeof updater === 'function' ? updater(pagination) : updater;

      setPagination(newPagination);

      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('page', (newPagination.pageIndex + 1).toString());
      newSearchParams.set('size', newPagination.pageSize.toString());
      setSearchParams(newSearchParams);
    },
    [pagination, searchParams, setSearchParams]
  );

  // Sync URL changes back to table state
  useEffect(() => {
    const urlPageIndex = parseInt(searchParams.get('page') || '1', 10) - 1;
    const urlPageSize = parseInt(
      searchParams.get('size') || defaultPageSize.toString(),
      10
    );

    setPagination(prev => {
      const newPageIndex = Math.max(0, urlPageIndex);
      const newPageSize = [10, 20, 30, 40, 50].includes(urlPageSize)
        ? urlPageSize
        : defaultPageSize;

      if (prev.pageIndex !== newPageIndex || prev.pageSize !== newPageSize) {
        return { pageIndex: newPageIndex, pageSize: newPageSize };
      }
      return prev;
    });
  }, [searchParams, defaultPageSize]);

  return {
    pagination,
    handlePaginationChange,
  };
}
