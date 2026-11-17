import { IsString, Length, IsInt, Min, Max, IsArray, ArrayMinSize, ArrayMaxSize, IsIn } from 'class-validator';

export const VALID_INTERESTS = [
  'space',
  'dinosaurs',
  'animals',
  'art',
  'music',
  'sports',
  'cars',
  'superheroes',
  'princesses_fairytales',
  'building_blocks',
  'nature_bugs',
  'reading_stories',
] as const;

export class CreateChildDto {
  @IsString()
  @Length(2, 20, { message: 'Please enter a nickname (2–20 characters).' })
  nickname: string;

  @IsInt()
  @Min(6, { message: 'Age must be between 6 and 17.' })
  @Max(17, { message: 'Age must be between 6 and 17.' })
  age: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'Pick at least one thing they love.' })
  @ArrayMaxSize(5, { message: 'You can pick up to 5.' })
  @IsIn(VALID_INTERESTS, { each: true, message: 'Invalid interest selection.' })
  interests: string[];
}

