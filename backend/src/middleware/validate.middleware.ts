import { NextFunction, Request, Response } from 'express';
import { ZodObject, ZodRawShape, ZodTypeAny } from 'zod';

type Schemas = {
  body?: ZodObject<ZodRawShape> | ZodTypeAny;
  query?: ZodObject<ZodRawShape> | ZodTypeAny;
  params?: ZodObject<ZodRawShape> | ZodTypeAny;
};

export const validate = (schemasOrSchema: Schemas | ZodTypeAny) => {
  const schemas: Schemas = ((): Schemas => {
    const candidate = schemasOrSchema as any;
    // If a single Zod schema is provided, default to body validation
    if (candidate && typeof candidate.parse === 'function' && !('body' in candidate) && !('query' in candidate) && !('params' in candidate)) {
      return { body: candidate as ZodTypeAny };
    }
    return schemasOrSchema as Schemas;
  })();

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query);
        req.query = parsedQuery as any;
      }
      if (schemas.params) {
        const parsedParams = schemas.params.parse(req.params);
        req.params = parsedParams as any;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};
