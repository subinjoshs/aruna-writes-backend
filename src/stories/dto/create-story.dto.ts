import { IsNotEmpty, IsString } from 'class-validator';

export class CreateStoryDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  userId: number; // User ID to associate the story

  @IsNotEmpty()
  authorName:string
}
