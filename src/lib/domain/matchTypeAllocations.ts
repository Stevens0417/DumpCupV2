import { z } from 'zod'

export const allocationRowSchema = z.object({
  rank_order: z.number().int().min(1),
  percentage_weight: z.number().gt(0, 'Must be greater than 0').lte(1, 'Must be at most 1.0'),
})

export const allocationsSchema = z.array(allocationRowSchema).refine(
  (rows) => Math.abs(rows.reduce((sum, r) => sum + r.percentage_weight, 0) - 1.0) <= 0.0001,
  { message: 'Weights must sum to 1.0' }
)

export type AllocationRow = z.infer<typeof allocationRowSchema>
