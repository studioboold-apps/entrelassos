/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { eq } from 'drizzle-orm';

import type { Database } from '../../database/client';
import { isUniqueViolation } from '../../database/postgres-error';
import type { AuthenticatedUser } from '../shared/auth/authenticated-user.interface';
import { usersTable } from '../User/user.table';
import { EmailAlreadyRegisteredError } from './auth.error';
import { passwordCredentialsTable } from './auth.table';
import type {
  CreatePasswordAccountParams,
  PasswordAccountRepository,
  PasswordCredential,
} from './types/auth.types';

export function createPasswordAccountRepository(database: Database): PasswordAccountRepository {
  return {
    /**
     * A conferencia previa e conveniencia; quem decide e a constraint. Entre o
     * `select` e o `insert` cabe outro cadastro com o mesmo e-mail, e o unico
     * do banco e o unico lugar que ve os dois.
     */
    async create({
      email,
      fullName,
      passwordHash,
    }: CreatePasswordAccountParams): Promise<AuthenticatedUser> {
      try {
        return await database.transaction(async (transaction) => {
          const inserted = await transaction
            .insert(usersTable)
            .values({ email, fullName: fullName ?? null })
            .returning({ id: usersTable.id, email: usersTable.email });
          const user = inserted[0];
          if (user === undefined) throw new Error('insercao de usuario nao devolveu linha');

          await transaction.insert(passwordCredentialsTable).values({ userId: user.id, passwordHash });
          return { userId: user.id, email: user.email };
        });
      } catch (error) {
        if (isUniqueViolation(error)) throw new EmailAlreadyRegisteredError();
        throw error;
      }
    },

    /**
     * Devolve o usuario mesmo sem credencial (`passwordHash` indefinido): quem
     * entrou por Google existe e nao tem senha, e quem confere precisa saber a
     * diferenca entre "nao tem conta" e "tem conta sem senha" — as duas recusam,
     * mas so uma delas pode virar convite para criar senha depois.
     */
    async findCredentialByEmail(email: string): Promise<PasswordCredential | undefined> {
      const rows = await database
        .select({
          id: usersTable.id,
          email: usersTable.email,
          passwordHash: passwordCredentialsTable.passwordHash,
        })
        .from(usersTable)
        .leftJoin(passwordCredentialsTable, eq(passwordCredentialsTable.userId, usersTable.id))
        .where(eq(usersTable.email, email))
        .limit(1);
      const row = rows[0];
      if (row === undefined) return undefined;
      return {
        user: { userId: row.id, email: row.email },
        passwordHash: row.passwordHash ?? undefined,
      };
    },
  };
}
