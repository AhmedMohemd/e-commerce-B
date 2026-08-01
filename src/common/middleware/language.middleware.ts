import type { NextFunction, Request, Response } from "express";

export const defaultLanguage = (req: Request, res: Response, next: NextFunction) => {
    req.headers['accept-language'] = req.headers['accept-language'] ?? 'en'
    next()
}

export const defaultLanguage2 = (req: Request, res: Response, next: NextFunction) => {
    console.log("I'm here222");
    next()
}