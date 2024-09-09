import crypto from "crypto";

export const generateVerificationCode = () => {
  const token = crypto.randomBytes(20).toString("hex");
  const verificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  return verificationToken;
};
