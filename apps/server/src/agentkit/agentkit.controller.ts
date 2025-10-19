import { All, Controller, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";

import { AgentkitService } from "./agentkit.service";

@Controller()
export class AgentkitController {
  constructor(private readonly agentkitService: AgentkitService) {}

  @All("/agentKit")
  handleCopilotKit(@Req() req: Request, @Res() res: Response) {
    return this.agentkitService.handleRequest(req, res);
  }
}
