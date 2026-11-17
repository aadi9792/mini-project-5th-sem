import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildProfileDto } from './dto/update-child-profile.dto';
import { CreatePreferencesDto, UpdatePreferencesDto } from './dto/preferences.dto';

@Injectable()
export class ChildrenService {
  constructor(private readonly prisma: PrismaService) {}

  private parseChild(child: any) {
    if (!child) return null;
    return {
      ...child,
      interests: typeof child.interests === 'string' ? JSON.parse(child.interests || '[]') : child.interests,
    };
  }

  private parsePreferences(prefs: any) {
    if (!prefs) return null;
    return {
      ...prefs,
      q6RegulationStrategy:
        typeof prefs.q6RegulationStrategy === 'string'
          ? JSON.parse(prefs.q6RegulationStrategy || '[]')
          : prefs.q6RegulationStrategy,
      q12FirstFocusArea:
        typeof prefs.q12FirstFocusArea === 'string'
          ? JSON.parse(prefs.q12FirstFocusArea || '[]')
          : prefs.q12FirstFocusArea,
    };
  }

  async createChild(guardianId: string, dto: CreateChildDto) {
    // 02 §4.2: One child per guardian, enforced server-side (409 Conflict)
    const existing = await this.prisma.child.findFirst({
      where: { guardianId },
    });

    if (existing) {
      throw new ConflictException('A child profile already exists for this guardian account.');
    }

    const child = await this.prisma.child.create({
      data: {
        guardianId,
        nickname: dto.nickname.trim(),
        age: dto.age,
        interests: JSON.stringify(dto.interests),
      },
    });

    return {
      child: this.parseChild(child),
    };
  }

  async getMyChild(guardianId: string) {
    const child = await this.prisma.child.findFirst({
      where: { guardianId },
    });

    if (!child) {
      throw new NotFoundException('No child profile found for this account.');
    }

    const prefs = await this.prisma.childPreferences.findUnique({
      where: { childId: child.id },
    });

    return {
      child: this.parseChild(child),
      hasPreferences: !!prefs,
      tutorialCompleted: !!child.tutorialCompletedAt,
    };
  }

  async updateProfile(guardianId: string, childId: string, dto: UpdateChildProfileDto) {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      throw new NotFoundException('Child not found.');
    }
    if (child.guardianId !== guardianId) {
      throw new ForbiddenException('Access denied to this child profile.');
    }

    const updateData: any = {};
    if (dto.nickname !== undefined) updateData.nickname = dto.nickname.trim();
    if (dto.age !== undefined) updateData.age = dto.age;
    if (dto.interests !== undefined) updateData.interests = JSON.stringify(dto.interests);

    const updated = await this.prisma.child.update({
      where: { id: childId },
      data: updateData,
    });

    return {
      child: this.parseChild(updated),
    };
  }

  async createPreferences(guardianId: string, childId: string, dto: CreatePreferencesDto) {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      throw new NotFoundException('Child not found.');
    }
    if (child.guardianId !== guardianId) {
      throw new ForbiddenException('Access denied to this child profile.');
    }

    const data = {
      childId,
      q1Sound: dto.q1Sound,
      q2Motion: dto.q2Motion,
      q3Transitions: dto.q3Transitions,
      q4AttentionSpan: dto.q4AttentionSpan,
      q5SocialComfort: dto.q5SocialComfort,
      q6RegulationStrategy: JSON.stringify(dto.q6RegulationStrategy),
      q7CheckInStyle: dto.q7CheckInStyle,
      q8InstructionStyle: dto.q8InstructionStyle,
      q9GuidanceNeeded: dto.q9GuidanceNeeded,
      q10Predictability: dto.q10Predictability,
      q11Motor: dto.q11Motor,
      q12FirstFocusArea: JSON.stringify(dto.q12FirstFocusArea),
    };

    const prefs = await this.prisma.childPreferences.upsert({
      where: { childId },
      create: data,
      update: data,
    });

    return {
      preferences: this.parsePreferences(prefs),
    };
  }

  async updatePreferences(guardianId: string, childId: string, dto: UpdatePreferencesDto) {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      throw new NotFoundException('Child not found.');
    }
    if (child.guardianId !== guardianId) {
      throw new ForbiddenException('Access denied to this child profile.');
    }

    const updateData: any = {};
    if (dto.q1Sound !== undefined) updateData.q1Sound = dto.q1Sound;
    if (dto.q2Motion !== undefined) updateData.q2Motion = dto.q2Motion;
    if (dto.q3Transitions !== undefined) updateData.q3Transitions = dto.q3Transitions;
    if (dto.q4AttentionSpan !== undefined) updateData.q4AttentionSpan = dto.q4AttentionSpan;
    if (dto.q5SocialComfort !== undefined) updateData.q5SocialComfort = dto.q5SocialComfort;
    if (dto.q6RegulationStrategy !== undefined) updateData.q6RegulationStrategy = JSON.stringify(dto.q6RegulationStrategy);
    if (dto.q7CheckInStyle !== undefined) updateData.q7CheckInStyle = dto.q7CheckInStyle;
    if (dto.q8InstructionStyle !== undefined) updateData.q8InstructionStyle = dto.q8InstructionStyle;
    if (dto.q9GuidanceNeeded !== undefined) updateData.q9GuidanceNeeded = dto.q9GuidanceNeeded;
    if (dto.q10Predictability !== undefined) updateData.q10Predictability = dto.q10Predictability;
    if (dto.q11Motor !== undefined) updateData.q11Motor = dto.q11Motor;
    if (dto.q12FirstFocusArea !== undefined) updateData.q12FirstFocusArea = JSON.stringify(dto.q12FirstFocusArea);

    const prefs = await this.prisma.childPreferences.update({
      where: { childId },
      data: updateData,
    });

    return {
      preferences: this.parsePreferences(prefs),
    };
  }

  async updateTheme(guardianId: string, childId: string, theme: string) {
    if (!['space', 'ocean', 'jungle'].includes(theme)) {
      throw new BadRequestException('Invalid theme selection.');
    }
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
    });
    if (!child) {
      throw new NotFoundException('Child not found.');
    }
    if (child.guardianId !== guardianId) {
      throw new ForbiddenException('Access denied.');
    }

    const updated = await this.prisma.child.update({
      where: { id: childId },
      data: { activeTheme: theme },
    });

    return { child: this.parseChild(updated) };
  }

  async completeTutorial(guardianId: string, childId: string) {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      throw new NotFoundException('Child not found.');
    }
    if (child.guardianId !== guardianId) {
      throw new ForbiddenException('Access denied to this child profile.');
    }

    // Idempotent: if already set, return unchanged
    if (child.tutorialCompletedAt) {
      return { child: this.parseChild(child) };
    }

    const updated = await this.prisma.child.update({
      where: { id: childId },
      data: { tutorialCompletedAt: new Date() },
    });

    return {
      child: this.parseChild(updated),
    };
  }
}

