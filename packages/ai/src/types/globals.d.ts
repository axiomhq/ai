import type { DefinitionRegistry } from '../collector/registry';

declare global {
  var __SDK_VERSION__: string;
  var __axiom_registry: DefinitionRegistry | undefined;
}
