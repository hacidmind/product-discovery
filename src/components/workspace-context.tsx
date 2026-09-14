"use client";

import { createContext, useContext } from "react";
import type { Product } from "@/lib/types";

export const WorkspaceContext = createContext<{
  openWorkspace: (product: Product, destination?: string) => void;
  createWorkspace: () => void;
}>({ openWorkspace: () => {}, createWorkspace: () => {} });

export const useWorkspace = () => useContext(WorkspaceContext);
