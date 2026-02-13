import { BudgetSession, BudgetSessionFactory, BudgetTemplateKind } from "@/domain/models/BudgetSession";

export class AllocationTemplateManager {
  public addTemplate(session: BudgetSession, kind: BudgetTemplateKind): BudgetSession {
    const exists = session.templates.some((t) => t.kind === kind);
    if (exists) return session;
    return { ...session, templates: [...session.templates, BudgetSessionFactory.createTemplate(kind)] };
  }

  public removeTemplateById(session: BudgetSession, templateId: string): BudgetSession {
    return { ...session, templates: session.templates.filter((t) => t.id !== templateId) };
  }
}

