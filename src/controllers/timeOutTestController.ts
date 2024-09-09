import { Request, Response, NextFunction, RequestHandler } from "express";

export const testingTimeOut: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  setTimeout(() => {
    if (!res.headersSent) {
      return res.status(503).json({ message: "Success: Process completed!" });
    }
  }, 8000);
};

export const fastapi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    return res
      .status(200)
      .json({ success: true, message: "this process is fast" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};
