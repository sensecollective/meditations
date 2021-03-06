// components.tsx - Common components

import * as React from 'react';
import * as moment from 'moment';
import route from 'riot-route';
import * as MediumEditor from 'medium-editor';
import MediumEditorTable from 'medium-editor-tables';

import { CommonState } from '../common';

/** An item that has an editable body. Used for task comments and journal entries */
export class Editable<Props> extends React.PureComponent<Props,
  {editor: MediumEditor.MediumEditor}> {
  /** 
   * Reference to the HTML element that the MediumEditor will be installed on; should be set in
   * subclass's render method */
  body: HTMLElement;

  componentWillMount() {
    this.setState({});
  }

  /** Abstract method; should compare body against model to determine if an update is warranted */
  editorUpdated() {
    console.warn('editorUpdated not implemented');
    return false;
  }

  /** Abstract method; dispatch an asynchronous update of the Editable in question */
  editorSave() {
    console.warn('editorSave not implemented');
  }

  /** Lazily create an editor; if it already exists, focus on it */
  editorOpen(e?: React.MouseEvent<HTMLElement>) {
    if (!this.state.editor) {
      const options = {
        autoLink: true,
        placeholder: true, 

        toolbar: {
          buttons: ['bold', 'italic', 'underline',
            'anchor', 'image', 'quote', 'orderedlist', 'unorderedlist',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table'],
        },

        keyboardCommands: false,

        paste: { cleanPastedHTML: true, forcePlainText: false },
        extensions: {
          table: new MediumEditorTable(),
        }};

      const editor = new MediumEditor(this.body, options);

      editor.subscribe('blur', () => {
        // It is possible that blur may have been called because copy-paste causes MediumEditor to
        // create a 'pastebin' element, in which case we do not want to trigger a save.
        if (document.activeElement.id.startsWith('medium-editor-pastebin')) {
          return;
        }

        // Called on editor blur, check if anything needs to be updated and call the appropriate
        // method if so.
        const newBody = this.body.innerHTML;

        // Do not update if nothing has changed
        if (!this.editorUpdated()) {
          return;
        }
        
        this.editorSave();
      });
      this.setState({ editor });
    } 

    // Empty comments will have the no-display class added
    this.body.classList.remove('no-display');
    this.body.focus();
  }
}

/** A muted Octicon button */
interface OcticonButtonProps {
  name: string;
  onClick: () => void;
  tooltip: string;
  tooltipDirection?: string;
  /** Additional classes */
  className?: string;
  /** Octicon class defaulting to btn-octicon, can be overriden */
  octiconClass?: string;
  /** Href for a link, if given */
  href?: string;
}

export const OcticonButton: React.SFC<OcticonButtonProps> =
  ({ name, onClick, href, tooltip, octiconClass, tooltipDirection, className }) => {
    const clickWrap = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      onClick();
    };

    return <a href={href} className={`btn ${octiconClass} tooltipped tooltipped-${tooltipDirection}
        ${className}`}
        aria-label={tooltip}
        onClick={clickWrap} >
        <span className={`octicon octicon-${name}`} />
      </a>;
  };


OcticonButton.defaultProps = {
  tooltipDirection: 'w',
  className: '',
  octiconClass: 'btn-octicon',
};

interface TimeNavigatorProps {
  /** Returns a page-appropriate route string for navigation */
  getRoute: (operation: 'subtract' | 'add' | 'reset', unit?: 'month' | 'year') =>
    string | undefined;

  /** Date to work off of */
  currentDate: moment.Moment;
}

/** Navigate by months or years */
export class TimeNavigator extends React.PureComponent<TimeNavigatorProps, {}> {
  navigate(operation: 'subtract' | 'add' | 'reset', unit?: 'year' | 'month') {
    const routestr = this.props.getRoute(operation, unit);
    if (routestr) {
      route(routestr);
    }
  }

  render() {
    return <div className="d-flex flex-justify-between mb-1">
      <OcticonButton name="triangle-left" tooltip="Go back one year" octiconClass="mr-1"
        href={`#${this.props.getRoute('subtract', 'year')}`}
        onClick={() => this.navigate('subtract', 'year')}
        tooltipDirection="e" />

      <OcticonButton name="chevron-left" tooltip="Go back one month"
        octiconClass="mr-1" tooltipDirection="e"
        href={`#${this.props.getRoute('subtract', 'month')}`}
        onClick={() => this.navigate('subtract', 'month')} />

      <OcticonButton name="calendar" tooltip="Go to current date" tooltipDirection="e"
        octiconClass="mr-1"
        href={`#${this.props.getRoute('reset')}`}
        onClick={() => this.navigate('reset')} />

      <OcticonButton name="chevron-right" tooltip="Go forward one month"
        tooltipDirection="e"
        octiconClass="mr-1"
        href={`#${this.props.getRoute('add', 'month')}`}
        onClick={() => this.navigate('add', 'month')} />

      <OcticonButton name="triangle-right" tooltip="Go forward one year"
        tooltipDirection="e"
        href={`#${this.props.getRoute('add', 'year')}`}
        octiconClass="mr-1"
        onClick={() => this.navigate('add', 'year')} />

      <h2 className="navigation-title ml-1">{this.props.currentDate.format('MMMM YYYY')}</h2>
    </div>;
  }
}

/** Simple CSS loading spinner */
export const Spinner = (props: any) => {
  return <div className="spinner">
    <div className="bounce1" />
    <div className="bounce2" />
    <div className="bounce3" />
  </div>;
};

/**
 * Common UI elements (currently just a notification bar that appears at the top)
 */
export class CommonUI extends React.Component<CommonState, {}> {
  reconnect() {
    this.props.socketReconnect();
  }
  
  renderPopups() {
    if (!this.props.notifications && !this.props.socketClosed) {
      return <span />;
    }

    return <div id="notifications" className="bg-gray border border-gray-dark p-2">
      <h3>Notifications
        {this.props.notifications &&
          <span className="float-right Label Label--gray-darker">
            {this.props.notifications.length}
          </span>
        }
      </h3>

      {this.props.socketClosed && <div>
        <div className="notification flash flash-error mb-2">
          <p>WebSocket connection failed!</p>
          <button className="btn btn-primary" onClick={() => this.reconnect()}>
            Attempt reconnection
          </button>
        </div>
      </div>}

      {this.props.notifications &&
        <button className="btn btn-block mb-2" onClick={this.props.dismissNotifications}>
          Dismiss all notifications
        </button>}

      {this.props.notifications && this.props.notifications.map((n, i) => {
        return <div key={i} className={`notification flash flash-with-icon mb-2
          ${n.error ? 'flash-danger' : ''}`}>
          {n.message}

        </div>;
      })}
    </div>;
  }

  renderModal() {
    return <div id="modal" className="bg-white border border-gray-dark p-2">
      <div className="float-right">
        <button className="btn btn-sm mb-2" onClick={() => this.props.dismissModal()}>
          <span className="octicon octicon-x"
            aria-label="Dismiss prompt" />
        </button>
      </div>
      {this.props.modalBody}
    </div>;
  }

  render() {
    // When socket is not active, blur UI to indicate it is unusable.
    // TODO: Figure out how to capture user interaction as well
  
    let filterAll: any;
    let clickCatch: any;
    if (this.props.modalOpen) {
      filterAll = { style: { filter: 'opacity(80%)' } };
      clickCatch = {
        onClick: (e: MouseEvent) => {
          e.preventDefault();
          this.props.dismissModal();
        },
      };
    }

    if (this.props.socketClosed) {
      filterAll = { style: { filter: 'blur(1px)' } };
      clickCatch = {
        onClick: (e: MouseEvent) => e.preventDefault(),
      };
    }

    return <div>
      {this.props.modalOpen && this.renderModal()}
      {this.renderPopups()}
      <div {...clickCatch} {...filterAll}>{this.props.children}</div>
    </div>;
  }
}

