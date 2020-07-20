import * as React from 'react';
import { History } from 'history';
import {
    connect,
    MapDispatchToPropsFunction,
    MapStateToProps,
} from 'react-redux';

import { FormattedMessage } from 'react-intl';
import { Link, RouteProps, withRouter } from 'react-router-dom';
import { pgRoutes } from '../../constants';

import {
    changeColorTheme,
    changeLanguage,
    logoutFetch,
    Market,
    RootState,
    selectCurrentColorTheme,
    selectCurrentLanguage,
    selectCurrentMarket,
    selectUserInfo,
    selectUserLoggedIn,
    User,
    walletsReset,
} from '../../modules';

import { LogoutIcon } from '../../assets/images/sidebar/LogoutIcon';
import { SidebarIcons } from '../../assets/images/sidebar/SidebarIcons';

export interface ReduxProps {
    colorTheme: string;
    currentMarket: Market | undefined;
    address: string;
    isLoggedIn: boolean;
    lang: string;
    success?: boolean;
    user: User;
}

interface DispatchProps {
    changeColorTheme: typeof changeColorTheme;
    changeLanguage: typeof changeLanguage;
    logout: typeof logoutFetch;
    walletsReset: typeof walletsReset;
}

export interface OwnProps {
    onLinkChange?: () => void;
    history: History;
}

type Props = OwnProps & ReduxProps & RouteProps & DispatchProps;

class NavBarComponent extends React.Component<Props> {
    public render() {
        const { isLoggedIn, colorTheme} = this.props;
        const address = this.props.history.location ? this.props.history.location.pathname : '';
        const isLight = colorTheme === 'light';

        return (
            <div className={'pg-navbar'}>
                <div className="pg-navbar-wrapper-nav">
                    {pgRoutes(isLoggedIn, isLight).map(this.renderNavItems(address))}
                    {this.renderLogout()}
                </div>
            </div>
        );
    }
    public renderNavItems = (address: string) => (values: string[], index: number) => {
        const { currentMarket } = this.props;

        const [name, url, img] = values;
        const path = url.includes('/trading') && currentMarket ? `/trading/${currentMarket.id}` : url;
        const isActive = (url === '/trading/' && address.includes('/trading')) || address === url;

        return ( 
            <Link to={path} key={index} className={`${isActive && 'route-selected'}`}>
                <div className="pg-navbar-wrapper-nav-item">
                    <div className="pg-navbar-wrapper-nav-item-img-wrapper">
                        <SidebarIcons 
                            className="pg-navbar-wrapper-nav-item-svg"
                            name={img} 
                        />
                    </div>
                    <p className="pg-navbar-wrapper-nav-item-text">
                        <FormattedMessage id={name} />
                    </p>
                </div>
            </Link>
        );
    }
    public renderLogout = () => {
        const { isLoggedIn } = this.props;
        if (!isLoggedIn) {
            return null;
        }

        return (
            <div className="pg-navbar-wrapper-nav-item" onClick={this.props.logout}>
                <div className="pg-navbar-wrapper-nav-item-img-wrapper">
                    <LogoutIcon className="pg-navbar-wrapper-nav-item-svg"/>
                </div>
                <p className="pg-navbar-wrapper-nav-item-text">
                    <FormattedMessage id={'page.body.profile.content.action.logout'} />
                </p>
            </div>
        );
    }
}

const mapStateToProps: MapStateToProps<ReduxProps, {}, RootState> =
    (state: RootState): ReduxProps => ({
        colorTheme: selectCurrentColorTheme(state),
        currentMarket: selectCurrentMarket(state),
        address: '',
        lang: selectCurrentLanguage(state),
        user: selectUserInfo(state),
        isLoggedIn: selectUserLoggedIn(state),
    });

const mapDispatchToProps: MapDispatchToPropsFunction<DispatchProps, {}> =
    dispatch => ({
        changeColorTheme: payload => dispatch(changeColorTheme(payload)),
        changeLanguage: payload => dispatch(changeLanguage(payload)),
        logout: () => dispatch(logoutFetch()),
        walletsReset: () => dispatch(walletsReset()),
    });

const NavBar = withRouter(connect(mapStateToProps, mapDispatchToProps)(NavBarComponent) as any) as any;

export {
    NavBar,
};