"use client";

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CSVLink } from 'react-csv';
import { ArrowUpDown, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';

type Column<T> = {
  header: string;
  accessorKey: string;
  cell?: (value: unknown, row: T) => React.ReactNode;
  enableSorting?: boolean;
  align?: 'left' | 'center' | 'right';
};

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  title?: string;
  description?: string;
  searchable?: boolean;
  exportable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
};

const DataTable = <T extends Record<string, unknown>>({
  data,
  columns,
  title,
  description,
  searchable = true,
  exportable = true,
  pagination = true,
  pageSize = 10,
  className = '',
  loading = false,
  emptyMessage = 'No data available',
  onRowClick
}: DataTableProps<T>) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Handle search
  const filteredData = searchQuery
    ? data.filter(item => 
        columns.some(column => {
          const value = item[column.accessorKey];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchQuery.toLowerCase());
        })
      )
    : data;

  // Handle sorting
  const sortedData = sortConfig
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        // Handle numeric comparison safely with type checking
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc'
            ? aValue - bValue
            : bValue - aValue;
        }
        
        // Default string comparison for other types
        return sortConfig.direction === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      })
    : filteredData;

  // Handle pagination
  const pageCount = Math.ceil(sortedData.length / pageSize);
  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;
  
  // Handle sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig?.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    
    setSortConfig({ key, direction });
  };

  // Prepare data for CSV export
  const exportData = filteredData.map(item => {
    const row: Record<string, unknown> = {};
    columns.forEach(column => {
      row[column.header] = item[column.accessorKey];
    });
    return row;
  });

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      
      {(searchable || exportable) && (
        <div className="flex items-center justify-between px-6 py-2">
          {searchable && (
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset page when searching
                }}
                className="pl-8"
              />
            </div>
          )}
          
          {exportable && (
            <CSVLink 
              data={exportData} 
              filename={`${title || 'data-export'}-${new Date().toISOString().split('T')[0]}.csv`}
              className="inline-flex items-center"
            >
              <Button variant="outline" size="sm" className="ml-auto">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CSVLink>
          )}
        </div>
      )}
      
      <CardContent className="p-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead
                    key={`header-${index}`}
                    className={column.align ? `text-${column.align}` : ''}
                  >
                    {column.enableSorting !== false ? (
                      <button
                        className="inline-flex items-center"
                        onClick={() => handleSort(column.accessorKey)}
                      >
                        {column.header}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Loading data...
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <TableRow 
                    key={`row-${rowIndex}`}
                    className={onRowClick ? "cursor-pointer hover:bg-muted" : ""}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {columns.map((column, colIndex) => (
                      <TableCell 
                        key={`cell-${rowIndex}-${colIndex}`}
                        className={column.align ? `text-${column.align}` : ''}
                      >
                        {column.cell
                          ? column.cell(row[column.accessorKey], row)
                          : String(row[column.accessorKey])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {pagination && pageCount > 1 && (
        <CardFooter className="flex items-center justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min(sortedData.length, (currentPage - 1) * pageSize + 1)} to{' '}
            {Math.min(sortedData.length, currentPage * pageSize)} of {sortedData.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              Page {currentPage} of {pageCount}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(pageCount, prev + 1))}
              disabled={currentPage === pageCount}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default DataTable; 