import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatToolbarModule} from '@angular/material/toolbar';
import {FuseSharedModule} from '@fuse/shared.module';
import {ToolbarComponent} from 'app/layout/components/toolbar/toolbar.component';
import {TranslateModule} from '@ngx-translate/core';
import {MaterialModule} from '@fuse/material.module';

@NgModule({
  declarations: [ToolbarComponent],
  imports: [
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    FuseSharedModule,
    TranslateModule,
    MaterialModule,
  ],
  exports: [ToolbarComponent],
})
export class ToolbarModule {}
