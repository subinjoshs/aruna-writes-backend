import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, UnauthorizedException, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './create-user.dto';
import * as bcrypt from 'bcryptjs';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // ✅ Exclude the password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      statusCode: 200,
      message: 'Login successful',
      user: userWithoutPassword
    };
  }
  @Patch('update-profile-picture')
  async updateProfilePicture(
    @Body() body: { userId: number; email: string; profileUrl: string }
  ) {
    const { userId, email, profileUrl } = body;
    const updatedUser = await this.usersService.updateProfilePicture(userId, email, profileUrl);
    if (!updatedUser) {
      throw new NotFoundException('User not found or email mismatch');
    }
    return {
      statusCode: 200,
      message: 'Profile picture updated successfully',
    };
  }
  @Patch('update-role')
  async updateUserRole(
    @Body() body: { userId: number; email: string; role: string }
  ) {
    const { userId, email, role } = body;
    const updatedUser = await this.usersService.updateUserRole(userId, email, role);
    if (!updatedUser) {
      throw new NotFoundException('User not found or email mismatch');
    }
    return {
      statusCode: 200,
      message: 'User role updated successfully',
    };
  }
  @Delete(':id')
  async deleteUser(@Param('id') id: number) {
    const deleted = await this.usersService.deleteUser(id);
    if (!deleted) {
      throw new NotFoundException('User not found');
    }
    return {
      statusCode: 200,
      message: 'User deleted successfully',
    };

  }
  @Get('all')
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

}