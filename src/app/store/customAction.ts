import { Action } from '@ngrx/store';

export interface customAction extends Action {
type: string;
payload?: any;
}

