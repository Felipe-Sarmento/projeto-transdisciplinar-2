import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { users } from '../database/schema/schema';

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: 'CLIENTE' | 'ADMIN';
}

type UserRow = typeof users.$inferSelect;

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  findByEmail(email: string): UserRow | undefined {
    const normalized = email.trim().toLowerCase();
    const rows = this.database.db
      .select()
      .from(users)
      .where(eq(users.email, normalized))
      .all();

    return rows[0];
  }

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const normalized = email.trim().toLowerCase();
    if (this.findByEmail(normalized) !== undefined) {
      return null;
    }

    const passwordHash = await hash(password);
    const result = this.database.db
      .insert(users)
      .values({
        name: name.trim(),
        email: normalized,
        passwordHash,
        role: 'CLIENTE',
      })
      .run();

    return {
      id: Number(result.lastInsertRowid),
      name: name.trim(),
      email: normalized,
      role: 'CLIENTE',
    };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const user = this.findByEmail(email);
    if (user === undefined) {
      return null;
    }

    const valid = await verify(user.passwordHash, password);
    if (!valid) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  signToken(user: AuthenticatedUser): Promise<string> {
    return this.jwtService.signAsync({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  }
}
