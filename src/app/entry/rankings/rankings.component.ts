import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {ConfigTypes, FilterTypes} from '../../models/configRow.interface';
import {TabTypes} from '../../models/tabTypes.enum';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DatabaseService} from '../../services/database.service';
import {ActionsIcons, ActionsNames, ActionsTypes, ActionTrigger} from 'app/models/actions.interface';
import {DialogCloseType, FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {LoadingService} from '../../components/loading/loading.service';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {Subject} from 'rxjs';
import {DropdownItemsService} from '../dropdown-items.service';

interface Ranking {
  id: number;
  type: number;
  name: string;
  count: number;
  description: string;
  isactive: boolean;
}

enum dataTypes {
  KILL = 'Kill',
  EXPERIENCE = 'Experience',
  HARVESTING = 'Harvesting',
  CRAFTING = 'Crafting',
  LOOTING = 'Looting',
  USE_ABILITY = 'Use Ability',
  FINAL_BLOW = 'Final blow',
  GEAR_SCORE = 'Gear Score',
}

@Component({
  selector: 'atv-rankings',
  templateUrl: './rankings.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingsComponent implements OnInit, OnDestroy {
  private tableKey: TabTypes = TabTypes.RANKINGS;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      type: {
        type: ConfigTypes.dropdown,
        visible: true,
        useAsSearch: true,
        data: [
          {id: 1, value: dataTypes.KILL},
          {id: 2, value: dataTypes.EXPERIENCE},
          {id: 3, value: dataTypes.HARVESTING},
          {id: 4, value: dataTypes.CRAFTING},
          {id: 5, value: dataTypes.LOOTING},
          {id: 6, value: dataTypes.USE_ABILITY},
          {id: 7, value: dataTypes.FINAL_BLOW},
          {id: 8, value: dataTypes.GEAR_SCORE},
        ],
        filterType: FilterTypes.dropdown,
        filterVisible: true,
      },
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      count: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      description: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      isactive: {
        type: ConfigTypes.isActiveType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.dropdownItemsService.isActiveOptions,
        overrideValue: '-1',
      },
    },
    actions: [
      {type: ActionsTypes.EDIT, name: ActionsNames.EDIT, icon: ActionsIcons.EDIT},
      {type: ActionsTypes.MARK_AS_REMOVED, name: ActionsNames.MARK_AS_REMOVED, icon: ActionsIcons.MARK_AS_REMOVED},
      {type: ActionsTypes.RESTORE, name: ActionsNames.ACTIVATE, icon: ActionsIcons.RESTORE},
      {type: ActionsTypes.DELETE, name: ActionsNames.MARK_AS_REMOVED, icon: ActionsIcons.DELETE},
    ],
    queryParams: {search: '', where: {}, sort: {field: 'name', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public list: Ranking[] = [];
  private used: Ranking[] = [];
  public formConfig: FormConfig = {
    type: this.tableKey,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 100},
      type: {
        name: 'type',
        type: FormFieldType.dropdown,
        data: [
          {id: 1, value: dataTypes.KILL},
          {id: 2, value: dataTypes.EXPERIENCE},
          {id: 3, value: dataTypes.HARVESTING},
          {id: 4, value: dataTypes.CRAFTING},
          {id: 5, value: dataTypes.LOOTING},
          {id: 6, value: dataTypes.USE_ABILITY},
          {id: 7, value: dataTypes.FINAL_BLOW},
          {id: 8, value: dataTypes.GEAR_SCORE},
        ],
        require: true,
      },
      count: {name: 'count', type: FormFieldType.integer, require: true},
      description: {name: 'description', type: FormFieldType.textarea, require: true, length: 2048},
    },
  };
  public activeRecords = true;
  private queryParams: QueryParams = this.tableConfig.queryParams;
  private dbProfile!: DataBaseProfile;
  private dbTable = 'ranking_settings';
  private form!: FormGroup;
  private destroyer = new Subject<void>();
  private currentType: number | undefined = undefined;

  constructor(
    private readonly translate: TranslateService,
    private readonly profilesService: ProfilesService,
    private readonly databaseService: DatabaseService,
    private readonly fb: FormBuilder,
    private readonly loadingService: LoadingService,
    private readonly notification: NotificationService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
    private readonly dropdownItemsService: DropdownItemsService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile;
        const defaultIsActiveFilter =
          typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
        this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
        if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
          this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
        }
        this.loadData();
        this.loadUsed();
      }
    });
    this.tablesService.activeTab.pipe(distinctPipe(this.destroyer)).subscribe((tab) => {
      if (!tab || (tab && tab.id !== this.tableConfig.type)) {
        this.changeDetectorRef.detach();
      } else {
        this.changeDetectorRef.reattach();
        this.changeDetectorRef.markForCheck();
      }
    });
    this.buildForm();
  }

  public async addItem(): Promise<void> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    this.formConfig.saveAsNew = false;
    const {item} = await this.tablesService.openDialog<Ranking>(this.formConfig, this.form);
    this.currentType = undefined;
    if (!item) {
      this.form.reset();
      this.tablesService.dialogRef = null;
      return;
    }
    const result = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT count(*) as isUsed FROM ${this.dbTable} WHERE isactive = 1 and type = ?`,
      [item.type],
    );
    if (!+result[0].isUsed) {
      item.isactive = true;
      await this.databaseService.insert<Ranking>(this.dbProfile, this.dbTable, item);
      this.loadData();
      this.loadUsed();
    } else {
      this.notification.error(this.translate.instant(TabTypes.RANKINGS + '.ALREADY_USED_TYPE'));
    }
    this.form.reset();
    this.tablesService.dialogRef = null;
    this.loadingService.hide();
  }

  public async updateItem(id: number | string): Promise<void> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const record = await this.databaseService.queryItem<Ranking>(this.dbProfile, this.dbTable, 'id', id);
    if (record) {
      this.currentType = record.type;
      this.form.patchValue(record);
      this.formConfig.saveAsNew = true;
      const {item, action} = await this.tablesService.openDialog<Ranking>(this.formConfig, this.form);
      if (!item) {
        this.form.reset();
        this.tablesService.dialogRef = null;
        this.loadingService.hide();
        this.currentType = undefined;
        return;
      }
      if (action === DialogCloseType.save_as_new) {
        const result = await this.databaseService.customQuery(
          this.dbProfile,
          `SELECT count(*) as isUsed FROM ${this.dbTable} WHERE isactive = 1 and type = ?`,
          [item.type],
        );
        if (!+result[0].isUsed) {
          item.isactive = true;
          delete item.id;
          await this.databaseService.insert<Ranking>(this.dbProfile, this.dbTable, item);
          this.loadData();
          this.loadUsed();
        } else {
          this.notification.error(this.translate.instant(TabTypes.RANKINGS + '.ALREADY_USED_TYPE'));
          this.loadingService.hide();
        }
      } else {
        const result = await this.databaseService.customQuery(
          this.dbProfile,
          `SELECT count(*) as isUsed FROM ${this.dbTable} WHERE isactive = 1 AND type = ? and id != ?`,
          [item.type, record.id],
        );
        if (!+result[0].isUsed) {
          await this.databaseService.update<Ranking>(this.dbProfile, this.dbTable, item, 'id', record.id);
          this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
          this.loadData();
          this.loadUsed();
        } else {
          this.notification.error(this.translate.instant(TabTypes.RANKINGS + '.ALREADY_USED_TYPE'));
          this.loadingService.hide();
        }
      }
      this.form.reset();
      this.currentType = undefined;
      this.tablesService.dialogRef = null;
    }
  }

  public paramsUpdated(params: QueryParams): void {
    this.queryParams = params;
    this.loadData();
  }

  public async actionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      if (action.type === ActionsTypes.RESTORE) {
        const record = await this.databaseService.queryItem<Ranking>(this.dbProfile, this.dbTable, 'id', action.id);
        const result = await this.databaseService.customQuery(
          this.dbProfile,
          `SELECT count(*) as isUsed FROM ${this.dbTable} WHERE isactive = 1 AND type = ? and id != ?`,
          [record.type, action.id],
        );
        if (+result[0].isUsed) {
          this.notification.error(this.translate.instant(TabTypes.RANKINGS + '.ALREADY_USED_TYPE'));
          this.loadingService.hide();
          return;
        }
      }
      await this.tablesService.executeAction(this.dbProfile, this.dbTable, action);
      this.loadData();
      this.loadUsed();
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.dbProfile;
      const dbTable = this.dbTable;
      if (action.type === ActionsTypes.RESTORE) {
        for (const id of action.id) {
          const record = await this.databaseService.queryItem<Ranking>(this.dbProfile, this.dbTable, 'id', id);
          const result = await this.databaseService.customQuery(
            this.dbProfile,
            `SELECT count(*) as isUsed FROM ${this.dbTable} WHERE isactive = 1 AND type = ? and id != ?`,
            [record.type, id],
          );
          if (+result[0].isUsed) {
            this.notification.error(this.translate.instant(TabTypes.RANKINGS + '.ALREADY_USED_TYPE'));
          } else {
            await this.tablesService.executeAction(this.dbProfile, this.dbTable, {id, type: action.type});
          }
        }
      } else {
        await this.tablesService.executeBulkAction(profile, dbTable, action);
      }
      this.loadData();
      this.loadUsed();
      this.loadingService.hide();
    }
  }

  private async loadData(): Promise<void> {
    const response = await this.databaseService.queryList<Ranking[]>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      this.queryParams,
    );
    this.list = response.list;
    this.tableConfig.count = response.count;
    this.changeDetectorRef.markForCheck();
    this.loadingService.hide();
  }

  private async loadUsed(): Promise<void> {
    this.used = await this.databaseService.queryAll<Ranking>(this.dbProfile, this.dbTable, this.tableConfig.fields, {
      where: {isactive: 1},
    });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      count: ['', [Validators.required, Validators.min(1)]],
      description: ['', Validators.required],
    });
    (this.form.get('type') as AbstractControl).valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroyer))
      .subscribe((value) => {
        if (value) {
          if (this.currentType && value === this.currentType) {
            (this.form.get('type') as AbstractControl).clearValidators();
          } else {
            const used = this.used.filter((item) => item.type === value);
            if (used.length > 0) {
              (this.form.get('type') as AbstractControl).setErrors({DUPLICATED: true});
            }
          }
        }
      });
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
