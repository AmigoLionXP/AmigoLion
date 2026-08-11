import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from '../../common/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';
import { AgentsService } from './agents.service';
import { CreateAgentRunDto } from './dto/create-agent-run.dto';

@Controller('agent-runs')
@Roles('client')
export class AgentsController {
  constructor(private agents: AgentsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAgentRunDto) {
    return this.agents.createRun(user.sub, user.companyId, dto);
  }
}
