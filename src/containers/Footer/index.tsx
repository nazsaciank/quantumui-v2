import * as React from 'react';
import { withRouter } from 'react-router-dom';
import { connect, MapDispatchToPropsFunction } from 'react-redux';
import classnames from 'classnames';
import { History } from 'history';

import { Dropdown } from 'react-bootstrap';
import { languages } from '../../api/config';


import {
    changeColorTheme,
    selectCurrentColorTheme,
    RootState,
    changeLanguage,
    selectCurrentLanguage,
    changeUserDataFetch,
    selectUserInfo,
    selectUserLoggedIn,
    User,
} from '../../modules'

import { Moon } from '../../assets/images/Moon';
import { Sun } from '../../assets/images/Sun';
import { colors } from '../../constants';

interface ReduxProps{
    colorTheme: string;
    lang: string;
    isLoggedIn: boolean;
    user: User;
}

interface DispatchProps {
    changeLanguage: typeof changeLanguage;
    changeColorTheme: typeof changeColorTheme;
}

interface State {
    isOpenLanguage: boolean;
}

interface OwnProps {
    history: History;
    changeUserDataFetch: typeof changeUserDataFetch;
}

type Props = ReduxProps & DispatchProps & OwnProps;


class FooterComponent extends React.Component<Props, State> {
    public state = {
        isOpenLanguage: false,
    };
    public render() {
        if (this.props.history.location.pathname.startsWith('/confirm')) {
            return <React.Fragment />;
        }
        const {lang, colorTheme} = this.props;
        const { isOpenLanguage } = this.state;
        const languageName = lang.toUpperCase();
        const languageClassName = classnames('dropdown-menu-language-field', {
            'dropdown-menu-language-field-active': isOpenLanguage,
        });

        return (
            <React.Fragment>
                <footer className="pg-footer">
                    <div className="pg-footer-wrapper-lng">
                        <div className="btn-group pg-navbar__header-settings__account-dropdown dropdown-menu-language-container">
                            <Dropdown>
                                <Dropdown.Toggle variant="primary" id={languageClassName}>
                                    <img
                                        src={this.tryRequire(lang) && require(`../../assets/images/sidebar/${lang}.svg`)}
                                        alt={`${lang}-flag-icon`}
                                    />
                                    <span className="dropdown-menu-language-selected">{languageName}</span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    {this.getLanguageDropdownItems()}
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    </div>
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
                </footer>
            </React.Fragment>
        );
    }

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

    public getLanguageDropdownItems = () => {
        return languages.map((l: string) =>
            <Dropdown.Item onClick={e => this.handleChangeLanguage(l)}>
                <div className="dropdown-row">
                    <img
                        src={this.tryRequire(l) && require(`../../assets/images/sidebar/${l}.svg`)}
                        alt={`${l}-flag-icon`}
                    />
                    <span>{l.toUpperCase()}</span>
                </div>
            </Dropdown.Item>,
        );
    };

    private tryRequire = (name: string) => {
        try {
            require(`../../assets/images/sidebar/${name}.svg`);

            return true;
        } catch (err) {
            return false;
        }
    };


    private handleChangeLanguage = (language: string) => {
        const { user, isLoggedIn } = this.props;

        if (isLoggedIn) {
            const data = user.data && JSON.parse(user.data);

            if (data && data.language && data.language !== language) {
                const payload = {
                    ...user,
                    data: JSON.stringify({
                        ...data,
                        language,
                    }),
                };

                this.props.changeUserDataFetch({ user: payload });
            }
        }

        this.props.changeLanguage(language);
    };
}

const mapStateToProps = (state: RootState): ReduxProps => ({
    lang: selectCurrentLanguage(state),
    colorTheme: selectCurrentColorTheme(state),
    isLoggedIn: selectUserLoggedIn(state),
    user: selectUserInfo(state),
});
const mapDispatchToProps: MapDispatchToPropsFunction<DispatchProps, {}> =
    dispatch => ({
        changeLanguage: payload => dispatch(changeLanguage(payload)),
        changeColorTheme: payload => dispatch(changeColorTheme(payload)),
        changeUserDataFetch: payload => dispatch(changeUserDataFetch(payload)),
    });
// tslint:disable-next-line:no-any
const Footer = withRouter(connect(mapStateToProps, mapDispatchToProps)(FooterComponent) as any) as any;

export {
    Footer,
};
