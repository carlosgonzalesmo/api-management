import { APP_GUARD } from '@nestjs/core';
import { ApiKeyGuard } from './modules/auth/api-key.guard';

export const AppAuthProvider = {
  provide: APP_GUARD,
  useClass: ApiKeyGuard,
};