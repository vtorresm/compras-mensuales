import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const { method, originalUrl } = req;
  const userAgent = req.get('User-Agent') || '';
  const ip = req.ip || req.connection.remoteAddress || '';

  console.log(`[${timestamp}] ${method} ${originalUrl} - ${ip} - ${userAgent}`);

  res.on('finish', () => {
    const { statusCode } = res;
    const contentLength = res.get('Content-Length');
    console.log(
      `[${timestamp}] ${method} ${originalUrl} - ${statusCode} - ${contentLength || 0} bytes`
    );
  });

  next();
};