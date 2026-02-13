"use client";

import { PropsWithChildren } from "react";
import { BudgetSessionCoordinatorProvider } from "@/domain/coordinators/BudgetSessionCoordinatorProvider";

export function Providers(props: PropsWithChildren) {
  return <BudgetSessionCoordinatorProvider>{props.children}</BudgetSessionCoordinatorProvider>;
}

