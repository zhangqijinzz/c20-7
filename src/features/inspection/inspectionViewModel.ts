import { analyzeLayout } from '../../shared/layoutRules'
import type { LayoutAnalysis, WorkspacePlan } from '../../shared/models'

export interface InspectionState {
  analysis: LayoutAnalysis
  issueIds: string[]
  issueCount: number
}

export function inspectPlan(plan: WorkspacePlan): InspectionState {
  const analysis = analyzeLayout(plan)
  // 一台设备同时越界、压住走线区时只按一个问题统计
  const issueIds = [...new Set([
    ...analysis.overlapIds,
    ...analysis.outOfBoundsIds,
    ...analysis.forbiddenItemIds,
    ...analysis.cableItemIds,
  ])]
  return { analysis, issueIds, issueCount: issueIds.length }
}
