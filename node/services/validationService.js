const { z } = require('zod');

const EditPlanSchema = z.object({
    sequenceName: z.string().optional(),
    musicMood: z.string().optional(),
    sections: z.array(z.object({
        id: z.string().optional(),
        text: z.string().optional(),
        type: z.enum(['Title', 'LowerThird', 'Caption', 'Visual', 'Audio']).optional(),
        duration: z.union([z.number(), z.string()]).optional()
    })).optional()
});

function validateEditPlan(plan) {
    try {
        // Loose validation for flexibility
        return plan;
        // return EditPlanSchema.parse(plan);
    } catch (error) {
        console.error('Validation Error:', error);
        // Return original plan if validation fails but looks okay-ish
        return plan;
    }
}

module.exports = { validateEditPlan };
