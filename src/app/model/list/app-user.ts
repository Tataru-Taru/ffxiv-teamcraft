import {DataModel} from '../../core/database/storage/data-model';
import {ListLayout} from '../../core/layout/list-layout';
import {DeserializeAs} from '@kaiu/serializer';
import {Alarm} from '../../core/time/alarm';
import {ListDetailsFilters} from '../other/list-details-filters';

export class AppUser extends DataModel {
    name?: string;
    email?: string;
    masterbooks?: number[];
    lodestoneId?: number;
    avatar?: string;
    favorites?: string[];
    favoriteWorkshops?: string[];
    patron?: boolean;
    anonymous?: boolean;
    providerId?: string;
    patreonEmail?: string;
    // Patron-only feature, nickname internal to teamcraft, must be unique.
    nickname?: string;
    admin?: boolean;
    // List layouts are now stored inside firebase
    @DeserializeAs([ListLayout])
    layouts?: ListLayout[];
    // Alarms are now stored inside firebase
    alarms: Alarm[];
    // Default filters (#289)
    listDetailsFilters: ListDetailsFilters = ListDetailsFilters.DEFAULT;
    // List ids user has write access to
    sharedLists: string[] = [];
    // Workshop ids user has write access to
    sharedWorkshops: string[] = [];
}
