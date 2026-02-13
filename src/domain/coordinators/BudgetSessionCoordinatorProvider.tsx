"use client";

import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useStore } from "zustand";
import {
  BudgetSessionCoordinator,
  BudgetSessionCoordinatorState,
} from "@/domain/coordinators/BudgetSessionCoordinator";
import { SessionStorageManager } from "@/domain/managers/storage/SessionStorageManager";
import { SessionSerializer } from "@/domain/adapters/SessionSerializer";

const BudgetSessionCoordinatorContext = createContext<BudgetSessionCoordinator | null>(
  null,
);

export function BudgetSessionCoordinatorProvider(props: PropsWithChildren) {
  const coordinatorRef = useRef<BudgetSessionCoordinator | null>(null);
  const storageRef = useRef<SessionStorageManager | null>(null);
  const serializerRef = useRef<SessionSerializer | null>(null);

  if (!coordinatorRef.current) {
    coordinatorRef.current = new BudgetSessionCoordinator();
    storageRef.current = new SessionStorageManager();
    serializerRef.current = new SessionSerializer();

    const snapshot = storageRef.current.load();
    if (snapshot) {
      try {
        const restored = serializerRef.current.fromSnapshot(snapshot);
        coordinatorRef.current.setOriginalAndCurrentExplicit(restored.original, restored.current);
      } catch {
        coordinatorRef.current.startNew();
      }
    } else {
      coordinatorRef.current.startNew();
    }
  }

  useEffect(() => {
    const coordinator = coordinatorRef.current!;
    const storage = storageRef.current!;
    const serializer = serializerRef.current!;

    const unsubscribe = coordinator.getStore().subscribe((state) => {
      if (!state.originalSession || !state.currentSession) return;
      const snapshot = serializer.toSnapshot(state.originalSession, state.currentSession);
      storage.save(snapshot);
    });

    return unsubscribe;
  }, []);

  return (
    <BudgetSessionCoordinatorContext.Provider value={coordinatorRef.current}>
      {props.children}
    </BudgetSessionCoordinatorContext.Provider>
  );
}

export function useBudgetSessionCoordinator(): BudgetSessionCoordinator {
  const coordinator = useContext(BudgetSessionCoordinatorContext);
  if (!coordinator) {
    throw new Error("BudgetSessionCoordinatorProvider is missing.");
  }
  return coordinator;
}

export function useBudgetSessionState(): BudgetSessionCoordinatorState {
  const coordinator = useBudgetSessionCoordinator();
  const originalSession = useStore(coordinator.getStore(), (s) => s.originalSession);
  const currentSession = useStore(coordinator.getStore(), (s) => s.currentSession);

  // Memoize to keep referential stability for consumers.
  return useMemo(
    () => ({ originalSession, currentSession }),
    [originalSession, currentSession],
  );
}

