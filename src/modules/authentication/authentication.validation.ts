// import { Types } from "mongoose";
import { z } from "zod";
export const generalValidationFields = {
    // id: z.string().refine((value) => {
    // return Types.ObjectId.isValid(value);
    // }, "invalid ObjectId"),
    otp: z.string().regex(/^\d{6}$/),
    email: z.string({ error: "Email is required" }).email(),
    password: z
        .string({ error: "Password is required" })
        .min(6, { error: "Password must be at least 6 characters long" })
        .max(30, { error: "Password must be at most 30 characters long" })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,16}$/, {
            error:
                "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character",
        }),
    username: z.coerce
        .string({ error: "Username is required" })
        .min(2, { error: "Username must be at least 2 characters long" })
        .max(30, { error: "Username must be at most 30 characters long" }),
    confirmPassword: z.string({ error: "Confirm Password is required" }),
    phone: z.string().regex(/^(00201|\+201|01)[0|1|2|5]\d{8}$/),
    DOB: z.coerce.date().optional(),
    gender: z
        .enum(["male", "female", "not specified"], { error: "Gender is required" })
        .optional(),
    file: function (mimetype: string[]) {
        return z
            .strictObject({
                fieldname: z.string(),
                originalname: z.string(),
                encoding: z.string(),
                mimetype: z.enum(mimetype),
                buffer: z.any().optional(),
                path: z.string().optional(),
                destination: z.string().optional(),
                filename: z.string().optional(),
                size: z.number(),
            })
            .superRefine((args, ctx) => {
                if (!args.path && !args.buffer) {
                    ctx.addIssue({
                        code: "custom",
                        message: "buffer is required",
                        path: ["buffer"],
                    });
                }
            });
    },
};
export const login = z.strictObject({
    email: generalValidationFields.email,
    password: generalValidationFields.password
})
export const signup = login.safeExtend({
    username: generalValidationFields.username,
    confirmPassword: generalValidationFields.confirmPassword
}).superRefine((data, ctx) => {
    if (data.confirmPassword != data.password) {
        ctx.addIssue({
            code: "custom",
            path: ['confirmPassword'],
            message: "password mismatch confirmPassword"
        })
    }
})
