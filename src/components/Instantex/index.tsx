import * as React from 'react';

import { cleanPositiveFloatInput, /*getAmount,*/ getTotalPrice } from '../../helpers';

import { OrderProps } from '../Order';

import { TabPanel } from '../TabPanel';
import { OrderInput } from '../OrderInput';
import { Decimal } from '../Decimal';
import { Dropdown } from 'react-bootstrap';

import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

type OnSubmitCallback = (order: OrderProps) => void;
type OnChangeFromCallback = (from: string, index:number) => void;
type OnChangeToCallback = (to: string, index: number) => void;
type FormType = 'buy' | 'sell';

interface InstantexProps {

    currencyFrom: [];

    currencyTo: [];

    type: FormType;

    asks: string[][];

    bids: string[][];

    availableBase: number;

    availableQuote: number;

    priceMarketBuy: number;

    priceMarketSell: number;

    priceLimit?: number;

    from: string;

    to: string;

    orderTypes: React.ReactNodeArray;

    currentMarketAskPrecision: number;

    currentMarketBidPrecision: number;

    onSubmit: OnSubmitCallback;

    handleChangeFrom: OnChangeFromCallback;

    handleChangeTo: OnChangeToCallback;

    listenInputPrice?: () => void;

    translate: {
        priceText: string;
        amountText: string;
        totalText: string;
        availableText: string;
        submitUserLogOut: string;
        submitExchange: string;
    };

    userLoggedIn: boolean;
}

interface InstantexStatus {

    index: number;

    orderType: string;

    indexDropdownFrom: number;

    indexDropdownTo: number;

    priceFocused: boolean,
    
    amountFocused: boolean,
    
    amount: string;

    price: string;
   
    available: number;
    
    proposals:string[][];

    priceMarket: number;

    currentMarketAskPrecision: number;

    currentMarketBidPrecision: number;

}

const handleSetValue = (value: string | number | undefined, defaultValue: string) => value || defaultValue;

const checkButtonIsDisabled = (safeAmount: number, safePrice: number, price: string, props: InstantexProps, state: InstantexStatus) => {
    const invalidAmount = safeAmount <= 0;
    const invalidLimitPrice = Number(price) <= 0 && state.index === 0;
    const invalidMarketPrice = safePrice <= 0 && state.index === 1;
    return /*props.disabled ||*/ !state.available || invalidAmount || invalidLimitPrice || invalidMarketPrice;
};

class InstantexComponent extends React.Component<InstantexProps, InstantexStatus>{

    constructor(props: InstantexProps){
        super(props);

        this.state = {
            index: 0,
            orderType: 'Market',

            indexDropdownFrom: 0,
            indexDropdownTo: 0,

            priceFocused: false,
            amountFocused: false,

            amount: '',
            price: '',
            
            available: 0,
            proposals: [],
            priceMarket: 0,

            currentMarketAskPrecision: this.props.currentMarketAskPrecision || 6,
            currentMarketBidPrecision: this.props.currentMarketBidPrecision || 6,
        }
    }
    public componentWillReceiveProps(next: InstantexProps) {
        const nextPriceLimitTruncated = Decimal.format(next.priceLimit, this.state.currentMarketBidPrecision);
        if (this.state.orderType === 'Limit' && next.priceLimit && nextPriceLimitTruncated !== this.state.price) {
            this.setState({
                price: nextPriceLimitTruncated,
            });
        }

        this.setState({
            proposals: next.type === 'buy' ? next.asks : next.bids,
            available: next.type === 'buy' ? next.availableQuote : next.availableBase,
            priceMarket: next.type === 'buy' ? next.priceMarketBuy : next.priceMarketSell,
            currentMarketAskPrecision: next.currentMarketAskPrecision,
            currentMarketBidPrecision: next.currentMarketBidPrecision,
        });
    }

    render = () => {
        const { 
            from,
            to,
            type,
            currentMarketAskPrecision, 
            currentMarketBidPrecision, 
            orderTypes, 
            translate,
            userLoggedIn,
            currencyFrom,
            currencyTo
        } = this.props;
        const {
            priceFocused,
            amountFocused, 
            price, 
            amount,
            proposals,
            orderType,
            priceMarket,
            available,
        } = this.state;

        const safeAmount = Number(amount) || 0;
        const totalPrice = getTotalPrice(amount, priceMarket, proposals);
        const safePrice = totalPrice / Number(amount) || priceMarket;
        
        const total = orderType === 'Market'
            ? totalPrice : safeAmount * (Number(price) || 0);

        const availablePrecision = type === 'buy' ? currentMarketBidPrecision : currentMarketAskPrecision;
        const availableCurrency = type === 'buy' ? from : to;

        return (
            <div className="cr-instantex-form" onKeyPress={this.handleEnterPress}>
                <TabPanel 
                    fixed={true}
                    panels={[{content:(<div></div>), label:String(orderTypes[0])},{content:(<div></div>), label:String(orderTypes[1])}]}
                    currentTabIndex={this.state.index}
                    onCurrentTabChange={this.handleChangeTabs}
                />
                <div className="cr-order-item">
                    <OrderInput
                        currency={this.renderDropdownCurrencys(currencyTo, to, 'to')}
                        label={translate.amountText}
                        placeholder={translate.amountText}
                        value={handleSetValue(amount, '')}
                        isFocused={amountFocused}
                        handleChangeValue={this.handleAmountChange}
                        handleFocusInput={() => this.handleFieldFocus(translate.amountText)}
                    />
                </div>
                {
                    orderType === 'Limit' ? (
                        <div className="cr-order-item">
                            <OrderInput
                                currency={this.renderDropdownCurrencys(currencyFrom, from, 'from')}
                                label={translate.priceText}
                                placeholder={translate.priceText}
                                value={handleSetValue(price,'')}
                                isFocused={priceFocused}
                                handleChangeValue={this.handlePriceChange}
                                handleFocusInput={() => this.handleFieldFocus(translate.priceText)}
                            />
                        </div>
                    ) : (
                        <div className="cr-order-item">
                            <div className="cr-order-input">
                                <fieldset className="cr-order-input__fieldset">
                                    <legend className={'cr-order-input__fieldset__label'}>
                                        {handleSetValue(translate.priceText, '')}
                                    </legend>
                                    <div className="cr-order-input__fieldset__input">
                                        &asymp;<span className="cr-order-input__fieldset__input__price">{handleSetValue(Decimal.format(safePrice, currentMarketBidPrecision), '0')}</span>
                                    </div>
                                </fieldset>
                                <div className="cr-order-input__crypto-icon">
                                    {this.renderDropdownCurrencys(currencyFrom, from, 'from')}
                                </div>
                            </div>
                        </div>
                    )
                }
                <div className="cr-order-item">
                    <div className="cr-order-item__total">
                        <label className="cr-order-item__total__label">
                            {handleSetValue(translate.totalText, 'Total')}
                        </label>
                        <div className="cr-order-item__total__content">
                            {orderType === 'Limit' ? (
                                <span className="cr-order-item__total__content__amount">
                                    {Decimal.format(total, currentMarketBidPrecision + currentMarketAskPrecision)}
                                </span>
                            ) : (
                                <span className="cr-order-item__total__content__amount">
                                    &asymp;{Decimal.format(total, currentMarketBidPrecision + currentMarketAskPrecision)}
                                </span>
                            )}
                            <span className="cr-order-item__total__content__currency">
                                {type === 'buy' ? from.toUpperCase() : to.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="cr-order-item">
                    <div className="cr-order-item__available">
                        <label className="cr-order-item__available__label">
                            {handleSetValue(translate.availableText, 'Available')}
                        </label>
                        <div className="cr-order-item__available__content">
                            <span className="cr-order-item__available__content__amount">
                                {available ? Decimal.format(available, availablePrecision) : ''}
                            </span>
                            <span className="cr-order-item__available__content__currency">
                                {available ? availableCurrency.toUpperCase() : ''}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="cr-order-item">
                    {`${type.toUpperCase()} ${type === "buy" ? to.toUpperCase() : from.toUpperCase()}`}
                </div>
                <div className="cr-order-item">
                    {
                        userLoggedIn ? (
                            <Button
                                block={true}
                                className="btn-block mr-1 mt-1 btn-lg"
                                disabled={checkButtonIsDisabled(safeAmount, safePrice, price, this.props, this.state)}
                                onClick={this.handleSubmit}
                                size="lg"
                                variant={type === 'buy' ? 'success' : 'danger'}
                            >
                                {translate.submitExchange}
                            </Button>
                        ) : (
                            <Link to="/signin" className="btn btn-primary btn-block btn-lg">
                                {translate.submitUserLogOut || 'Sign In or Sign Up'}
                            </Link>
                        )
                    }
                </div>
            </div>
        )
    }

    private handleChangeTabs = (index: number, label?: string) =>{
        this.setState({
            index: index,
            orderType: index === 0 ? 'Market' : 'Limit'
        })
    }

    private handlePriceChange = (value: string) => {
        const { type } = this.props;
        const { currentMarketBidPrecision, currentMarketAskPrecision } = this.state;

        const currentPrecision = type === 'buy' ? currentMarketAskPrecision : currentMarketBidPrecision;

        const convertedValue = cleanPositiveFloatInput(String(value));
        const condition = new RegExp(`^(?:[\\d-]*\\.?[\\d-]{0,${currentPrecision}}|[\\d-]*\\.[\\d-])$`);
        if (convertedValue.match(condition)) {
            this.setState({
                price: convertedValue,
            });
        }
        this.props.listenInputPrice && this.props.listenInputPrice();
    };

    private handleAmountChange = (value: string) => {
        const { type } = this.props;
        const { currentMarketBidPrecision, currentMarketAskPrecision } = this.state;

        const currentPrecision = type === 'buy' ? currentMarketBidPrecision : currentMarketAskPrecision;
        
        const convertedValue = cleanPositiveFloatInput(String(value));
        const condition = new RegExp(`^(?:[\\d-]*\\.?[\\d-]{0,${currentPrecision}}|[\\d-]*\\.[\\d-])$`);
        if (convertedValue.match(condition)) {
            this.setState({
                amount: convertedValue,
            });
        }
    };

    private handleFieldFocus = (field: string | undefined) => {
        switch (field) {
            case this.props.translate.priceText:
                this.setState(prev => ({
                    priceFocused: !prev.priceFocused,
                }));
                this.props.listenInputPrice && this.props.listenInputPrice();
                break;
            case this.props.translate.amountText:
                this.setState(prev => ({
                    amountFocused: !prev.amountFocused,
                }));
                break;
            default:
                break;
        }
    };    

    private handleSubmit = () => {
        const { type } = this.props;
        const { amount, price, priceMarket, orderType, available } = this.state;

        const order = {
            type,
            orderType,
            amount,
            price: orderType === 'Market' ? priceMarket : price,
            available: available || 0,
        };

        this.props.onSubmit(order);
        this.setState({
            amount: '',
            price: '',
        });
    };

    private handleEnterPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();

            this.handleSubmit();
        }
    }
    private renderDropdownCurrencys = (list, selected, type) => {
        return (
            <Dropdown>
                <Dropdown.Toggle variant="primary" id="dropdown-basic">
                    {selected.toUpperCase()}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {list.map((elem, index) => {
                        return (
                            <Dropdown.Item
                                key={index}
                                onSelect={ (eventKey: any, e?: React.SyntheticEvent<unknown>) => this.handleSelect(elem, index, type)}
                            >
                                {elem}
                            </Dropdown.Item>
                        )
                    })}
                </Dropdown.Menu>
            </Dropdown>
        )
    }
    private handleSelect(elem, index, type){
        if(type === 'from'){
            this.setState({
                indexDropdownFrom: index
            })
            this.props.handleChangeFrom(elem, index)
        }else {
            this.setState({
                indexDropdownTo: index
            })
             this.props.handleChangeTo(elem, index);
        }
    }
}

export {
    InstantexComponent
}