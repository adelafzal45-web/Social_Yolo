import { Module, Global } from '@nestjs/common';
import { PlatformConfigService } from './platform-config.service';

@Global()
@Module({
  providers: [PlatformConfigService],
  exports: [PlatformConfigService],
})
export class DesignPlatformModule {}
