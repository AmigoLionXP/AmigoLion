import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Isolation lives here, not only in the frontend (backend_contract.md: "Isolamento é crítico").
 * `client` only ever resolves its own company; `rep` only resolves reps in its own downline.
 */
@Injectable()
export class TenantScopeService {
  constructor(private prisma: PrismaService) {}

  async requireOwnCompany(userId: string, companyId?: string) {
    if (!companyId) throw new ForbiddenException('Nenhuma empresa vinculada a este usuário.');
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company || company.ownerUserId !== userId) {
      throw new ForbiddenException('Empresa fora do escopo deste usuário.');
    }
    return company;
  }

  /** Returns the rep's own id plus every rep id in its downline (recursive). */
  async downlineRepIds(rootRepId: string): Promise<string[]> {
    const ids = new Set<string>([rootRepId]);
    let frontier = [rootRepId];
    while (frontier.length) {
      const children = await this.prisma.rep.findMany({
        where: { uplineRepId: { in: frontier } },
        select: { id: true },
      });
      frontier = children.map((c) => c.id).filter((id) => !ids.has(id));
      frontier.forEach((id) => ids.add(id));
    }
    return Array.from(ids);
  }

  /** Full upline chain starting at repId (self first, then upline, ... to the root). */
  async uplineChain(repId: string) {
    const chain: { id: string; nivel: number; uplineRepId: string | null }[] = [];
    let current = await this.prisma.rep.findUnique({ where: { id: repId } });
    while (current) {
      chain.push({ id: current.id, nivel: current.nivel, uplineRepId: current.uplineRepId });
      current = current.uplineRepId
        ? await this.prisma.rep.findUnique({ where: { id: current.uplineRepId } })
        : null;
    }
    return chain;
  }
}
