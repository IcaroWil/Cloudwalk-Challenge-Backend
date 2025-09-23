import { Module, Provider } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export const SECURITY_PROVIDERS: Provider[] = [
  {
    provide: 'HELMET',
    useFactory: () => helmet({ contentSecurityPolicy: false }),
  },
  {
    provide: 'RATE_LIMIT',
    useFactory: () => rateLimit({ windowMs: 60_000, max: 120 }),
  },
];

@Module({
  providers: SECURITY_PROVIDERS,
  exports: SECURITY_PROVIDERS,
})
export class SecurityModule {}
