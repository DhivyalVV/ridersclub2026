import { Module } from '@nestjs/common';
import { ProfilesModule } from '../profiles/profiles.module';
import { BlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';

@Module({
  imports: [ProfilesModule],
  controllers: [BlogsController],
  providers: [BlogsService],
  exports: [BlogsService],
})
export class BlogsModule {}

