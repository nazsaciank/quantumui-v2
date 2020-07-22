import * as React from 'react';

import { InjectedIntlProps, injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { WalletItemProps } from '../../components';
import {
    alertPush,
    RootState,
    selectCurrentPrice,
    selectDepthAsks,
    selectDepthBids,
    selectUserLoggedIn,
    selectMarkets,
    selectWallets,
    setCurrentPrice,
    Wallet,
    walletsFetch,
} from '../../modules';
import { Market, selectCurrentMarket, selectMarketTickers, setCurrentMarket } from '../../modules/public/markets';
import { orderExecuteFetch, selectOrderExecuteLoading } from '../../modules/user/orders';

import { InstantexComponent } from '../../components/Instantex'
import { OrderProps } from '../../components/Order'

interface ReduxProps {
    currentMarket: Market | undefined;
    markets: Market[];
    executeLoading: boolean;
    marketTickers: {
        [key: string]: {
            last: string;
        },
    };
    bids: string[][];
    asks: string[][];
    wallets: WalletItemProps[];
    currentPrice: number | undefined;
}

interface StoreProps {
    orderSide: string;
    priceLimit: number | undefined;
    width: number;

    from: string;
    to: string;
    type: 'buy' | 'sell';
}

interface DispatchProps {
    setCurrentMarket: typeof setCurrentMarket;
    accountWallets: typeof walletsFetch;
    setCurrentPrice: typeof setCurrentPrice;
    orderExecute: typeof orderExecuteFetch;
    pushAlert: typeof alertPush;
}
type Props = ReduxProps & DispatchProps & InjectedIntlProps;

class Instantex extends React.PureComponent<Props, StoreProps>{
    constructor(props: Props) {
        super(props);

        this.state = {
            orderSide: 'buy',
            priceLimit: undefined,
            width: 0,
            
            from: '',
            to: '',
            type: 'buy'
        };

        this.orderRef = React.createRef();
    }
    private getOrderTypes = [
        this.props.intl.formatMessage({ id: 'page.body.trade.header.newOrder.content.instantex.market-price' }),
        this.props.intl.formatMessage({ id: 'page.body.trade.header.newOrder.content.instantex.fixed-rate' })
    ];

    private orderRef;

    public componentDidUpdate() {
        if (this.orderRef.current && this.state.width !== this.orderRef.current.clientWidth) {
            this.setState({
                width: this.orderRef.current.clientWidth,
            });
        }
        if (this.props.currentMarket && this.state.from === '' && this.state.to === ''){
            this.setState({
                from: this.props.currentMarket.quote_unit,
                to: this.props.currentMarket.base_unit
            })
        }
    }

    public componentWillReceiveProps(next: Props) {
        const {userLoggedIn, accountWallets} = this.props;
        if (userLoggedIn && (!next.wallets || next.wallets.length === 0)) {
            accountWallets();
        }
        if (+next.currentPrice && next.currentPrice !== this.state.priceLimit) {
            this.setState({
                priceLimit: +next.currentPrice,
            });
        }
    }

    render(){

        const {marketTickers, currentMarket, userLoggedIn, asks, bids, wallets} = this.props;
        const {priceLimit, type, from, to} = this.state;
        if (!currentMarket) {
            return null;
        }
        const walletBase = this.getWallet(currentMarket.base_unit, wallets);
        const walletQuote = this.getWallet(currentMarket.quote_unit, wallets);

        //const to = currentMarket.base_unit;
        //const from = currentMarket.quote_unit;
        
        const listTranslate = {
            priceText: this.translate('page.body.trade.header.newOrder.content.price'),
            amountText: this.translate('page.body.trade.header.newOrder.content.amount'),
            totalText: this.translate('page.body.trade.header.newOrder.content.total'),
            availableText: this.translate('page.body.trade.header.newOrder.content.available'),
            submitUserLogOut: this.translate('page.body.trade.header.newOrder.content.tabs.SignInOrSignUp'),
            submitExchange: this.translate('page.body.trade.header.newOrder.content.tabs.exchage'),
        }

        const currentTicker = marketTickers[currentMarket.id];
        const defaultCurrentTicker = { last: '0' };

        return (
            <div className="cr-instantex-container">
                <InstantexComponent
                    currencyFrom={this.currencyBySelected()}
                    currencyTo={this.currencyAll()}
                    type={type}
                    asks={asks}
                    bids={bids}
                    availableBase={this.getAvailableValue(walletBase)}
                    availableQuote={this.getAvailableValue(walletQuote)}
                    priceMarketBuy={Number((currentTicker || defaultCurrentTicker).last)}
                    priceMarketSell={Number((currentTicker || defaultCurrentTicker).last)}
                    priceLimit={priceLimit}
                    from={from}
                    to={to}
                    orderTypes={this.getOrderTypes}
                    currentMarketAskPrecision={currentMarket.amount_precision}
                    currentMarketBidPrecision={currentMarket.price_precision}
                    translate={listTranslate}
                    userLoggedIn={userLoggedIn}
                    onSubmit={this.handleSubmit}
                    handleChangeFrom={this.handleChangeFrom}
                    handleChangeTo={this.handleChangeTo}
                />
            </div>
        )
    }

    private translate = (id) => {
        return this.props.intl.formatMessage({id: id})
    }
    private getAvailableValue(wallet: Wallet | undefined) {
        return wallet && wallet.balance ? Number(wallet.balance) : 0;
    }
    private getWallet(currency: string, wallets: WalletItemProps[]) {
        const currencyLower = currency.toLowerCase();
        return wallets.find(w => w.currency === currencyLower) as Wallet;
    }

    private currencyBySelected() {
        const { markets } = this.props;
        const { to } = this.state;

        const from = markets.map(obj => {
            let val;
            if(obj['base_unit'] === to){
                val = obj['quote_unit'].toUpperCase();
            }else if(obj['quote_unit'] === to){
                val = obj['base_unit'].toUpperCase();
            }
            return val;
        }).filter((obj, i, self) => self.indexOf(obj) === i && obj !== undefined);

        return from;
    }
    private currencyAll() {
        const { markets } = this.props;

        const from = markets.map(obj => obj['quote_unit'].toUpperCase());
        const to = markets.map(obj => obj['base_unit'].toUpperCase());

        return from.concat(to).filter((obj, i, self) => self.indexOf(obj) === i);
        
    }

    private handleSubmit = (value: OrderProps) => {
        const { currentMarket } = this.props;

        if (!currentMarket) {
            return;
        }

        const {
            amount,
            available,
            orderType,
            price,
            type,
        } = value;

        this.props.setCurrentPrice();

        const resultData = {
            market: currentMarket.id,
            side: type,
            volume: amount.toString(),
            ord_type: (orderType as string).toLowerCase(),
        };

        const order = orderType === 'Limit' ? { ...resultData, price: price.toString() } : resultData;
        let orderAllowed = true;

        if (+resultData.volume < +currentMarket.min_amount) {
            this.props.pushAlert({
                message: [this.props.intl.formatMessage(
                    { id: 'error.order.create.minAmount' },
                    { amount: currentMarket.min_amount, currency: currentMarket.base_unit.toUpperCase()},
                )],
                type: 'error',
            });

            orderAllowed = false;
        }

        if (+price < +currentMarket.min_price) {
            this.props.pushAlert({
                message: [this.props.intl.formatMessage(
                    { id: 'error.order.create.minPrice' },
                    { price: currentMarket.min_price, currency: currentMarket.quote_unit.toUpperCase()},
                )],
                type: 'error',
            });

            orderAllowed = false;
        }

        if (+currentMarket.max_price && +price > +currentMarket.max_price) {
            this.props.pushAlert({
                message: [this.props.intl.formatMessage(
                    { id: 'error.order.create.maxPrice' },
                    { price: currentMarket.max_price, currency: currentMarket.quote_unit.toUpperCase()},
                )],
                type: 'error',
            });

            orderAllowed = false;
        }

        if ((+available < (+amount * +price) && order.side === 'buy') ||
            (+available < +amount && order.side === 'sell')) {
            this.props.pushAlert({
                message: [this.props.intl.formatMessage(
                    { id: 'error.order.create.available' },
                    { available: available, currency: order.side === 'buy' ?
                        currentMarket.quote_unit.toUpperCase() :
                        currentMarket.base_unit.toUpperCase(),
                    },
                )],
                type: 'error',
            });

            orderAllowed = false;
        }

        if (orderAllowed) {
            this.props.orderExecute(order);
        }
    };

    private handleChangeTo = (to, index) => {
        const { markets } = this.props;
        const { from } = this.state;
        to = to.toLowerCase();

        
        const key = `${to}${from}`;
        const _key = `${from}${to}`;

        let marketToSet = markets.find(obj => obj.id === key || obj.id === _key  || obj.base_unit === to || obj.quote_unit === to);

        if(marketToSet){
            this.props.setCurrentMarket(marketToSet)
            this.setState({
                type: marketToSet.base_unit === to ? 'buy' : 'sell',
                from: marketToSet.base_unit === to ? marketToSet.quote_unit : marketToSet.base_unit,
                to: marketToSet.base_unit === to ? marketToSet.base_unit : marketToSet.quote_unit,
            });
                
        }
        
    }
    private handleChangeFrom = (from, index) => {
        const { markets, currentMarket } = this.props;
        const { to } = this.state;

        from = from.toLowerCase();
        
        const key = `${to}${from}`; 
        const _key = `${from}${to}`;

        const marketToSet = markets.find(obj => obj.id === key || obj.id === _key);

        console.log(marketToSet)

        if(marketToSet){
            if (!currentMarket || currentMarket.id !== marketToSet.id) {
                this.props.setCurrentMarket(marketToSet)
                this.setState({
                    type: marketToSet.base_unit === from ? 'sell' : 'buy',
                    from: from,
                    to: to,
                })
            }
        }
    }
}

const mapStateToProps = (state: RootState) => ({
    bids: selectDepthBids(state),
    asks: selectDepthAsks(state),
    currentMarket: selectCurrentMarket(state),
    markets: selectMarkets(state),
    executeLoading: selectOrderExecuteLoading(state),
    marketTickers: selectMarketTickers(state),
    wallets: selectWallets(state),
    currentPrice: selectCurrentPrice(state),
    userLoggedIn: selectUserLoggedIn(state),
});

const mapDispatchToProps = dispatch => ({
    setCurrentMarket: (market: Market) => dispatch(setCurrentMarket(market)),
    accountWallets: () => dispatch(walletsFetch()),
    orderExecute: payload => dispatch(orderExecuteFetch(payload)),
    pushAlert: payload => dispatch(alertPush(payload)),
    setCurrentPrice: payload => dispatch(setCurrentPrice(payload)),
});
const InstantexContainer = injectIntl(connect(mapStateToProps, mapDispatchToProps)(Instantex as any)) as any;

export {InstantexContainer}