import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NamingFilterService } from './naming-filter.service';

export function computeEvolutionStage(level: number) {
  if (level >= 25) {
    return { stage: 4, name: "Hero's Companion" };
  }
  if (level >= 10) {
    return { stage: 3, name: 'Trusted Companion' };
  }
  if (level >= 5) {
    return { stage: 2, name: 'Companion' };
  }
  return { stage: 1, name: 'Hatchling' };
}

@Injectable()
export class CompanionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly namingFilter: NamingFilterService,
  ) {}

  private async getChildForGuardian(guardianId: string) {
    const child = await this.prisma.child.findFirst({
      where: { guardianId },
    });
    if (!child) {
      throw new NotFoundException('No child profile found.');
    }
    return child;
  }

  async getCatalog(guardianId: string) {
    const child = await this.getChildForGuardian(guardianId);
    const templates = await this.prisma.companionTemplate.findMany();
    const owned = await this.prisma.childCompanion.findMany({
      where: { childId: child.id },
    });

    const ownedMap = new Map(owned.map((o) => [o.speciesId, o]));
    const childLevel = Math.floor((child.totalStars || 0) / 50) + 1;

    const catalog = templates.map((tpl) => {
      const isOwned = ownedMap.has(tpl.speciesId);
      const ownedRecord = ownedMap.get(tpl.speciesId);
      const isLocked = !tpl.isStarter && (tpl.unlockLevel ? childLevel < tpl.unlockLevel : true);

      return {
        ...tpl,
        locked: isLocked,
        adopted: isOwned,
        isActive: ownedRecord?.isActive ?? false,
        customName: ownedRecord?.customName ?? null,
        companionId: ownedRecord?.id ?? null,
      };
    });

    return { companions: catalog, childLevel };
  }

  async adoptCompanion(guardianId: string, speciesId: string, customName: string) {
    const validName = this.namingFilter.validateName(customName);
    const child = await this.getChildForGuardian(guardianId);

    const template = await this.prisma.companionTemplate.findUnique({
      where: { speciesId },
    });
    if (!template) {
      throw new NotFoundException('Companion species not found.');
    }

    const childLevel = Math.floor((child.totalStars || 0) / 50) + 1;
    if (!template.isStarter && template.unlockLevel && childLevel < template.unlockLevel) {
      throw new ForbiddenException(`This companion unlocks at Level ${template.unlockLevel}.`);
    }

    const existing = await this.prisma.childCompanion.findFirst({
      where: { childId: child.id, speciesId },
    });
    if (existing) {
      throw new ConflictException('You have already adopted this companion.');
    }

    // Auto-activate if first-ever companion (Tutorial Island flow, 03 §4.4)
    const totalOwned = await this.prisma.childCompanion.count({
      where: { childId: child.id },
    });
    const isActive = totalOwned === 0;

    const companion = await this.prisma.childCompanion.create({
      data: {
        childId: child.id,
        speciesId,
        customName: validName,
        isActive,
      },
    });

    return {
      companion: {
        ...companion,
        template,
      },
    };
  }

  async renameCompanion(guardianId: string, companionId: string, customName: string) {
    const validName = this.namingFilter.validateName(customName);
    const child = await this.getChildForGuardian(guardianId);

    const companion = await this.prisma.childCompanion.findUnique({
      where: { id: companionId },
    });
    if (!companion || companion.childId !== child.id) {
      throw new NotFoundException('Companion not found.');
    }

    const updated = await this.prisma.childCompanion.update({
      where: { id: companionId },
      data: { customName: validName },
    });

    return { companion: updated };
  }

  async activateCompanion(guardianId: string, companionId: string) {
    const child = await this.getChildForGuardian(guardianId);

    const target = await this.prisma.childCompanion.findUnique({
      where: { id: companionId },
    });
    if (!target || target.childId !== child.id) {
      throw new NotFoundException('Companion not found.');
    }

    // Deactivate all, then activate chosen
    await this.prisma.$transaction([
      this.prisma.childCompanion.updateMany({
        where: { childId: child.id },
        data: { isActive: false },
      }),
      this.prisma.childCompanion.update({
        where: { id: companionId },
        data: { isActive: true },
      }),
    ]);

    const active = await this.prisma.childCompanion.findUnique({
      where: { id: companionId },
    });

    return { companion: active };
  }

  async getMyCompanions(guardianId: string) {
    const child = await this.getChildForGuardian(guardianId);
    const owned = await this.prisma.childCompanion.findMany({
      where: { childId: child.id },
      orderBy: { adoptedAt: 'asc' },
    });

    const templates = await this.prisma.companionTemplate.findMany();
    const templateMap = new Map(templates.map((t) => [t.speciesId, t]));

    const enrichedOwned = owned.map((o) => ({
      ...o,
      template: templateMap.get(o.speciesId) || null,
    }));

    const active = enrichedOwned.find((o) => o.isActive) || null;
    const childLevel = Math.floor((child.totalStars || 0) / 50) + 1;
    const evolutionStage = computeEvolutionStage(childLevel);

    return {
      active,
      owned: enrichedOwned,
      childLevel,
      evolutionStage,
    };
  }
}

