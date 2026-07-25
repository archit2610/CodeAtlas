import { z } from "zod";
declare const PlannerSchema: any;
type ResearchPlan = z.infer<typeof PlannerSchema>;
export declare const planResearch: (question: string, retrievedMemoryContext?: string) => Promise<ResearchPlan>;
export {};
//# sourceMappingURL=planner.d.ts.map