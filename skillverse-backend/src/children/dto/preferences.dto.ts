import {
  IsString,
  IsIn,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
} from 'class-validator';

export const Q1_OPTIONS = ['not_bothered', 'mildly_sensitive', 'very_sensitive'] as const;
export const Q2_OPTIONS = ['enjoys_motion', 'moderate_motion', 'prefers_calm'] as const;
export const Q3_OPTIONS = ['transitions_easily', 'needs_warning', 'needs_countdown'] as const;
export const Q4_OPTIONS = ['under_3', '3_to_7', '7_to_15', '15_plus'] as const;
export const Q5_OPTIONS = ['very_comfortable', 'somewhat_shy', 'observes_first'] as const;
export const Q6_OPTIONS = ['quiet_time', 'breathing', 'trusted_adult', 'movement', 'not_sure'] as const;
export const Q7_OPTIONS = ['gentle_checkins', 'only_when_asked'] as const;
export const Q8_OPTIONS = ['icons_only', 'icons_plus_text', 'short_sentences', 'longer_text'] as const;
export const Q9_OPTIONS = ['independent', 'a_few_prompts', 'step_by_step'] as const;
export const Q10_OPTIONS = ['really_helps', 'somewhat', 'not_major'] as const;
export const Q11_OPTIONS = ['no_difficulty', 'some_difficulty', 'significant_difficulty'] as const;
export const Q12_OPTIONS = ['time', 'feelings', 'faces'] as const;

export class CreatePreferencesDto {
  @IsString()
  @IsIn(Q1_OPTIONS, { message: 'Invalid answer for Q1 Sound sensitivity.' })
  q1Sound: string;

  @IsString()
  @IsIn(Q2_OPTIONS, { message: 'Invalid answer for Q2 Motion response.' })
  q2Motion: string;

  @IsString()
  @IsIn(Q3_OPTIONS, { message: 'Invalid answer for Q3 Transitions handling.' })
  q3Transitions: string;

  @IsString()
  @IsIn(Q4_OPTIONS, { message: 'Invalid answer for Q4 Attention span.' })
  q4AttentionSpan: string;

  @IsString()
  @IsIn(Q5_OPTIONS, { message: 'Invalid answer for Q5 Social comfort.' })
  q5SocialComfort: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Pick at least one option for Q6 Frustration strategy.' })
  @IsIn(Q6_OPTIONS, { each: true, message: 'Invalid option in Q6 Frustration strategy.' })
  q6RegulationStrategy: string[];

  @IsString()
  @IsIn(Q7_OPTIONS, { message: 'Invalid answer for Q7 Check-in style.' })
  q7CheckInStyle: string;

  @IsString()
  @IsIn(Q8_OPTIONS, { message: 'Invalid answer for Q8 Instruction style.' })
  q8InstructionStyle: string;

  @IsString()
  @IsIn(Q9_OPTIONS, { message: 'Invalid answer for Q9 Guidance level.' })
  q9GuidanceNeeded: string;

  @IsString()
  @IsIn(Q10_OPTIONS, { message: 'Invalid answer for Q10 Predictability.' })
  q10Predictability: string;

  @IsString()
  @IsIn(Q11_OPTIONS, { message: 'Invalid answer for Q11 Motor difficulty.' })
  q11Motor: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Pick at least one focus area for Q12.' })
  @ArrayMaxSize(2, { message: 'Pick up to 2 focus areas for Q12.' })
  @IsIn(Q12_OPTIONS, { each: true, message: 'Invalid focus area selection for Q12.' })
  q12FirstFocusArea: string[];
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  @IsIn(Q1_OPTIONS)
  q1Sound?: string;

  @IsOptional()
  @IsString()
  @IsIn(Q2_OPTIONS)
  q2Motion?: string;

  @IsOptional()
  @IsString()
  @IsIn(Q3_OPTIONS)
  q3Transitions?: string;

  @IsOptional()
  @IsString()
  @IsIn(Q4_OPTIONS)
  q4AttentionSpan?: string;

  @IsOptional()
  @IsString()
  @IsIn(Q5_OPTIONS)
  q5SocialComfort?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(Q6_OPTIONS, { each: true })
  q6RegulationStrategy?: string[];

  @IsOptional()
  @IsString()
  @IsIn(Q7_OPTIONS)
  q7CheckInStyle?: string;

  @IsOptional()
  @IsString()
  @IsIn(Q8_OPTIONS)
  q8InstructionStyle?: string;

  @IsOptional()
  @IsString()
  @IsIn(Q9_OPTIONS)
  q9GuidanceNeeded?: string;

  @IsOptional()
  @IsString()
  @IsIn(Q10_OPTIONS)
  q10Predictability?: string;

  @IsOptional()
  @IsString()
  @IsIn(Q11_OPTIONS)
  q11Motor?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @IsIn(Q12_OPTIONS, { each: true })
  q12FirstFocusArea?: string[];
}

