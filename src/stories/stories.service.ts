import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Story } from './entities/story.entity';
import { CreateStoryDto } from './dto/create-story.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(Story) private readonly storyRepo: Repository<Story>,
    private readonly usersService: UsersService
  ) { }

  async createStory(dto: CreateStoryDto): Promise<{ statusCode: number; message: string }> {
    const { title, content, type, userId ,authorName } = dto;

    // Find user by ID
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      return { statusCode: 404, message: 'User not found' };
    }

    // Create new story
    const story = this.storyRepo.create({ title, content, type, author: user,authorName });
    await this.storyRepo.save(story);

    return { statusCode: 201, message: 'Story created successfully' };
  }

  async updateStory(
    storyId: number,
    userId: number,
    updateData: Partial<Story>
  ): Promise<{ statusCode: number; message: string }> {
    const story = await this.storyRepo.findOne({
      where: { id: storyId, author: { id: userId } }, // ✅ Ensure correct relation query
      relations: ['author'], // ✅ Include the relation if necessary
    });

    if (!story) {
      throw new NotFoundException('Story not found or you are not the author');
    }

    Object.assign(story, updateData);
    await this.storyRepo.save(story);

    return {
      statusCode: 200,
      message: 'Story updated successfully',
    };
  }
  async deleteStory(storyId: number, userId: number): Promise<{ statusCode: number; message: string }> {
    const story = await this.storyRepo.findOne({
      where: { id: storyId, author: { id: userId } },
      relations: ['author'],
    });

    if (!story) {
      throw new NotFoundException('Story not found or you are not the author');
    }

    await this.storyRepo.remove(story);

    return {
      statusCode: 200,
      message: 'Story deleted successfully',
    };
  }
  async getStoriesByUserIds(userIds: number[]): Promise<{ statusCode: number; stories: Story[] }> {
    const stories = await this.storyRepo.find({
      where: { author: { id: In(userIds) } }, // Filter by user IDs
      relations: ['author'], // Fetch author details
      order: { createdAt: 'DESC' }, // Optional: Order by newest first
    });

    return {
      statusCode: 200,
      stories,
    };
  }

  async getSortedStories(): Promise<{ statusCode: number; data: { superUsers: Story[]; authors: Story[] } }> {
    // Fetch superuser IDs
    const superUsers = await this.usersService.findSuperUsers();
    const superUserIds = superUsers.map(user => user.id);

    // Fetch author IDs
    const authors = await this.usersService.findAuthors();
    const authorIds = authors.map(user => user.id);

    // Fetch stories for super users
    const superUserStories = await this.storyRepo.find({
      where: { author: { id: In(superUserIds) } },
      relations: ['author'],
      order: { createdAt: 'DESC' }, // Optional sorting
    });

    // Fetch stories for normal authors
    const authorStories = await this.storyRepo.find({
      where: { author: { id: In(authorIds) } },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });

    return {
      statusCode: 200,
      data: {
        superUsers: superUserStories,
        authors: authorStories,
      },
    };
  }
  
  async getStoriesByType(storyType: string) {
    const stories = await this.storyRepo.find({
      where: { type: storyType }, 
      relations: ['author'], 
      select: ['id', 'title', 'content', 'type', 'createdAt', 'author'], // Select required fields
    });
  
    // Map result to return only author name instead of full object
    const formattedStories = stories.map(story => ({
      id: story.id,
      storyTitle: story.title,
      storyContent: story.content,
      storyType: story.type,
      createdAt: story.createdAt,
      authorName: story.author?.username || 'Unknown' // Extract only author's name
    }));
  
    return {
      statusCode: 200,
      message: `Stories of type '${storyType}' retrieved successfully`,
      data: formattedStories,
    };
  }
  

}
