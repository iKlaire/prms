import jwt, { SignOptions } from "jsonwebtoken";

export type AuthRole = "crew" | "passenger";

export interface AuthTokenPayload {
  sub: string;
  role: AuthRole;
}

interface JwtPayloadWithAuth extends jwt.JwtPayload {
  sub: string;
  role: AuthRole;
}

const defaultSecret = (): string => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required");
  }

  return "local-development-jwt-secret";
};

export class AuthTokenService {
  constructor(
    private readonly secret: string = defaultSecret(),
    private readonly expiresIn: SignOptions["expiresIn"] = "8h",
  ) {}

  sign(payload: AuthTokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token: string): AuthTokenPayload | null {
    try {
      const payload = jwt.verify(token, this.secret);
      if (!this.isAuthPayload(payload)) {
        return null;
      }

      return {
        sub: payload.sub,
        role: payload.role,
      };
    } catch {
      return null;
    }
  }

  private isAuthPayload(
    payload: string | jwt.JwtPayload,
  ): payload is JwtPayloadWithAuth {
    return (
      typeof payload !== "string" &&
      typeof payload.sub === "string" &&
      (payload.role === "crew" || payload.role === "passenger")
    );
  }
}
