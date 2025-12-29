import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET missing in .env");
}

export const signToken = (userId: number) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: "7d", 
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};
