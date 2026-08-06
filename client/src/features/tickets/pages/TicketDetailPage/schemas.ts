import { z } from "zod";

export const commentContentSchema = z.string().trim().min(1);
