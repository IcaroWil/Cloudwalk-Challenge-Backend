import { Module } from '@nestjs/common';
import { RouterService } from './application/router.service';

@Module({
  providers: [RouterService],
  exports: [RouterService],
})
export class RouterModule {}
