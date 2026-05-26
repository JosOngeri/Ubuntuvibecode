import React, { useState, useMemo } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { BsArrowDownUp, BsChevronDown, BsChevronUp, BsThreeDotsVertical } from 'react-icons/bs';

const DataTable = ({ 
  columns, 
  data, 
  loading = false, 
  onRowClick = null,
  selectable = false,
  onSelectionChange = null,
  pageSize = 10,
  exportFormats = ['csv'],
  onExport = null 
}) => {
  const { getComponentSetting } = useSettings();

  // Get configurable settings
  const defaultPageSizeSetting = getComponentSetting('DataTable', 'defaultPageSize', 10);
  const actualPageSize = pageSize || defaultPageSizeSetting;

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [filter, setFilter] = useState('');

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply text filter
    if (filter) {
      filtered = filtered.filter(row => {
        return columns.some(col => {
          const value = row[col.key];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(filter.toLowerCase());
        });
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const comparison = aValue < bValue ? -1 : 1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, filter, sortConfig, columns]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / actualPageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * actualPageSize;
    const end = start + actualPageSize;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, actualPageSize]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    setSortConfig({ key, direction });
  };

  const handleRowSelect = (rowId) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId);
    } else {
      newSelection.add(rowId);
    }
    setSelectedRows(newSelection);
    if (onSelectionChange) {
      onSelectionChange(Array.from(newSelection));
    }
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(row => row.id)));
    }
    if (onSelectionChange) {
      onSelectionChange(selectedRows.size === paginatedData.length ? [] : paginatedData.map(row => row.id));
    }
  };

  const handleExport = (format) => {
    if (onExport) {
      onExport(format, filteredData);
    } else {
      // Default CSV export
      if (format === 'csv') {
        const headers = columns.map(col => col.label).join(',');
        const rows = filteredData.map(row => 
          columns.map(col => `"${row[col.key] || ''}"`).join(',')
        );
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.csv';
        a.click();
      }
    }
  };

  const renderCellValue = (row, column) => {
    const value = row[column.key];
    if (column.render) {
      return column.render(value, row);
    }
    if (value === null || value === undefined) return '-';
    return String(value);
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        Loading data...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />

        {/* Export */}
        {exportFormats.length > 0 && (
          <div className="flex gap-2">
            {exportFormats.map(format => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition"
              >
                Export {format.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                </th>
              )}
              {columns.map(column => (
                <th
                  key={column.key}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                  className={`px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition ${
                    column.sortable === false ? 'cursor-default' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable !== false && (
                      <span className="text-slate-400">
                        {sortConfig.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            <BsChevronUp size={14} />
                          ) : (
                            <BsChevronDown size={14} />
                          )
                        ) : (
                          <BsArrowDownUp size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={() => handleRowSelect(row.id)}
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                    </td>
                  )}
                  {columns.map(column => (
                    <td key={column.key} className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {renderCellValue(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing {(currentPage - 1) * actualPageSize + 1} to {Math.min(currentPage * actualPageSize, filteredData.length)} of {filteredData.length} entries
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 rounded-lg transition ${
                    currentPage === pageNum
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
