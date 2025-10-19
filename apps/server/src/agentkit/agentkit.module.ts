import { Module } from "@nestjs/common";

import { AgentkitController } from "./agentkit.controller";
import { AgentkitService } from "./agentkit.service";

@Module({
  controllers: [AgentkitController],
  providers: [AgentkitService],
  exports: [AgentkitService],
})
export class AgentkitModule {}
