import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({ example: '65 x 3.11' })
  @IsString() @IsNotEmpty() message!: string;

  @ApiProperty({ example: 'u1' })
  @IsString() @IsNotEmpty() user_id!: string;

  @ApiProperty({ example: 'c1' })
  @IsString() @IsNotEmpty() conversation_id!: string;
}

export type AgentStep = { agent: string; decision?: string };

export class ChatResponseDto {
  response!: string;
  source_agent_response!: string;
  agent_workflow!: AgentStep[];
}
