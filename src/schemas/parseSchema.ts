import { z } from 'zod';

export const parseFileSchema = z.object({
  file: z
    .custom<File>((val) => typeof val === 'object' && val !== null && 'size' in val && 'type' in val, 'Please upload a file.')
    .refine((file) => file.type === 'application/pdf', 'Only PDF files are allowed.')
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB.'),
});
