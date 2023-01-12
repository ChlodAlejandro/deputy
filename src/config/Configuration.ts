import type WikiConfiguration from './WikiConfiguration';
import type UserConfiguration from './UserConfiguration';

export type Configuration = WikiConfiguration | UserConfiguration;
export type ConfigurationType = Configuration['type'];
