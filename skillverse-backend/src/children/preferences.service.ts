import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DerivedPreferences {
  // Q1
  soundDefaultOn: boolean;
  defaultVolume: number;
  // Q2
  calmModeDefault: boolean;
  particleIntensity: 'normal' | 'low' | 'off';
  // Q3
  countdownSeconds: number;
  autoTransitionWarning: boolean;
  // Q4
  defaultSessionMinutes: number;
  focusBlockMinutes: number;
  // Q5
  socialEntryMode: 'jump_in' | 'observe_first';
  // Q6
  regulationStrategyOrder: string[];
  // Q7
  proactiveCheckInsEnabled: boolean;
  // Q8
  instructionDensity: 'icons_only' | 'icons_plus_text' | 'short_sentences' | 'longer_text';
  // Q9
  hintDelaySeconds: number;
  taskBreakdownGranularity: 'coarse' | 'medium' | 'fine';
  // Q10
  predictabilityPromptsDefault: boolean;
  journeyLineVerbosity: 'detailed' | 'standard' | 'minimal';
  // Q11
  tapTargetSize: 'standard' | 'large' | 'extra_large';
  preferTapOverDrag: boolean;
  // Q12
  recommendedWorldOrder: string[];
}

export function computeDerivedPreferences(prefs: {
  q1Sound: string;
  q2Motion: string;
  q3Transitions: string;
  q4AttentionSpan: string;
  q5SocialComfort: string;
  q6RegulationStrategy: string[] | string;
  q7CheckInStyle: string;
  q8InstructionStyle: string;
  q9GuidanceNeeded: string;
  q10Predictability: string;
  q11Motor: string;
  q12FirstFocusArea: string[] | string;
}): DerivedPreferences {
  // Q1 Sound
  let soundDefaultOn = true;
  let defaultVolume = 100;
  if (prefs.q1Sound === 'mildly_sensitive') {
    soundDefaultOn = true;
    defaultVolume = 50;
  } else if (prefs.q1Sound === 'very_sensitive') {
    soundDefaultOn = false;
    defaultVolume = 0;
  }

  // Q2 Motion
  let calmModeDefault = false;
  let particleIntensity: 'normal' | 'low' | 'off' = 'normal';
  if (prefs.q2Motion === 'moderate_motion') {
    calmModeDefault = false;
    particleIntensity = 'low';
  } else if (prefs.q2Motion === 'prefers_calm') {
    calmModeDefault = true;
    particleIntensity = 'off';
  }

  // Q3 Transitions
  let countdownSeconds = 3;
  let autoTransitionWarning = false;
  if (prefs.q3Transitions === 'needs_warning') {
    countdownSeconds = 5;
    autoTransitionWarning = true;
  } else if (prefs.q3Transitions === 'needs_countdown') {
    countdownSeconds = 10;
    autoTransitionWarning = true;
  }

  // Q4 Attention Span
  let defaultSessionMinutes = 3;
  let focusBlockMinutes = 3;
  if (prefs.q4AttentionSpan === '3_to_7') {
    defaultSessionMinutes = 5;
    focusBlockMinutes = 7;
  } else if (prefs.q4AttentionSpan === '7_to_15') {
    defaultSessionMinutes = 10;
    focusBlockMinutes = 12;
  } else if (prefs.q4AttentionSpan === '15_plus') {
    defaultSessionMinutes = 15;
    focusBlockMinutes = 20;
  }

  // Q5 Social Comfort
  const socialEntryMode: 'jump_in' | 'observe_first' =
    prefs.q5SocialComfort === 'very_comfortable' ? 'jump_in' : 'observe_first';

  // Q6 Frustration Strategy
  const rawQ6: string[] = Array.isArray(prefs.q6RegulationStrategy)
    ? prefs.q6RegulationStrategy
    : JSON.parse(prefs.q6RegulationStrategy || '[]');

  let regulationStrategyOrder: string[] = [...rawQ6];
  if (rawQ6.length === 1 && rawQ6[0] === 'not_sure') {
    regulationStrategyOrder = ['quiet_time', 'breathing', 'movement', 'trusted_adult'];
  }

  // Q7 Check-in Style
  const proactiveCheckInsEnabled = prefs.q7CheckInStyle === 'gentle_checkins';

  // Q8 Instruction Style (direct passthrough)
  const instructionDensity = (prefs.q8InstructionStyle as any) || 'icons_plus_text';

  // Q9 Guidance
  let hintDelaySeconds = 45;
  let taskBreakdownGranularity: 'coarse' | 'medium' | 'fine' = 'coarse';
  if (prefs.q9GuidanceNeeded === 'a_few_prompts') {
    hintDelaySeconds = 20;
    taskBreakdownGranularity = 'medium';
  } else if (prefs.q9GuidanceNeeded === 'step_by_step') {
    hintDelaySeconds = 8;
    taskBreakdownGranularity = 'fine';
  }

  // Q10 Predictability
  let predictabilityPromptsDefault = false;
  let journeyLineVerbosity: 'detailed' | 'standard' | 'minimal' = 'minimal';
  if (prefs.q10Predictability === 'really_helps') {
    predictabilityPromptsDefault = true;
    journeyLineVerbosity = 'detailed';
  } else if (prefs.q10Predictability === 'somewhat') {
    predictabilityPromptsDefault = true;
    journeyLineVerbosity = 'standard';
  }

  // Q11 Motor
  let tapTargetSize: 'standard' | 'large' | 'extra_large' = 'standard';
  let preferTapOverDrag = false;
  if (prefs.q11Motor === 'some_difficulty') {
    tapTargetSize = 'large';
    preferTapOverDrag = false;
  } else if (prefs.q11Motor === 'significant_difficulty') {
    tapTargetSize = 'extra_large';
    preferTapOverDrag = true;
  }

  // Q12 First Focus Area
  const rawQ12: string[] = Array.isArray(prefs.q12FirstFocusArea)
    ? prefs.q12FirstFocusArea
    : JSON.parse(prefs.q12FirstFocusArea || '[]');

  const defaultWorlds = ['time', 'feelings', 'faces'];
  const remainingWorlds = defaultWorlds.filter((w) => !rawQ12.includes(w));
  const recommendedWorldOrder = [...rawQ12, ...remainingWorlds];

  return {
    soundDefaultOn,
    defaultVolume,
    calmModeDefault,
    particleIntensity,
    countdownSeconds,
    autoTransitionWarning,
    defaultSessionMinutes,
    focusBlockMinutes,
    socialEntryMode,
    regulationStrategyOrder,
    proactiveCheckInsEnabled,
    instructionDensity,
    hintDelaySeconds,
    taskBreakdownGranularity,
    predictabilityPromptsDefault,
    journeyLineVerbosity,
    tapTargetSize,
    preferTapOverDrag,
    recommendedWorldOrder,
  };
}

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getDerivedPreferences(childId: string): Promise<DerivedPreferences> {
    const prefs = await this.prisma.childPreferences.findUnique({
      where: { childId },
    });

    if (!prefs) {
      throw new NotFoundException('Preferences not found for this child.');
    }

    return computeDerivedPreferences({
      q1Sound: prefs.q1Sound,
      q2Motion: prefs.q2Motion,
      q3Transitions: prefs.q3Transitions,
      q4AttentionSpan: prefs.q4AttentionSpan,
      q5SocialComfort: prefs.q5SocialComfort,
      q6RegulationStrategy: prefs.q6RegulationStrategy,
      q7CheckInStyle: prefs.q7CheckInStyle,
      q8InstructionStyle: prefs.q8InstructionStyle,
      q9GuidanceNeeded: prefs.q9GuidanceNeeded,
      q10Predictability: prefs.q10Predictability,
      q11Motor: prefs.q11Motor,
      q12FirstFocusArea: prefs.q12FirstFocusArea,
    });
  }
}

