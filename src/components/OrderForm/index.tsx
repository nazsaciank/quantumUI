import { OrderInput } from '../OrderInput';
import { PercentageButton } from '../PercentageButton';
import classnames from 'classnames';
import * as React from 'react';
import { Button } from 'react-bootstrap';
import { Decimal } from '../Decimal';
import { cleanPositiveFloatInput, getAmount, getTotalPrice } from '../../helpers';
//import { DropdownComponent } from '../Dropdown';
import { OrderProps } from '../Order';

import { Link } from 'react-router-dom';

// tslint:disable:no-magic-numbers jsx-no-lambda jsx-no-multiline-js
type OnSubmitCallback = (order: OrderProps) => void;
type DropdownElem = number | string | React.ReactNode;
type FormType = 'buy' | 'sell';

export interface OrderFormProps {
    /**
     * Price that is applied during total order amount calculation when type is Market
     */
    priceMarket: number;
    /**
     * Price that is applied during total order amount calculation when type is Market
     */
    priceLimit?: number;
    /**
     * Type of form, can be 'buy' or 'cell'
     */
    type: FormType;
    /**
     * Available types of order
     */
    orderTypes: DropdownElem[];
    /**
     * Name of orderType Selected
     */
    orderSelected: string;    /**
     * Available types of order without translations
     */
    orderTypesIndex: DropdownElem[];
    /**
     * Additional class name. By default element receives `cr-order` class
     * @default empty
     */
    className?: string;
    /**
     * Name of currency for price field
     */
    from: string;
    /**
     * Name of currency for amount field
     */
    to: string;
    /**
     * Amount of money in a wallet
     */
    available?: number;
    /**
     * Precision of amount, total, available, fee value
     */
    currentMarketAskPrecision: number;
    /**
     * Precision of price value
     */
    currentMarketBidPrecision: number;
    /**
     * Whether order is disabled to execute
     */
    disabled?: boolean;
    /**
     * Callback that is called when form is submitted
     */
    onSubmit: OnSubmitCallback;
    /**
     * @default 'Order Type'
     * Text for order type dropdown label.
     */
    orderTypeText?: string;
    /**
     * @default 'Price'
     * Text for Price field Text.
     */
    priceText?: string;
    /**
     * @default 'Amount'
     * Text for Amount field Text.
     */
    amountText?: string;
    /**
     * @default 'Total'
     * Text for Total field Text.
     */
    totalText?: string;
    /**
     * @default 'Available'
     * Text for Available field Text.
     */
    availableText?: string;
    /**
     * @default type.toUpperCase()
     * Text for submit Button.
     */
    submitButtonText?: string;
    /**
     * proposal data for buy or sell [[price, volume]]
     */
    proposals: string[][];
    /**
     * start handling change price
     */
    listenInputPrice?: () => void;

    userLoggedIn?: boolean
}

interface OrderFormState {
    orderType: string | React.ReactNode;
    amount: string;
    price: string;
    priceMarket: number;
    currentMarketAskPrecision: number;
    currentMarketBidPrecision: number;
    amountFocused: boolean;
    priceFocused: boolean;
    index: number;

    //isLoggedIn: boolean;
}

const handleSetValue = (value: string | number | undefined, defaultValue: string) => (
    value || defaultValue
);

const checkButtonIsDisabled = (safeAmount: number, safePrice: number, price: string, props: OrderFormProps, state: OrderFormState) => {
    const invalidAmount = safeAmount <= 0;
    const invalidLimitPrice = Number(price) <= 0 && props.orderSelected === 'Limit';
    const invalidMarketPrice = safePrice <= 0 && props.orderSelected === 'Market';
    return props.disabled || !props.available || invalidAmount || invalidLimitPrice || invalidMarketPrice;
};

export class OrderForm extends React.Component<OrderFormProps, OrderFormState> {
    constructor(props: OrderFormProps) {
        super(props);
        this.state = {
            orderType: this.props.orderSelected || 'Limit',
            amount: '',
            price: '',
            priceMarket: this.props.priceMarket,
            currentMarketAskPrecision: this.props.currentMarketAskPrecision || 6,
            currentMarketBidPrecision: this.props.currentMarketBidPrecision || 6,
            priceFocused: false,
            amountFocused: false,
            index: 0,
            //isLoggedIn
        };
    }

    public componentWillReceiveProps(next: OrderFormProps) {
        const nextPriceLimitTruncated = Decimal.format(next.priceLimit, this.state.currentMarketBidPrecision);
        if (this.props.orderSelected === 'Limit' && next.priceLimit && nextPriceLimitTruncated !== this.state.price) {
            this.setState({
                price: nextPriceLimitTruncated,
            });
        }

        this.setState({
            priceMarket: next.priceMarket,
            currentMarketAskPrecision: next.currentMarketAskPrecision,
            currentMarketBidPrecision: next.currentMarketBidPrecision,
        });
    }

    public render() {
        const {
            type,
            //orderTypes,
            className,
            from,
            to,
            available,
            //orderTypeText,
            priceText,
            amountText,
            totalText,
            availableText,
            submitButtonText,
            proposals,
            orderSelected,
            userLoggedIn
        } = this.props;
        const {
            //orderType,
            amount,
            price,
            priceMarket,
            currentMarketAskPrecision,
            currentMarketBidPrecision,
            priceFocused,
            amountFocused,
        } = this.state;
        const safeAmount = Number(amount) || 0;
        const totalPrice = getTotalPrice(amount, proposals);
        const safePrice = totalPrice / Number(amount) || priceMarket;

        const total = orderSelected === 'Market'
            ? totalPrice : safeAmount * (Number(price) || 0);
        const amountPercentageArray = [0.25, 0.5, 0.75, 1];

        const cx = classnames('cr-order-form', className);
        const availablePrecision = type === 'buy' ? currentMarketBidPrecision : currentMarketAskPrecision;
        const availableCurrency = type === 'buy' ? from : to;

        return (
            <div className={cx} onKeyPress={this.handleEnterPress}>
                {/*<div className="cr-order-item">
                    {orderTypeText ? <div className="cr-order-item__dropdown__label">{orderTypeText}</div> : null}
                    <DropdownComponent list={orderTypes} onSelect={this.handleOrderTypeChange} placeholder=""/>
                </div*/}

                <div className="cr-order-item">
                    {
                        orderSelected === 'Limit' ?
                                (
                                    <div className="cr-order-item">
                                        <OrderInput
                                            currency={from}
                                            label={priceText}
                                            placeholder={priceText}
                                            value={handleSetValue(price,'')}
                                            isFocused={priceFocused}
                                            handleChangeValue={this.handlePriceChange}
                                            handleFocusInput={() => this.handleFieldFocus(priceText)}
                                        />
                                    </div>
                                ) : (
                                    orderSelected === 'Market' ?
                                    (
                                        <div className="cr-order-item">
                                            <div className="cr-order-input">
                                                <fieldset className="cr-order-input__fieldset">
                                                    <legend className={'cr-order-input__fieldset__label'}>
                                                        {handleSetValue(priceText, '')}
                                                    </legend>
                                                    <div className="cr-order-input__fieldset__input">
                                                        &asymp;<span className="cr-order-input__fieldset__input__price">{handleSetValue(Decimal.format(safePrice, currentMarketBidPrecision), '0')}</span>
                                                    </div>
                                                </fieldset>
                                                <div className="cr-order-input__crypto-icon">
                                                    {from.toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        orderSelected === 'Stop Limit' ?
                                        (
                                            <div className="cr-order-item"></div>
                                        ) : (
                                            orderSelected === 'OCO' ?
                                            (
                                                <div className="cr-order-item"></div>
                                            ) : null
                                        )
                                    )
                                )
                    }
                </div>
                <div className="cr-order-item">
                    <OrderInput
                        currency={to}
                        label={amountText}
                        placeholder={amountText}
                        value={handleSetValue(amount, '')}
                        isFocused={amountFocused}
                        handleChangeValue={this.handleAmountChange}
                        handleFocusInput={() => this.handleFieldFocus(amountText)}
                    />
                </div>

                <div className="cr-order-item">
                    <div className="cr-order-item__percentage-buttons">
                        <PercentageButton
                            label={`${amountPercentageArray[0] * 100}%`}
                            onClick={() => this.handleChangeAmountByButton(amountPercentageArray[0], type)}
                        />
                        <PercentageButton
                            label={`${amountPercentageArray[1] * 100}%`}
                            onClick={() => this.handleChangeAmountByButton(amountPercentageArray[1], type)}
                        />
                        <PercentageButton
                            label={`${amountPercentageArray[2] * 100}%`}
                            onClick={() => this.handleChangeAmountByButton(amountPercentageArray[2], type)}
                        />
                        <PercentageButton
                            label={`${amountPercentageArray[3] * 100}%`}
                            onClick={() => this.handleChangeAmountByButton(amountPercentageArray[3], type)}
                        />
                    </div>
                </div>

                <div className="cr-order-item">
                    <div className="cr-order-item__total">
                        <label className="cr-order-item__total__label">
                            {handleSetValue(totalText, 'Total')}
                        </label>
                        <div className="cr-order-item__total__content">
                            {orderSelected === 'Limit' ? (
                                <span className="cr-order-item__total__content__amount">
                                    {Decimal.format(total, currentMarketBidPrecision + currentMarketAskPrecision)}
                                </span>
                            ) : (
                                <span className="cr-order-item__total__content__amount">
                                    &asymp;{Decimal.format(total, currentMarketBidPrecision + currentMarketAskPrecision)}
                                </span>
                            )}
                            <span className="cr-order-item__total__content__currency">
                                {from.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="cr-order-item">
                    <div className="cr-order-item__available">
                        <label className="cr-order-item__available__label">
                            {handleSetValue(availableText, 'Available')}
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
                                {`${submitButtonText} ${to.toUpperCase()}` || type}
                            </Button>
                        ) : (
                            <Link to="/signin" className="btn btn-primary btn-block btn-lg">
                                {submitButtonText || 'Sign In or Sign Up'}
                            </Link>
                        )
                    }
                    
                </div>
            </div>
        );
    }

    private handleFieldFocus = (field: string | undefined) => {
        switch (field) {
            case this.props.priceText:
                this.setState(prev => ({
                    priceFocused: !prev.priceFocused,
                }));
                this.props.listenInputPrice && this.props.listenInputPrice();
                break;
            case this.props.amountText:
                this.setState(prev => ({
                    amountFocused: !prev.amountFocused,
                }));
                break;
            default:
                break;
        }
    };

    private handlePriceChange = (value: string) => {
        const convertedValue = cleanPositiveFloatInput(String(value));
        const condition = new RegExp(`^(?:[\\d-]*\\.?[\\d-]{0,${this.state.currentMarketBidPrecision}}|[\\d-]*\\.[\\d-])$`);
        if (convertedValue.match(condition)) {
            this.setState({
                price: convertedValue,
            });
        }
        this.props.listenInputPrice && this.props.listenInputPrice();
    };

    private handleAmountChange = (value: string) => {
        const convertedValue = cleanPositiveFloatInput(String(value));
        const condition = new RegExp(`^(?:[\\d-]*\\.?[\\d-]{0,${this.state.currentMarketAskPrecision}}|[\\d-]*\\.[\\d-])$`);
        if (convertedValue.match(condition)) {
            this.setState({
                amount: convertedValue,
            });
        }
    };

    private handleChangeAmountByButton = (value: number, type: string) => {
        switch (type) {
            case 'buy':
                switch (this.props.orderSelected) {
                    case 'Limit':
                        this.setState({
                            amount: this.props.available && + this.state.price ? (
                                Decimal.format(this.props.available / +this.state.price * value, this.state.currentMarketAskPrecision)
                            ) : '',
                        });
                        break;
                    case 'Market':
                        this.setState({
                            amount: this.props.available ? (
                                Decimal.format(getAmount(Number(this.props.available), this.props.proposals, value), this.state.currentMarketAskPrecision)
                            ) : '',
                        });
                        break;
                    default:
                        break;
                }
                break;
            case 'sell':
                this.setState({
                    amount: this.props.available ? (
                        Decimal.format(this.props.available * value, this.state.currentMarketAskPrecision)
                    ) : '',
                });
                break;
            default:
                break;
        }
    };

    private handleSubmit = () => {
        const { available, type, orderSelected } = this.props;
        const { amount, price, priceMarket, orderType } = this.state;
        this.setState({
            orderType: orderSelected
        })

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
    /*
    private handleChangeTab = (index: number, label?: string) => {
        const { orderTypesIndex } = this.props;
        this.setState({
            index: index,
            orderType: orderTypesIndex[index],
        });
    }
    */
}
/*
const mapStateToProps: MapStateToProps<ReduxProps, {}, RootState> =
    (state: RootState): ReduxProps => ({
        isLoggedIn: selectUserLoggedIn(state),
    });
*/