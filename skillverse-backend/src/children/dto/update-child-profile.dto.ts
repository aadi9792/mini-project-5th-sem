import { IsString, Length, IsInt, Min, Max, IsArray, ArrayMinSize, ArrayMaxSize, IsIn, IsOptional } from 'class-validator';
import { VALID_INTERESTS } from './create-child.dto';

export class UpdateChildProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 20, { message: 'Please enter a nickname (2–20 characters).' })
  nickname?: string;

  @IsOptional()
  @IsInt()
  @Min(6, { message: 'Age must be between 6 and 17.' })
  @Max(17, { message: 'Age must be between 6 and 17.' })
  age?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Pick at least one thing they love.' })
  @ArrayMaxSize(5, { message: 'You can pick up to 5.' })
  @IsIn(VALID_INTERESTS, { each: true, message: 'Invalid interest selection.' })
  interests?: string[];
}

