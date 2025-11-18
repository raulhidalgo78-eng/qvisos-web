"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { type Ad } from "@/types/ads"
import { ApproveButton } from "./ApproveButton"

export const columns: ColumnDef<Ad>[] = [
  {
    accessorKey: "title",
    header: "Título",
  },
  {
    accessorKey: "status",
    header: "Estado",
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      return <ApproveButton id={row.original.id} />
    },
  },
]
