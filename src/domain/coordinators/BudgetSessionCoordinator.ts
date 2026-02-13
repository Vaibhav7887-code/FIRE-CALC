import { createStore, StoreApi } from "zustand/vanilla";
import { BudgetSession, BudgetSessionFactory } from "@/domain/models/BudgetSession";

export type BudgetSessionCoordinatorState = Readonly<{
  originalSession: BudgetSession | null;
  currentSession: BudgetSession | null;
}>;

type State = BudgetSessionCoordinatorState;

type Actions = {
  setOriginalAndCurrent: (session: BudgetSession) => void;
  setOriginalAndCurrentExplicit: (original: BudgetSession, current: BudgetSession) => void;
  setCurrent: (session: BudgetSession) => void;
  resetToOriginal: () => void;
  startNew: () => void;
  clear: () => void;
};

type StoreState = State & Actions;

export class BudgetSessionCoordinator {
  private readonly store: StoreApi<StoreState>;

  public constructor() {
    this.store = createStore<StoreState>((set, get) => ({
      originalSession: null,
      currentSession: null,
      setOriginalAndCurrent: (session) =>
        set({ originalSession: session, currentSession: session }),
      setOriginalAndCurrentExplicit: (original, current) =>
        set({ originalSession: original, currentSession: current }),
      setCurrent: (session) => set({ currentSession: session }),
      resetToOriginal: () => {
        const original = get().originalSession;
        if (!original) return;
        set({ currentSession: original });
      },
      startNew: () => {
        const session = BudgetSessionFactory.createNew();
        set({ originalSession: session, currentSession: session });
      },
      clear: () => set({ originalSession: null, currentSession: null }),
    }));
  }

  public getStore(): StoreApi<StoreState> {
    return this.store;
  }

  public getState(): BudgetSessionCoordinatorState {
    const { originalSession, currentSession } = this.store.getState();
    return { originalSession, currentSession };
  }

  public hasSession(): boolean {
    return this.store.getState().currentSession !== null;
  }

  public setOriginalAndCurrent(session: BudgetSession): void {
    this.store.getState().setOriginalAndCurrent(session);
  }

  public setOriginalAndCurrentExplicit(original: BudgetSession, current: BudgetSession): void {
    this.store.getState().setOriginalAndCurrentExplicit(original, current);
  }

  public setCurrent(session: BudgetSession): void {
    this.store.getState().setCurrent(session);
  }

  public resetToOriginal(): void {
    this.store.getState().resetToOriginal();
  }

  public startNew(): void {
    this.store.getState().startNew();
  }

  public clear(): void {
    this.store.getState().clear();
  }
}

