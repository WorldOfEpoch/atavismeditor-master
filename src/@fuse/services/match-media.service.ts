import {MediaChange, MediaObserver} from '@angular/flex-layout';
import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class FuseMatchMediaService {
  activeMediaQuery: string;
  onMediaChange: BehaviorSubject<string> = new BehaviorSubject<string>('');

  /**
   * Constructor
   *
   * @param _mediaObserver
   */
  constructor(private _mediaObserver: MediaObserver) {
    this.activeMediaQuery = '';
    this._init();
  }

  /**
   * Initialize
   *
   * @private
   */
  private _init(): void {
    this._mediaObserver
      .asObservable()
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((changes: MediaChange[]) => {
        for (const change of changes) {
          if (this.activeMediaQuery !== change.mqAlias) {
            this.activeMediaQuery = change.mqAlias;
            this.onMediaChange.next(change.mqAlias);
          }
        }
      });
  }
}
