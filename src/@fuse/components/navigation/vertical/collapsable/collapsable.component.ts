import {ChangeDetectorRef, Component, HostBinding, Input, OnDestroy, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {Subject} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';
import {FuseNavigation, FuseNavigationItem} from '@fuse/types';
import {fuseAnimations} from '@fuse/animations';
import {FuseNavigationService} from '@fuse/components/navigation/navigation.service';

@Component({
  selector: 'fuse-nav-vertical-collapsable',
  templateUrl: './collapsable.component.html',
  styleUrls: ['./collapsable.component.scss'],
  animations: fuseAnimations,
})
export class FuseNavVerticalCollapsableComponent implements OnInit, OnDestroy {
  @Input()
  public item!: FuseNavigationItem;

  @HostBinding('class')
  public classes = 'nav-collapsable nav-item';

  @HostBinding('class.open')
  public isOpen = false;

  private _unsubscribeAll = new Subject();

  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private _fuseNavigationService: FuseNavigationService,
    private _router: Router
  ) {}

  public get itemClasses(): string {
    if (this.item.classes) {
      return this.item.classes;
    }
    return '';
  }

  ngOnInit(): void {
    // Listen for router events
    this._router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this._unsubscribeAll)
      )
      // @ts-ignore
      .subscribe((event: NavigationEnd) => {
        if (this.isUrlInChildren(this.item, event.urlAfterRedirects)) {
          this.expand();
        } else {
          this.collapse();
        }
      });

    // Listen for collapsing of any navigation item
    this._fuseNavigationService.onItemCollapsed.pipe(takeUntil(this._unsubscribeAll)).subscribe((clickedItem: FuseNavigation) => {
      if (clickedItem && clickedItem.children) {
        // Check if the clicked item is one
        // of the children of this item
        if (this.isChildrenOf(this.item, clickedItem)) {
          return;
        }

        // Check if the url can be found in
        // one of the children of this item
        if (this.isUrlInChildren(this.item, this._router.url)) {
          return;
        }

        // If the clicked item is not this item, collapse...
        if (this.item !== clickedItem) {
          this.collapse();
        }
      }
    });

    // Check if the url can be found in
    // one of the children of this item
    if (this.isUrlInChildren(this.item, this._router.url)) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(void 0);
    this._unsubscribeAll.complete();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Toggle collapse
   *
   * @param ev
   */
  toggleOpen(ev: Event): void {
    ev.preventDefault();

    this.isOpen = !this.isOpen;

    // Navigation collapse toggled...
    this._fuseNavigationService.onItemCollapsed.next(this.item);
    this._fuseNavigationService.onItemCollapseToggled.next(void 0);
  }

  /**
   * Expand the collapsable navigation
   */
  expand(): void {
    if (this.isOpen) {
      return;
    }

    this.isOpen = true;

    // Mark for check
    this._changeDetectorRef.markForCheck();

    this._fuseNavigationService.onItemCollapseToggled.next(void 0);
  }

  /**
   * Collapse the collapsable navigation
   */
  collapse(): void {
    if (!this.isOpen) {
      return;
    }

    this.isOpen = false;

    // Mark for check
    this._changeDetectorRef.markForCheck();

    this._fuseNavigationService.onItemCollapseToggled.next(void 0);
  }

  /**
   * Check if the given parent has the
   * given item in one of its children
   *
   * @param parent
   * @param item
   * @returns
   */
  isChildrenOf(parent: FuseNavigationItem, item: FuseNavigation): boolean {
    const children = parent.children;

    if (!children) {
      return false;
    }

    if (children.indexOf(item) > -1) {
      return true;
    }

    for (const child of children) {
      if (child.children) {
        if (this.isChildrenOf(child, item)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if the given url can be found
   * in one of the given parent's children
   *
   * @param parent
   * @param url
   * @returns
   */
  isUrlInChildren(parent: FuseNavigationItem, url: string | any[]): boolean {
    const children = parent.children;

    if (!children) {
      return false;
    }

    for (const child of children) {
      if (child.children) {
        if (this.isUrlInChildren(child, url)) {
          return true;
        }
      }

      if (child.url === url || url.includes(child.url as string)) {
        return true;
      }
    }

    return false;
  }
}
