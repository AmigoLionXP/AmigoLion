import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterClientDto } from './dto/register-client.dto';
import { AuthUser } from '../common/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private async issueToken(user: AuthUser) {
    return {
      accessToken: await this.jwt.signAsync(user),
      user,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { rep: true, ownedCompanies: { take: 1 } },
    });
    if (!user) throw new UnauthorizedException('Credenciais inválidas.');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas.');

    const authUser: AuthUser = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.role === 'client' ? user.ownedCompanies[0]?.id : undefined,
      repId: user.role === 'rep' ? user.rep?.id : undefined,
    };
    return this.issueToken(authUser);
  }

  /** public → self-serve signup for the `client` role (1 CNPJ = 1 tenant). */
  async registerClient(dto: RegisterClientDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('E-mail já cadastrado.');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const referrer = dto.repCode
      ? await this.prisma.rep.findUnique({ where: { id: dto.repCode } })
      : null;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: 'client',
        ownedCompanies: {
          create: {
            nome: dto.nome,
            cnpj: dto.cnpj,
            setor: dto.setor,
            growthScore: 0,
            nivel7m: 1,
            ...(referrer
              ? { memberships: { create: { repId: referrer.id } } }
              : {}),
          },
        },
      },
      include: { ownedCompanies: true },
    });

    const authUser: AuthUser = {
      sub: user.id,
      email: user.email,
      role: 'client',
      companyId: user.ownedCompanies[0].id,
    };
    return this.issueToken(authUser);
  }
}
