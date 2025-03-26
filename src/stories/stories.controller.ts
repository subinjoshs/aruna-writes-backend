import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { Story } from './entities/story.entity';

@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) { }

  @Post('create')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createStory(@Body() createStoryDto: CreateStoryDto) {
    return this.storiesService.createStory(createStoryDto);
  }
  @Patch(':id')
  async updateStory(
    @Param('id') storyId: number,
    @Body() updateData: Partial<Story>,
    @Req() req
  ) {
    const userId = req.user.id; // Extract user ID from JWT token
    return this.storiesService.updateStory(storyId, userId, updateData);
  }
  @Delete(':id')
  async deleteStory(@Param('id') storyId: number, @Req() req) {
    const userId = req.user.id; // Get the logged-in user's ID from JWT token
    return this.storiesService.deleteStory(storyId, userId);
  }

  @Get('by-users')
  async getStoriesByUserIds(@Query('userIds') userIds: string) {
    const userIdArray = userIds.split(',').map((id) => parseInt(id, 10)); // Convert string to number array
    return this.storiesService.getStoriesByUserIds(userIdArray);
  }

  @Get('sorted-stories')
async getSortedStories() {
  return this.storiesService.getSortedStories();
}

@Get('type/:storyType')
  async getStoriesByType(@Param('storyType') storyType: string) {
    return this.storiesService.getStoriesByType(storyType);
  }


}
