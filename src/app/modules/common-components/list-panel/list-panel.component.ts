import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {List} from '../../../model/list/list';
import {MatDialog, MatExpansionPanel, MatSnackBar} from '@angular/material';
import {TranslateService} from '@ngx-translate/core';
import {ListService} from '../../../core/database/list.service';
import {ComponentWithSubscriptions} from '../../../core/component/component-with-subscriptions';
import {Router} from '@angular/router';
import {AngularFireAuth} from 'angularfire2/auth';
import {Observable} from 'rxjs/Observable';
import {UserService} from '../../../core/database/user.service';
import {ObservableMedia} from '@angular/flex-layout';
import {CustomLinkPopupComponent} from '../../../pages/custom-links/custom-link-popup/custom-link-popup.component';
import {CustomLink} from '../../../core/database/custom-links/costum-link';
import {ListTemplate} from '../../../core/database/list-template/list-template';
import {ListTemplateService} from '../../../core/database/list-template/list-template.service';
import {TemplatePopupComponent} from '../../../pages/template/template-popup/template-popup.component';
import {PermissionsPopupComponent} from '../permissions-popup/permissions-popup.component';

@Component({
    selector: 'app-list-panel',
    templateUrl: './list-panel.component.html',
    styleUrls: ['./list-panel.component.scss']
})
export class ListPanelComponent extends ComponentWithSubscriptions implements OnInit {

    @Input()
    public list: List;

    @Input()
    public expanded = false;

    @Input()
    public authorUid: string;

    @Output()
    opened: EventEmitter<void> = new EventEmitter<void>();

    @Output()
    closed: EventEmitter<void> = new EventEmitter<void>();

    @Output()
    onrecipedelete: EventEmitter<void> = new EventEmitter<void>();

    @Output()
    ondelete: EventEmitter<void> = new EventEmitter<void>();

    @Output()
    onedit: EventEmitter<any> = new EventEmitter<any>();

    @Input()
    public readonly = false;

    @Input()
    public buttons = true;

    @Input()
    public copyButton = false;

    @Input()
    public odd: boolean;

    @Input()
    public linkButton = false;

    @Input()
    public templateButton = false;

    public templateUrl: string;

    author: Observable<any>;

    public userUid: string;

    private userNickname: string;

    public anonymous: boolean;

    constructor(private snack: MatSnackBar, private translator: TranslateService,
                private listService: ListService, private translate: TranslateService, private media: ObservableMedia,
                private router: Router, private auth: AngularFireAuth, private userService: UserService,
                private dialog: MatDialog, private templateService: ListTemplateService) {
        super();
    }

    public openLinkPopup(list: List): void {
        const link = new CustomLink();
        link.redirectTo = `list/${list.$key}`;
        this.dialog.open(CustomLinkPopupComponent, {data: link});
    }

    public getLink(): string {
        return `${window.location.protocol}//${window.location.host}/list/${this.list.$key}`;
    }

    public openPermissions(list: List): void {
        this.dialog.open(PermissionsPopupComponent, {data: list})
            .afterClosed()
            .filter(res => res !== '')
            .mergeMap(res => this.listService.set(res.$key, res))
            .subscribe();
    }

    openTemplatePopup(list: List): void {
        const template = new ListTemplate();
        template.originalListId = list.$key;
        template.author = this.userUid;
        template.uri = list.name;
        template.authorNickname = this.userNickname;
        this.dialog.open(TemplatePopupComponent, {data: template});
    }

    public showCopiedNotification(): void {
        this.snack.open(
            this.translator.instant('Share_link_copied'),
            '', {
                duration: 10000,
                extraClasses: ['snack']
            });
    }

    public showTemplateCopiedNotification(): void {
        this.snack.open(
            this.translator.instant('LIST_TEMPLATE.Share_link_copied'),
            '', {
                duration: 10000,
                extraClasses: ['snack']
            });
    }

    public forkList(): void {
        const fork: List = this.list.clone();
        // Update the forks count.
        this.listService.update(this.list.$key, this.list).first().subscribe();
        fork.authorId = this.auth.auth.currentUser.uid;
        this.listService.add(fork).first().subscribe(key => {
            this.subscriptions.push(this.snack.open(this.translate.instant('List_forked'),
                this.translate.instant('Open')).onAction()
                .subscribe(() => {
                    this.listService.getRouterPath(key)
                        .subscribe(path => {
                            this.router.navigate(path);
                        });
                }));
        });
    }

    public handleClick(panel: MatExpansionPanel): void {
        panel.expanded ? this.opened.emit() : this.closed.emit();
        this.expanded = !this.expanded;
    }

    ngOnInit(): void {
        this.author = this.userService.getCharacter(this.list.authorId)
            .catch(err => {
                return Observable.of(null);
            });

        this.templateService.getByListId(this.list.$key).subscribe(res => {
            if (res !== undefined) {
                this.templateUrl = res.getUrl();
            }
        });

        this.userService.getUserData().subscribe(u => {
            this.userUid = u.$key;
            this.userNickname = u.nickname;
            this.anonymous = u.anonymous;
        });
    }

    public isMobile(): boolean {
        return this.media.isActive('xs');
    }
}
