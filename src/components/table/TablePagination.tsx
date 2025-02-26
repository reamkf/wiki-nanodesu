"use client";

import React from "react";
import { Table } from "@tanstack/react-table";
import { Select, MenuItem, IconButton } from "@mui/material";
import {
	FirstPage,
	LastPage,
	NavigateNext,
	NavigateBefore,
} from "@mui/icons-material";

interface TablePaginationProps<T> {
	table: Table<T>;
	pageSizes?: number[];
}

export function TablePagination<T>({
	table,
	pageSizes = [500, 200, 100, 50, 20, 10],
}: TablePaginationProps<T>) {
	return (
		<div className="overflow-x-auto max-w-full">
			<div className="flex items-center px-1 py-2 gap-4 min-w-[720px] max-w-[1920px]">
				{/* ページサイズ指定 */}
				<div className="flex items-center gap-2">
					<span className="text-sm text-gray-700">
						1ページあたりの表示件数:
					</span>
					<Select
						value={table.getState().pagination.pageSize}
						onChange={(e) => table.setPageSize(Number(e.target.value))}
						size="small"
						className="min-w-[80px]"
					>
						{pageSizes.map((pageSize) => (
							<MenuItem key={pageSize} value={pageSize}>
								{pageSize}
							</MenuItem>
						))}
					</Select>
				</div>

				<div className="flex items-center gap-2">
					{/* ページ移動ボタン */}
					<div className="flex items-center gap-1">
						<IconButton
							size="small"
							onClick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}
						>
							<FirstPage />
						</IconButton>
						<IconButton
							size="small"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							<NavigateBefore />
						</IconButton>
						<span className="text-sm text-gray-700 mx-2">
							{table.getState().pagination.pageIndex + 1} /{" "}
							{table.getPageCount()}
						</span>
						<IconButton
							size="small"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							<NavigateNext />
						</IconButton>
						<IconButton
							size="small"
							onClick={() => table.setPageIndex(table.getPageCount() - 1)}
							disabled={!table.getCanNextPage()}
						>
							<LastPage />
						</IconButton>
					</div>
				</div>
			</div>
		</div>
	);
}
