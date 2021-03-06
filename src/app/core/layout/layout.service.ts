import {Injectable} from '@angular/core';
import {LayoutRow} from './layout-row';
import {NgSerializerService} from '@kaiu/ng-serializer';
import {LayoutRowOrder} from './layout-row-order.enum';
import {LayoutRowFilter} from './layout-row-filter';
import {LayoutRowDisplay} from './layout-row-display';
import {List} from '../../model/list/list';
import {FilterResult} from './filter-result';
import {ListLayout} from './list-layout';
import {LayoutOrderService} from './layout-order.service';
import {Observable} from 'rxjs/Observable';
import {UserService} from '../database/user.service';
import {ListRow} from '../../model/list/list-row';

@Injectable()
export class LayoutService {

    private _layouts: Observable<ListLayout[]>;

    constructor(private serializer: NgSerializerService, private layoutOrder: LayoutOrderService, private userService: UserService) {
        this._layouts =
            this.userService.getUserData()
                .map(userData => {
                    const layouts = userData.layouts;
                    if (layouts === undefined || layouts === null || layouts.length === 0) {
                        return [new ListLayout('Default layout', this.defaultLayout)];
                    }
                    return layouts;
                })
                .map(layouts => {
                    return layouts.map(layout => {
                        if (layout.rows.length === 0) {
                            layout.rows = this.defaultLayout;
                        }
                        return layout;
                    });
                });
    }

    public getDisplay(list: List, index: number): Observable<LayoutRowDisplay[]> {
        return this.getLayoutRows(index)
            .catch(() => Observable.of(this.defaultLayout))
            .map(layoutRows => {
                if (layoutRows.find(row => row.filter.name === 'ANYTHING') === undefined) {
                    throw new Error('List layoutRows has to contain an ANYTHING category');
                }
                let unfilteredRows = list.items.filter(row => row.hidden !== true);
                return layoutRows.map(row => {
                    const result: FilterResult = row.filter.filter(unfilteredRows);
                    unfilteredRows = result.rejected;
                    const orderedAccepted = this.layoutOrder.order(result.accepted, row.orderBy, row.order);
                    return {
                        title: row.name,
                        rows: orderedAccepted,
                        index: row.index,
                        zoneBreakdown: row.zoneBreakdown,
                        tiers: row.tiers,
                        filterChain: row.filter.name,
                        hideIfEmpty: row.hideIfEmpty,
                    };
                }).sort((a, b) => a.index - b.index);
            });
    }

    public getRecipes(list: List, index: number): Observable<ListRow[]> {
        return this.getLayout(index).map(layout => {
            return this.layoutOrder.order(list.recipes, layout.recipeOrderBy, layout.recipeOrder);
        });
    }

    public getLayoutRows(index: number): Observable<LayoutRow[]> {
        return this.getLayout(index).map(layout => {
            if (layout === undefined) {
                layout = new ListLayout('Default layout', this.defaultLayout);
            }
            return layout.rows.sort((a, b) => {
                // ANYTHING has to be last filter applied, as it rejects nothing.
                if (a.filter.name === 'ANYTHING') {
                    return 1;
                }
                if (b.filter.name === 'ANYTHING') {
                    return -1;
                }
                return a.index - b.index;
            });
        });
    }

    public getLayout(index: number): Observable<ListLayout> {
        return this._layouts.map(layouts => layouts[index]);
    }

    public get layouts(): Observable<ListLayout[]> {
        return this._layouts;
    }

    public persist(layouts: ListLayout[]): Observable<void> {
        return this.userService.getUserData()
            .first()
            .mergeMap(user => {
                user.layouts = layouts;
                return this.userService.set(user.$key, user);
            })
    }

    public get defaultLayout(): LayoutRow[] {
        return [
            new LayoutRow('Gathering', 'NAME', LayoutRowOrder.DESC, LayoutRowFilter.IS_GATHERING.name, 0, true),
            new LayoutRow('Pre_crafts', 'NAME', LayoutRowOrder.DESC, LayoutRowFilter.IS_CRAFT.name, 3),
            new LayoutRow('Other', 'NAME', LayoutRowOrder.DESC, LayoutRowFilter.ANYTHING.name, 2),
        ]
    }

}
