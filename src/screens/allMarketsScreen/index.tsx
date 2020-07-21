import * as React from 'react';
import { connect } from 'react-redux';
import { InjectedIntlProps, injectIntl } from 'react-intl';
import { RouteProps, withRouter } from 'react-router-dom';
import { MarketsTable } from '../../containers';

import {
    RootState,
    selectUserLoggedIn,
} from '../../modules';


interface ReduxProps {
    isLoggedIn: boolean;
}

type Props = ReduxProps & RouteProps & InjectedIntlProps;


class allMarkets extends React.Component<Props>{
    private iframeInside(){
        return window.top !== window.self;
    }
    public render(){
        return (
            <div className={this.iframeInside() ? "pg-allmarkets-screen pg-allmarkets-screen__iframe" : "pg-allmarkets-screen"} >
                <MarketsTable />
            </div>
        );
    }
}

const mapStateToProps = (state: RootState): ReduxProps => ({
    isLoggedIn: selectUserLoggedIn(state),
});
export const allMarketsScreen =  withRouter(injectIntl(connect(mapStateToProps, null)(allMarkets) as any));