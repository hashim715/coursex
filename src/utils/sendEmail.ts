import * as postmark from "postmark";
import dotenv from "dotenv";
dotenv.config();

export const client = new postmark.ServerClient(
  `${process.env.EMAIL_USERNAME}`
);
