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


//import { Moon } from '../../assets/images/Moon';
//import { Sun } from '../../assets/images/Sun';
//import { colors } from '../../constants';

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
                {
                    /*
                        <div className="pg-navbar__header-settings">
                            <div className="pg-navbar__header-settings__switcher">
                                <div
                                    className="pg-navbar__header-settings__switcher__items"
                                    onClick={e => this.handleChangeCurrentStyleMode(colorTheme === 'light' ? 'basic' : 'light')}
                                >
                                    {this.getLightDarkMode()}
                                </div>
                            </div>
                        </div>
                    */
                }
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
                        <SidebarIcons name={img} className="pg-navbar-wrapper-nav-item-svg" />
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
    /*
    private getLightDarkMode = () => {
        const { colorTheme } = this.props;

        if (colorTheme === 'basic') {
            return (
                <React.Fragment>
                    <div className="switcher-item">
                        <Sun fillColor={colors.light.navbar.sun}/>
                    </div>
                    <div className="switcher-item switcher-item--active">
                        <Moon fillColor={colors.light.navbar.moon}/>
                    </div>
                </React.Fragment>
            );
        }

        return (
            <React.Fragment>
                <div className="switcher-item switcher-item--active">
                    <Sun fillColor={colors.basic.navbar.sun}/>
                </div>
                <div className="switcher-item">
                    <Moon fillColor={colors.basic.navbar.moon}/>
                </div>
            </React.Fragment>
        );
    };
   

    private handleChangeCurrentStyleMode = (value: string) => {
        this.props.changeColorTheme(value);
    };
     */
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