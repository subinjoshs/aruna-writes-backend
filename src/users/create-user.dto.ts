import { IsString, IsEmail, MinLength, IsNotEmpty, IsEnum } from 'class-validator';
import { UserRole } from './user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  username: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsEnum(UserRole, { message: 'Invalid role. Allowed values: user, admin, superuser' })
  role?: UserRole; // ✅ Ensure it matches the enum
}