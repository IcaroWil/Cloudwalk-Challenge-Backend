import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ChatRequestDto, ChatResponseDto } from './chat.dto';
import { PinoLogger } from 'nestjs-pino';
import sanitizeHtml from 'sanitize-html';
import { RouterService } from '../router/application/router.service';
import { MathService } from '../math/application/math.service';
import { HistoryService } from '../conversation/application/history.service';
import { Message } from '../conversation/domain/message';
import { KnowledgeService } from '../knowledge/application/knowledge.service';
import { cleanInput, isSuspicious } from '../../common/security/sanitizer';


@Controller('chat')
export class ChatController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly router: RouterService,
    private readonly math: MathService,
    private readonly history: HistoryService,
    private readonly knowledge: KnowledgeService,
  ) {
    this.logger.setContext('ChatController');
  }

  @Post()
  async chat(@Body() dto: ChatRequestDto): Promise<ChatResponseDto> {
    const start = Date.now();
    const message = cleanInput(dto.message);
    if (!message) throw new BadRequestException('Mensagem vazia.');
    if (isSuspicious(message)) throw new BadRequestException('Mensagem suspeita.');

    const decision = this.router.decideAgent(message).agent;

    this.logger.info({
      agent: 'RouterAgent',
      decision,
      conversation_id: dto.conversation_id,
      user_id: dto.user_id,
    });

    let response = '';
    let source_agent_response = '';

    if (decision === 'MathAgent') {
      const out = this.math.evaluate(message);
      source_agent_response = `${out.expression} = ${out.result}`;
      response = `Resultado: ${out.result}`;
    } else {
      const ans = await this.knowledge.answer(message);
      source_agent_response = ans.response;
      response = ans.response;

      // 👇 o log do KnowledgeAgent fica AQUI, dentro do escopo do ans
      this.logger.info({
        agent: 'KnowledgeAgent',
        source: ans.source,
        execution_time: ans.execution_time,
        conversation_id: dto.conversation_id,
        user_id: dto.user_id,
      });
    }

    await this.history.append(dto.conversation_id, Message.create('user', message));
    await this.history.append(dto.conversation_id, Message.create('agent', response));

    // log de tempo total do request (opcional)
    this.logger.info({
      agent: decision,
      execution_time: Date.now() - start,
      conversation_id: dto.conversation_id,
      user_id: dto.user_id,
    });

    return {
      response,
      source_agent_response,
      agent_workflow: [
        { agent: 'RouterAgent', decision },
        { agent: decision },
      ],
    };
  }
}
