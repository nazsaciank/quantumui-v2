import * as React from 'react';
import { InjectedIntlProps, injectIntl } from 'react-intl';
import { connect, MapDispatchToPropsFunction, MapStateToProps } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { incrementalOrderBook } from '../../api';
import { Decimal } from '../../components/Decimal';
import { GridItem } from '../../components/GridItem';
import { TabPanel } from '../../components';

import { ChartsIcon, SearchIcon, UserIcon, OrderIcon } from '../../assets/images/tradingIcon';

import {
    MarketDepthsComponent,
    MarketsComponent,
    OpenOrdersComponent,
    OrderBook,
    OrderComponent,
    RecentTrades,
    ToolBar,
    TradingChart,
} from '../../containers';
import { getUrlPart, setDocumentTitle } from '../../helpers';
import {
    RootState,
    selectCurrentMarket,
    selectMarketTickers,
    selectUserInfo,
    selectUserLoggedIn,
    setCurrentMarket,
    setCurrentPrice,
    Ticker,
    User,
} from '../../modules';
import { GridLayoutState, saveLayouts, selectGridLayoutState } from '../../modules/public/gridLayout';
import { Market, marketsFetch, selectMarkets } from '../../modules/public/markets';
import { depthFetch } from '../../modules/public/orderBook';
import { rangerConnectFetch, RangerConnectFetch } from '../../modules/public/ranger';
import { RangerState } from '../../modules/public/ranger/reducer';
import { selectRanger } from '../../modules/public/ranger/selectors';

const { WidthProvider, Responsive } = require('react-grid-layout');

const breakpoints = {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
    xxs: 0,
};

const cols = {
    lg: 24,
    md: 24,
    sm: 12,
    xs: 12,
    xxs: 12,
};

interface ReduxProps {
    currentMarket: Market | undefined;
    markets: Market[];
    user: User;
    rangerState: RangerState;
    userLoggedIn: boolean;
    rgl: GridLayoutState;
    tickers: {
        [pair: string]: Ticker,
    };
}

interface DispatchProps {
    depthFetch: typeof depthFetch;
    marketsFetch: typeof marketsFetch;
    rangerConnect: typeof rangerConnectFetch;
    setCurrentPrice: typeof setCurrentPrice;
    setCurrentMarket: typeof setCurrentMarket;
    saveLayouts: typeof saveLayouts;
}

interface StateProps {
    orderComponentResized: number;
    orderBookComponentResized: number;
    index: number,
    windowWidth: number,
}

const ReactGridLayout = WidthProvider(Responsive);
type Props = DispatchProps & ReduxProps & RouteComponentProps & InjectedIntlProps;

const TradingWrapper = props => {
    const { orderComponentResized, orderBookComponentResized, layouts, handleResize } = props;
    const children = React.useMemo(() => {
        const data = [
            {
                i: 1,
                render: () => <OrderComponent size={orderComponentResized} />,
            },
            {
                i: 2,
                render: () => <TradingChart />,
            },
            {
                i: 3,
                render: () => <OrderBook size={orderBookComponentResized} />,
            },
            {
                i: 4,
                render: () => <MarketDepthsComponent />,
            },
            {
                i: 5,
                render: () => <OpenOrdersComponent/>,
            },
            {
                i: 6,
                render: () => <RecentTrades/>,
            },
            /*
            {
                i: 7,
                render: () => <MarketsComponent/>,
            },
            */
        ];

        // @ts-ignore
        return data.map((child: GridChildInterface) => (
            <div key={child.i}>
                <GridItem>{child.render ? child.render() : `Child Body ${child.i}`}</GridItem>
            </div>
        ));
    }, [orderComponentResized, orderBookComponentResized]);

    return (
        <ReactGridLayout
            breakpoints={breakpoints}
            cols={cols}
            draggableHandle=".cr-table-header__content, .pg-trading-screen__tab-panel, .draggable-container"
            rowHeight={14}
            layouts={layouts}
            onLayoutChange={() => {return;}}
            margin={[5, 5]}
            onResize={handleResize}
        >
            {children}
        </ReactGridLayout>
    );
};

class Trading extends React.Component<Props, StateProps> {
    public readonly state = {
        orderComponentResized: 5,
        orderBookComponentResized: 5,
        index: 0,
        windowWidth: window.innerWidth,
    };

    public componentDidMount() {
        setDocumentTitle('Trading');
        const { markets, currentMarket, userLoggedIn, rangerState: { connected, withAuth } } = this.props;

        if (markets.length < 1) {
            this.props.marketsFetch();
        }

        if (currentMarket && !incrementalOrderBook()) {
            this.props.depthFetch(currentMarket);
        }

        if (!connected) {
            this.props.rangerConnect({ withAuth: userLoggedIn });
        }

        if (userLoggedIn && !withAuth) {
            this.props.rangerConnect({ withAuth: userLoggedIn });
        }

        window.addEventListener('resize', this.handleWindowResize);
    }

    public componentWillUnmount() {
        this.props.setCurrentPrice(undefined);
    }

    public componentWillReceiveProps(nextProps) {
        const {
            history,
            markets,
            userLoggedIn,
        } = this.props;

        if (userLoggedIn !== nextProps.userLoggedIn) {
            this.props.rangerConnect({ withAuth: nextProps.userLoggedIn });
        }

        if (markets.length !== nextProps.markets.length) {
            this.setMarketFromUrlIfExists(nextProps.markets);
        }

        if (nextProps.currentMarket) {
            const marketFromUrl = history.location.pathname.split('/');
            const marketNotMatched = nextProps.currentMarket.id !== marketFromUrl[marketFromUrl.length - 1];
            if (marketNotMatched) {
                history.replace(`/trading/${nextProps.currentMarket.id}`);

                if (!incrementalOrderBook()) {
                  this.props.depthFetch(nextProps.currentMarket);
                }
            }
        }

        if (nextProps.currentMarket && nextProps.tickers) {
            this.setTradingTitle(nextProps.currentMarket, nextProps.tickers);
        }
    }

    public render() {
        const { orderComponentResized, orderBookComponentResized, windowWidth } = this.state;
        const { rgl } = this.props;
        return (
            <div className={'pg-trading-screen'}>
                <div className={'pg-trading-wrap'}>
                    <ToolBar/>
                    {
                        windowWidth < 996 ? (
                            <div className="cr-tab-trading">
                                <TabPanel
                                    fixed={true}
                                    panels={this.getPanels()}
                                    onTabChange={this.handleChangeTab}
                                    currentTabIndex={this.state.index}
                                />
                            </div>
                        ) : (
                            <div className={'cr-grid'} data-react-toolbox="grid">
                                <div className="cr-grid__grid-wrapper">
                                    <TradingWrapper
                                        layouts={rgl.layouts}
                                        orderComponentResized={orderComponentResized}
                                        orderBookComponentResized={orderBookComponentResized}
                                        handleResize={this.handleResize}
                                    />
                                </div>
                            </div>
                        )
                    }

                </div>
            </div>
        );
    }
    private getPanels = () => {

        return [
            {
                content: (
                    <div className="cr-tab-items">
                        <div className="cr-tab-item-content h-content h-content-tradingChart">
                            <TradingChart />
                        </div>
                        <div className="cr-tab-item-content h-content h-content-marketDepths">
                            <MarketDepthsComponent />
                        </div>
                    </div>
                ),
                label: 'Charts',
                icon: (
                    <ChartsIcon/>
                ),
            },
            {
                content: (
                    <div className="cr-tab-items">
                        <div className="cr-tab-item-content h-content h-content-order">
                            <OrderComponent />
                        </div>
                    </div>
                ),
                label: 'Shop',
                icon: (
                    <OrderIcon />
                ),
            },
            {
                content: (
                    <div className="cr-tab-items">
                        <div className="cr-tab-item-content h-content h-content-recentTrades">
                            <RecentTrades />
                        </div>
                        <div className="cr-tab-item-content h-content h-content-orderBook">
                            <OrderBook />
                        </div>
                    </div>
                ),
                label: 'Orderbook',
                icon: (
                    <UserIcon />
                ),
            },
            {
                content: (
                    <div className="cr-tab-items">
                        <div className="cr-tab-item-content h-content h-content-openOrders">
                            <OpenOrdersComponent />
                        </div>
                        <div className="cr-tab-item-content h-content h-content-markets">
                            <MarketsComponent />
                        </div>
                    </div>
                ),
                label: 'MarketComponent',
                icon: (
                    <SearchIcon />
                ),
            },
        ] 
    }
    private handleWindowResize = () => {
        this.setState({
            windowWidth: window.innerWidth
        })
    }
    private handleChangeTab = (index: number, label?: string) => {
        if (this.props.handleSendType && label) {
          this.props.handleSendType(index, label);
        }

        this.setState({
            index: index,
        });
    }

    private setMarketFromUrlIfExists = (markets: Market[]): void => {
        const urlMarket: string = getUrlPart(2, window.location.pathname);
        const market: Market | undefined = markets.find(item => item.id === urlMarket);

        if (market) {
            this.props.setCurrentMarket(market);
        }
    };

    private setTradingTitle = (market: Market, tickers: ReduxProps['tickers']) => {
        const tickerPrice = tickers[market.id] ? tickers[market.id].last : '0.0';
        document.title = `${Decimal.format(tickerPrice, market.price_precision)} ${market.name}`;
    };

    private handleResize = (layout, oldItem, newItem) => {
        switch (oldItem.i) {
            case '1':
                this.setState({
                    orderComponentResized: newItem.w,
                });
                break;
            case '3':
                this.setState({
                    orderBookComponentResized: newItem.w,
                });
                break;
            default:
                break;
        }
    };
}

const mapStateToProps: MapStateToProps<ReduxProps, {}, RootState> = state => ({
    currentMarket: selectCurrentMarket(state),
    markets: selectMarkets(state),
    user: selectUserInfo(state),
    rangerState: selectRanger(state),
    userLoggedIn: selectUserLoggedIn(state),
    rgl: selectGridLayoutState(state),
    tickers: selectMarketTickers(state),
});

const mapDispatchToProps: MapDispatchToPropsFunction<DispatchProps, {}> = dispatch => ({
    marketsFetch: () => dispatch(marketsFetch()),
    depthFetch: payload => dispatch(depthFetch(payload)),
    rangerConnect: (payload: RangerConnectFetch['payload']) => dispatch(rangerConnectFetch(payload)),
    setCurrentPrice: payload => dispatch(setCurrentPrice(payload)),
    setCurrentMarket: payload => dispatch(setCurrentMarket(payload)),
    saveLayouts: payload => dispatch(saveLayouts(payload)),
});

// tslint:disable-next-line no-any
const TradingScreen = injectIntl(withRouter(connect(mapStateToProps, mapDispatchToProps)(Trading) as any));

export {
    TradingScreen,
};
