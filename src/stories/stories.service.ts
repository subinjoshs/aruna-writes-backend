import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
    // Fetch the story along with its author
    const story = await this.storyRepo.findOne({ where: { id: storyId }, relations: ['author'] });
  
    if (!story) {
      throw new NotFoundException('Story not found');
    }
  
    // Fetch the user to check their role
    const user = await this.usersService.findUserById(userId);
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    // Allow only superusers to delete the story
    if (user.superuserRole !== 'Y') {
      throw new ForbiddenException('You are not authorized to delete this story');
    }
  
    // Proceed with deletion
    await this.storyRepo.remove(story);
    
    return { statusCode: 200, message: 'Story deleted successfully' };
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

  async getSortedStories(): Promise<{ statusCode: number; data: { superUsers: any[]; authors: any[] } }> {
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
    const formatStories = (stories: Story[]) =>
      stories.map(story => ({
        id: story.id,
        storyTitle: story.title,
        storyContent: story.content,
        storyType: story.type,
        createdAt: story.createdAt,
        views: story.views,
        comments: story.comments,
        author: {
          name: story.author?.username || 'Unknown',
          profilePicture: story.author?.profilePicture || null
        }
      }));
    return {
      statusCode: 200,
      data: {
        superUsers: formatStories(superUserStories),
        authors: formatStories(authorStories),
      },
    };
  }
  
  async getStoriesByType(storyType: string) {
    const stories = await this.storyRepo.find({
      where: { type: storyType }, 
      relations: ['author'], 
      select: ['id', 'title', 'content', 'type', 'createdAt', 'author','views'], // Select required fields
    });
  
    // Map result to return only author name instead of full object
    const formattedStories = stories.map(story => ({
      id: story.id,
      storyTitle: story.title,
      storyContent: story.content,
      storyType: story.type,
      createdAt: story.createdAt,
      views: story.views, 
      authorName: story.author?.username || 'Unknown' // Extract only author's name
    }));
  
    return {
      statusCode: 200,
      message: `Stories of type '${storyType}' retrieved successfully`,
      data: formattedStories,
    };
  }
  async getStoryById(storyId: number) {
    const story = await this.storyRepo.findOne({
      where: { id: storyId },
      relations: ['author'],
    });
  
    if (!story) {
      throw new NotFoundException(`Story with ID ${storyId} not found`);
    }
  
    // ✅ Increment views count
    story.views += 1;
    await this.storyRepo.save(story);
  
    return {
      statusCode: 200,
      message: 'Story retrieved successfully',
      data: {
        id: story.id,
        storyTitle: story.title,
        storyContent: story.content,
        storyType: story.type,
        createdAt: story.createdAt,
        authorName: story.author?.username || 'Unknown',
        views: story.views,  // ✅ Include views in response
        comments: story.comments, // ✅ Include comments in response
      },
    };
  }
  async addComment(storyId: number, userId: number, comment: string) {
    const story = await this.storyRepo.findOne({ where: { id: storyId } });
  
    if (!story) {
      throw new NotFoundException(`Story with ID ${storyId} not found`);
    }
  
    // ✅ Append new comment to the array
    const newComment = { userId, comment, createdAt: new Date() };
    story.comments = [...story.comments, newComment];
  
    await this.storyRepo.save(story);
  
    return {
      statusCode: 200,
      message: 'Comment added successfully',
      data: newComment,
    };
  }
  

}
