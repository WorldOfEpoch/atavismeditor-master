import {ModuleWithProviders, NgModule, Optional, SkipSelf} from '@angular/core';

import {FUSE_CONFIG} from '@fuse/services/config.service';
import {FuseConfig} from './types';

@NgModule()
export class FuseModule {
  constructor(@Optional() @SkipSelf() parentModule: FuseModule) {
    if (parentModule) {
      throw new Error('FuseModule is already loaded. Import it in the AppModule only!');
    }
  }

  static forRoot(config: FuseConfig): ModuleWithProviders<FuseModule> {
    return {
      ngModule: FuseModule,
      providers: [{provide: FUSE_CONFIG, useValue: config}],
    };
  }
}
