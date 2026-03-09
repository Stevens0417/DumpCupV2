import { z } from 'zod'

export const allocationRowSchema = z.object({
  rank_order: z.number().int().min(1),
  percentage_weight: z.number().gte(0, 'Must be >= 0'),
})

export const allocationsSchema = z.array(allocationRowSchema)

export type AllocationRow = z.infer<typeof allocationRowSchema>
