import { BrowserModule } 		from '@angular/platform-browser';
import { NgModule } 			from '@angular/core';
import { FormsModule }   		from '@angular/forms';
import { BrowserAnimationsModule } 	from '@angular/platform-browser/animations';
import { HttpModule } 			from '@angular/http';

import {SuiModule} from 'ng2-semantic-ui';

import { AppComponent } from './app.component';

import { StoreModule }        from '@ngrx/store';
import { poService, reducer } from './store/po.service';
import { nodeService }        from './store/nodeService';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpModule,
    SuiModule,
    StoreModule.forRoot(reducer)
  ],
  providers: [poService,nodeService],
  bootstrap: [AppComponent]
})
export class AppModule { }
