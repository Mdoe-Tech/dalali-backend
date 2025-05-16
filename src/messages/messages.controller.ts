import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Delete,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessageType } from './entities/message.entity';
import { multerConfig } from '../config/multer.config';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post(':receiverId')
  async sendMessage(
    @Param('receiverId') receiverId: string,
    @Body('content') content: string,
    @Body('type') type: MessageType = MessageType.TEXT,
    @Req() req: any,
  ) {
    return this.messagesService.sendMessage(req.user.userId, receiverId, content, type);
  }

  @Post(':receiverId/file')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async sendFile(
    @Param('receiverId') receiverId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const fileData = {
      fileUrl: file.path,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
    };

    return this.messagesService.sendMessage(
      req.user.userId,
      receiverId,
      file.originalname,
      file.mimetype.startsWith('image/') ? MessageType.IMAGE : MessageType.FILE,
      fileData,
    );
  }

  @Get('conversation/:userId')
  async getConversation(
    @Param('userId') otherUserId: string,
    @Req() req: any,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    return this.messagesService.getConversation(
      req.user.userId,
      otherUserId,
      limit,
      before ? new Date(before) : undefined,
    );
  }

  @Patch(':messageId/read')
  async markAsRead(@Param('messageId') messageId: string, @Req() req: any) {
    return this.messagesService.markMessageAsRead(messageId, req.user.userId);
  }

  @Delete(':messageId')
  async deleteMessage(@Param('messageId') messageId: string, @Req() req: any) {
    return this.messagesService.deleteMessage(messageId, req.user.userId);
  }

  @Get('unread/count')
  async getUnreadCount(@Req() req: any) {
    return this.messagesService.getUnreadCount(req.user.userId);
  }

  @Get('search')
  async searchMessages(@Query('q') query: string, @Req() req: any) {
    return this.messagesService.searchMessages(req.user.userId, query);
  }
} 