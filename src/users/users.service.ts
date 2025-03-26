import { Injectable, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) { }

    async createUser(createUserDto: CreateUserDto) {
        const { username, email, password, role } = createUserDto;

        // Check if user already exists
        const existingUser = await this.usersRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new HttpException({
                statusCode: HttpStatus.CONFLICT,
                message: 'User with this email already exists'
            }, HttpStatus.CONFLICT);
        }

        try {
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user
            const newUser = this.usersRepository.create({
                username,
                email,
                password: hashedPassword,
                role: role || UserRole.USER,
                superuserRole: 'N',
            });

            await this.usersRepository.save(newUser);
            return {
                statusCode: HttpStatus.CREATED,
                message: 'User successfully registered'
            };
        } catch (error) {
            throw new HttpException({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Error creating user'
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }
    async updateProfilePicture(userId: number, email: string, profileUrl: string): Promise<User | null> {
        // Find user by ID and Email
        const user = await this.usersRepository.findOne({ where: { id: userId, email } });

        if (!user) {
            return null; // User not found or email mismatch
        }

        // ✅ Update the profile picture
        user.profilePicture = profileUrl;
        return await this.usersRepository.save(user);
    }
    async updateUserRole(userId: number, email: string, role: string) {
        const user = await this.usersRepository.findOne({ where: { id: userId, email } });

        if (!user) {
            return null;
        }
        // Convert the string role to the UserRole enum
        if (!Object.values(UserRole).includes(role as UserRole)) {
            throw new BadRequestException('Invalid role');
        }
        user.role = role as UserRole;
        await this.usersRepository.save(user);
        return user;
    }
    async deleteUser(id: number) {
        const user = await this.usersRepository.findOne({ where: { id } });

        if (!user) {
            return null;
        }

        await this.usersRepository.remove(user);
        return true;
    }
    async findUserById(id: number): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }
    async findSuperUsers(): Promise<User[]> {
        return this.usersRepository.find({ where: { superuserRole: 'Y' } });
    }

    async findAuthors(): Promise<User[]> {
        return this.usersRepository.find({ where: { role: UserRole.ADMIN } });
    }
}
