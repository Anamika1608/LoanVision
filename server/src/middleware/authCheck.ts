import { Request, Response, NextFunction } from "express";
import { AuthError } from "src/utils/error";

export const onlyIfLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return next(new AuthError("Not logged in! Please login to continue"));
  }
  next();
};

export const onlyAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return next(new AuthError("Not logged in! Please login to continue"));
  }
  if (req.session.role !== "admin") {
    return next(new AuthError("Forbidden: Admin access required"));
  }
  next();
};

export const onlyUser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return next(new AuthError("Not logged in! Please login to continue"));
  }
  if (req.session.role !== "user") {
    return next(new AuthError("Forbidden: User access required"));
  }
  next();
};
