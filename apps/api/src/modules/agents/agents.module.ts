import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { AgentProvider } from './agent-provider.interface';
import { MockAgentProvider } from './mock-agent.provider';

@Module({
  controllers: [AgentsController],
  providers: [AgentsService, { provide: AgentProvider, useClass: MockAgentProvider }],
  exports: [AgentProvider],
})
export class AgentsModule {}
