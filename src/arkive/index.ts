export { ArkiveService } from './arkive-service.js'
export { IdentityServiceStub } from './identity-stub.js'
export { IdentityService as IdentityServiceImpl } from './identity-service.js'
export { getAppRootPath, initAppRoot, readConfig, addCollectionToConfig, removeCollectionFromConfig } from './app-root.js'
export type { AppConfig } from './app-root.js'
export {
  IdentityRequiredError,
  type Identity,
  type IdentityService,
  type ArkiveServiceOptions,
  type TitleEntry,
  type ListTitlesOptions,
  type SearchOptions,
  type Collection,
  type Playlist,
  type PlaylistEntry,
  type ChildProfile,
  type AddCollectionOptions,
  type ScanCollectionOptions,
  type ListCollectionsOptions,
} from './types.js'
export type { ListCollectionInfo } from '../core/collection-registry.js'
