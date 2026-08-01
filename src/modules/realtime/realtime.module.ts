import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.geteway';
import { CacheService, TokenService } from 'src/common/utils/service';

@Module({
  providers: [RealtimeGateway , TokenService, CacheService],
})
export class RealtimeModule {}
