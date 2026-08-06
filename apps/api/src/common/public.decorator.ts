import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** Marks a route as reachable by unauthenticated visitors (role `public` in backend_contract.md). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
