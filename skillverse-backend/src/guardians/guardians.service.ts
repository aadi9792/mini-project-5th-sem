import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class GuardiansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async verifyPassword(guardianId: string, password: string, intent: 'view' | 'action') {
    const guardian = await this.prisma.guardian.findUnique({ where: { id: guardianId } });
    if (!guardian) throw new UnauthorizedException('Guardian not found.');

    const valid = await bcrypt.compare(password, guardian.passwordHash ?? '');
    if (!valid) throw new UnauthorizedException('Incorrect password.');

    const expiresInSeconds = intent === 'view' ? 900 : 90;
    const secret = this.config.get<string>('JWT_GUARDIAN_ACTION_SECRET');

    const token = await this.jwtService.signAsync(
      { sub: guardianId, tier: intent },
      { secret, expiresIn: expiresInSeconds },
    );

    return { verified: true, guardianActionToken: token, tier: intent, expiresInSeconds };
  }

  async exportData(guardianId: string) {
    const guardian = await this.prisma.guardian.findUnique({ where: { id: guardianId } });
    if (!guardian) throw new NotFoundException('Guardian not found.');

    const child = await this.prisma.child.findFirst({ where: { guardianId } });
    const prefs = child ? await this.prisma.childPreferences.findUnique({ where: { childId: child.id } }) : null;
    const companions = child ? await this.prisma.childCompanion.findMany({ where: { childId: child.id } }) : [];
    const questCompletions = child ? await this.prisma.questCompletion.findMany({ where: { childId: child.id } }) : [];
    const realLifeQuests = child ? await this.prisma.realLifeQuest.findMany({ where: { childId: child.id } }) : [];
    const earnedBadges = child ? await this.prisma.earnedBadge.findMany({ where: { childId: child.id } }) : [];
    const ownedItems = child ? await this.prisma.ownedShopItem.findMany({ where: { childId: child.id } }) : [];
    const ownedCollectibles = child ? await this.prisma.ownedCollectible.findMany({ where: { childId: child.id } }) : [];
    const gameProgress = child ? await this.prisma.gameProgress.findMany({ where: { childId: child.id } }) : [];
    const diffProfiles = child ? await this.prisma.gameDifficultyProfile.findMany({ where: { childId: child.id } }) : [];
    const screenTime = child ? await this.prisma.screenTimeSettings.findUnique({ where: { childId: child.id } }) : null;
    const zoneCheckIns = child ? await this.prisma.zoneCheckIn.findMany({ where: { childId: child.id } }) : [];
    const consentRecords = await this.prisma.consentRecord.findMany({ where: { guardianId } });

    // Omit security material (passwordHash, token hashes)
    return {
      guardian: { id: guardian.id, name: guardian.name, email: guardian.email, createdAt: guardian.createdAt },
      child: child ? { ...child } : null,
      childPreferences: prefs,
      companions,
      questCompletions,
      realLifeQuests,
      earnedBadges,
      ownedItems,
      ownedCollectibles,
      gameProgress,
      difficultyProfiles: diffProfiles,
      screenTimeSettings: screenTime,
      zoneCheckIns,
      consentRecords: consentRecords.map((c) => ({
        id: c.id, guardianId: c.guardianId, confirmedGuardianStatus: c.confirmedGuardianStatus,
        dataStorageConsent: c.dataStorageConsent, nonMedicalDeviceAck: c.nonMedicalDeviceAck,
        marketingOptIn: c.marketingOptIn, consentTextVersion: c.consentTextVersion, createdAt: c.createdAt,
      })),
    };
  }

  async deleteAccount(guardianId: string, confirmationPhrase: string) {
    const child = await this.prisma.child.findFirst({ where: { guardianId } });
    if (!child) throw new NotFoundException('Child profile not found.');

    const expected = `delete ${child.nickname}'s account`;
    if (confirmationPhrase !== expected) {
      return { error: `Please type exactly: "${expected}"`, expected };
    }

    // Cascade delete in a transaction
    await this.prisma.$transaction(async (tx) => {
      if (child) {
        await tx.gameDifficultyProfile.deleteMany({ where: { childId: child.id } });
        await tx.questCompletion.deleteMany({ where: { childId: child.id } });
        await tx.realLifeQuest.deleteMany({ where: { childId: child.id } });
        await tx.earnedBadge.deleteMany({ where: { childId: child.id } });
        await tx.ownedShopItem.deleteMany({ where: { childId: child.id } });
        await tx.ownedCollectible.deleteMany({ where: { childId: child.id } });
        await tx.gameProgress.deleteMany({ where: { childId: child.id } });
        await tx.screenTimeSettings.deleteMany({ where: { childId: child.id } });
        await tx.playSession.deleteMany({ where: { childId: child.id } });
        await tx.zoneCheckIn.deleteMany({ where: { childId: child.id } });
        await tx.childCompanion.deleteMany({ where: { childId: child.id } });
        await tx.childPreferences.deleteMany({ where: { childId: child.id } });
        await tx.child.delete({ where: { id: child.id } });
      }
      await tx.consentRecord.deleteMany({ where: { guardianId } });
      await tx.refreshToken.deleteMany({ where: { guardianId } });
      await tx.emailVerificationToken.deleteMany({ where: { guardianId } });
      await tx.passwordResetToken.deleteMany({ where: { guardianId } });
      await tx.guardian.delete({ where: { id: guardianId } });
    });

    return { deleted: true };
  }
}
