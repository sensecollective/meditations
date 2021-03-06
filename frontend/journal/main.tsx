import * as React from 'react';
import route from 'riot-route';

import * as moment from 'moment';
import * as common from '../common';

import { JournalRoot } from './components';
import { SidebarState } from './sidebar';
import { store, dispatch, Entry } from './state';

export const main = () => {
  ///// ROUTES
  // Install router. If no route was specifically given, start with #view/YYYY-MM
  common.installRouter('/journal#', `view/${moment().format(common.MONTH_FORMAT)}`, {
    no_action: () => route(`view/${moment().format(common.MONTH_FORMAT)}`),
    journal: () => null, // Dummy, called if journal is clicked from navbar

    view: (datestr: string, entryScrollId?: number) => {
      const date = moment(datestr, common.MONTH_FORMAT);

      common.setTitle('Journal', `${date.format('MMMM YYYY')}`);

      // TODO: Update habits link to reflect current date
      dispatch((dispatch) => {
        common.get(`/journal/entries/date?date=${datestr}`, ((entries: Entry[]) => {
          entries.forEach(common.processModel);
          dispatch({ date, entries, type: 'VIEW_MONTH' });
        }));
      });

      dispatch((dispatch) => {
        common.get(`/journal/entries/date?date=${datestr}`, ((entries: Entry[]) => {
          entries.forEach(common.processModel);
          dispatch({ date, entries, type: 'VIEW_MONTH' });
        }));
      });
    },

    tag: (tagname: string) => {
      common.setTitle('Journal', `Tag #${tagname}`);
      dispatch((dispatch) => {
        common.get(`/journal/entries/tag/${tagname}`, ((entries: Entry[]) => {
          entries.forEach(common.processModel);
          dispatch({ entries, type: 'VIEW_TAG', tag: tagname });
        }));
      });
    },
    
    name: (name: string) => {
      common.setTitle('Journal', `${name}`);
      dispatch((dispatch) => {
        common.get(`/journal/entries/name/${name}`, (entry: Entry) => {
          common.processModel(entry);
          dispatch({ entry, type: 'VIEW_NAMED_ENTRY' });
        });
      });
    },
  });

  // WebSocket handling
  type JournalMessage = {
    Type: 'UPDATE_ENTRY';
    Datum: Entry;
  } | {
    Type: 'DELETE_ENTRY';
    Datum: number;
  } | {
    Type: 'CREATE_ENTRY';
    Datum: Entry;
  } | {
    Type: 'SIDEBAR';
    Datum: SidebarState;
  };

  const socket = common.makeSocket('journal/sync', (msg: JournalMessage) => {
    if (msg.Type === 'UPDATE_ENTRY') {
      common.processModel(msg.Datum);
      dispatch({ type: 'UPDATE_ENTRY', entry: msg.Datum });
    } else if (msg.Type === 'DELETE_ENTRY') {
      dispatch({ type: 'DELETE_ENTRY', ID: msg.Datum });
    } else if (msg.Type === 'CREATE_ENTRY') {
      common.processModel(msg.Datum);
      // TODO: View change?
      // TODO: Dispatch view change
      dispatch({ type: 'CREATE_ENTRY', entry: msg.Datum });
    } else if (msg.Type === 'SIDEBAR') {
      dispatch({ type: 'MOUNT_SIDEBAR', sidebar: msg.Datum });
    } 
  }, () => {
    ///// RENDER 
    // After socket connects
    common.render('journal-root', store, <JournalRoot />);

    // Fetch sidebar
    common.post('/journal/sidebar');
  });
};
