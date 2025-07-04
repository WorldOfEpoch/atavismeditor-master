import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {QueryParams, TableConfig, WhereQuery} from '../../models/configs';
import {Subject} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';
import {DatabaseService} from '../../services/database.service';
import {LoadingService} from '../../components/loading/loading.service';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {takeUntil} from 'rxjs/operators';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {LevelXpRewardsProfile, LevelXpRewardsProfileService} from './level-xp-rewards-profile.service';
import {distinctPipe} from '../../directives/utils';
import {Ability} from '../ability/abilities.data';

@Component({
  selector: 'atv-level-xp-profile',
  templateUrl: './level-xp-rewards-profile.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelXpRewardsProfileComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.levelXpRewardsProfileService.tableConfig;
  public list: LevelXpRewardsProfile[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.levelXpRewardsProfileService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly levelXpRewardsProfileService: LevelXpRewardsProfileService,
    private readonly translate: TranslateService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly notification: NotificationService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.levelXpRewardsProfileService.init();
    this.levelXpRewardsProfileService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.list = list;
      this.changeDetectorRef.markForCheck();
    });
    this.tablesService.activeTab.pipe(distinctPipe(this.destroyer)).subscribe((tab) => {
      if (!tab || (tab && tab.id !== this.tableConfig.type)) {
        this.changeDetectorRef.detach();
      } else {
        this.changeDetectorRef.reattach();
        this.changeDetectorRef.markForCheck();
      }
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadData();
    });
    this.loadData();
  }

  public addItem(): void {
    this.levelXpRewardsProfileService.addItem().then((reload) => {
      if (reload) {
        this.loadData();
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.levelXpRewardsProfileService.updateItem(id as number).then((reload) => {
      if (reload) {
        this.loadData();
      }
      this.loadingService.hide();
    });
  }

  public paramsUpdated(params: QueryParams): void {
    this.queryParams = params;
    this.loadData();
  }

  public async actionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        const result = await this.tablesService.handleDeps<Ability>(
          this.levelXpRewardsProfileService.dbProfile,
          this.levelXpRewardsProfileService.dbTable,
          this.levelXpRewardsProfileService.tableKey,
          action,
          'reward_template_id',
          'reward_template_name',
        );
        if (result) {
          await this.loadData();
          this.loadingService.hide();
        }
      } else {
        await this.tablesService.executeAction(
          this.levelXpRewardsProfileService.dbProfile,
          this.levelXpRewardsProfileService.dbTable,
          action,
          'reward_template_id',
        ).then(() => this.loadData());
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.levelXpRewardsProfileService.duplicateItem(action.id);
      if (newId) {
        await this.loadData();
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const newList = action.id.sort((a, b) => b - a);
      for (const id of newList) {
        if (action.type === ActionsTypes.MARK_AS_REMOVED) {
          const result = await this.tablesService.handleDeps<Ability>(
            this.levelXpRewardsProfileService.dbProfile,
            this.levelXpRewardsProfileService.dbTable,
            this.levelXpRewardsProfileService.tableKey,
            action,
            'reward_template_id',
            'reward_template_name',
          );
          if (result) {
            await this.loadData();
            this.loadingService.hide();
          }
        } else {
          await this.tablesService.executeAction(
            this.levelXpRewardsProfileService.dbProfile,
            this.levelXpRewardsProfileService.dbTable,
            {id: id, type: action.type},
            'reward_template_id',
            false,
          );
        }
      }
      if (action.type === ActionsTypes.DELETE) {
        this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_BULK_REMOVED'));
      } else if (action.type === ActionsTypes.RESTORE) {
        this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_BULK_ACTIVATED'));
      } else if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_BULK_DEACTIVATED'));
      }
      await this.loadData();
      this.loadingService.hide();
    }
  }

  private async loadData() {
    await this.levelXpRewardsProfileService.getList(this.queryParams);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.levelXpRewardsProfileService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
  public getPreviewItem(id: number | string): void {
    this.levelXpRewardsProfileService.previewItems(id as number);
  }
}
