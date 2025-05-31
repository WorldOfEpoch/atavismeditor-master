import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {AbstractControl, FormGroup} from '@angular/forms';
import {FormFieldConfig, FormFieldType} from '../../../../models/configs';
import {TabTypes} from '../../../../models/tabTypes.enum';
import {SubFormService, TableTooltip} from '../../../../entry/sub-form.service';
import {filter, map, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {ElectronService} from '../../../../services/electron.service';

@Component({
  selector: 'atv-file',
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileComponent implements OnInit, OnDestroy {
  @Input() public tableType!: TabTypes;
  @Input() public form!: FormGroup;
  @Input() public subForm = -1;
  @Input() public subFormType = '';
  @Input() public subFormParent = -1;
  @Input() public subFormTypeParent = '';
  @Input() public errors: string[] = [];
  public FormFieldType = FormFieldType;
  public disableTooltip = true;
  public fieldControl!: AbstractControl;
  private destroyer = new Subject();

  constructor(
    private readonly electronService: ElectronService,
    private readonly subFormService: SubFormService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  private _field!: FormFieldConfig;

  public get field(): FormFieldConfig {
    return this._field;
  }

  @Input()
  public set field(value: FormFieldConfig) {
    this._field = value;
    this.fieldControl = this.subFormService.getControl(
      this.form,
      this.subForm,
      this.subFormType,
      this.subFormParent,
      this.subFormTypeParent,
      this._field.name,
    );
    this.changeDetectorRef.markForCheck();
  }

  public ngOnInit(): void {
    this.subFormService.showTooltips
      .pipe(
        filter(() => !!this.tableType),
        map(
          (tables: TableTooltip[]) =>
            tables.find((item: TableTooltip) => item.table === this.tableType) as TableTooltip,
        ),
        filter((tableTooltip: TableTooltip) => !!tableTooltip),
        map((tableTooltip: TableTooltip) => tableTooltip.value),
        takeUntil(this.destroyer),
      )
      .subscribe((showTooltip) => {
        this.disableTooltip = !showTooltip;
        this.changeDetectorRef.markForCheck();
      });
  }

  public otherOption(): void {
    const options = {
      defaultPath: (this._field.acceptFolder as string).split('/').join('\\'),
      filters: [
        {name: this._field.acceptTitle, extensions: [this._field.accept.split(',')]},
        {name: 'All Files', extensions: ['*']},
      ],
      properties: ['openFile'],
    };
    this.electronService.remote.dialog
      .showOpenDialog(options)
      .then((result: any) => {
        if (!result.canceled) {
          const currentFile = this.parseFile(result.filePaths[0].replace(/\\/g, '/'));
          this.fieldControl.patchValue(currentFile);
        }
        this.changeDetectorRef.markForCheck();
      })
      .catch((error: any) => {
        throw error;
      });
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  public clearSelected(): void {
    this.fieldControl.setValue('');
  }

  private parseFile(fileName: string): string {
    const fileSourceList = fileName.split('Assets');
    let currentFolder = '';
    if (fileSourceList.length > 1) {
      const folderSelected = [];
      for (let i = 0; i < fileSourceList.length; ++i) {
        if (i !== 0) {
          folderSelected.push('Assets');
          folderSelected.push(fileSourceList[i]);
        }
      }
      currentFolder = folderSelected.join('');
    } else {
      currentFolder = fileName;
    }
    return currentFolder;
  }
}
