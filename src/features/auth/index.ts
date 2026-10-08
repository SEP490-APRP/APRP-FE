// Type user dùng toàn app nằm ở @/types; re-export để feature auth vẫn tự đủ.
export type { AuthUser, SessionUser, UserRole } from '@/types'
export {
  loginSchema,
  memberRegisterSchema,
  REGISTER_DEFAULTS,
  shopAccountSchema,
  shopKycSchema,
  type LoginValues,
  type RegisterValues,
} from './schemas/auth.schemas'
export {
  authService,
  parseJwt,
  mapBackendRoleToFrontend,
  buildSessionUser,
} from '@/services/auth.service'
export type * from '@/services/auth.types'
