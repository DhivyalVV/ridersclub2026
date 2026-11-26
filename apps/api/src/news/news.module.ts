import { Module } from '@nestjs/common';
import { ProfilesModule } from '../profiles/profiles.module';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';

@Module({
  imports: [ProfilesModule],
  controllers: [NewsController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}
