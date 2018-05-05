
import { PO } from './po.model';

export interface AppStore {
  POs: PO[];
  Message: string;
  BlockNumber: string;
  Accounts: string[];
}


