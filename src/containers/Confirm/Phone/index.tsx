import cr from 'classnames';
import * as React from 'react';
import { Button, InputGroup } from 'react-bootstrap';
import { InjectedIntlProps, injectIntl } from 'react-intl';
import {
    connect,
    MapDispatchToPropsFunction,
} from 'react-redux';
import { CustomInput } from '../../../components';
import { RootState } from '../../../modules';
import {
    resendCode,
    selectVerifyPhoneSuccess,
    sendCode,
    verifyPhone,
} from '../../../modules/user/kyc/phone';
import { changeUserLevel } from '../../../modules/user/profile';

import { PhoneCodeDropdown } from '../../../components/CodePhoneDropdown';


interface ReduxProps {
    verifyPhoneSuccess?: string;
}

interface PhoneState {
    changePhoneCode: boolean;
    phoneCode: string;
    phoneNumber: string;
    phoneNumberFocused: boolean;
    confirmationCode: string;
    confirmationCodeFocused: boolean;
    resendCode: boolean;
}

interface DispatchProps {
    resendCode: typeof resendCode;
    sendCode: typeof sendCode;
    verifyPhone: typeof verifyPhone;
    changeUserLevel: typeof changeUserLevel;
}

type Props = ReduxProps & DispatchProps & InjectedIntlProps;

class PhoneComponent extends React.Component<Props, PhoneState> {
    constructor(props: Props) {
        super(props);

        this.state = {
            phoneCode: '',
            phoneNumber: '',
            phoneNumberFocused: false,
            confirmationCode: '',
            confirmationCodeFocused: false,
            resendCode: false,
            changePhoneCode: false,
        };
    }

    public translate = (e: string) => {
        return this.props.intl.formatMessage({ id: e });
    };

    public render() {
        const {
            phoneNumber,
            phoneNumberFocused,
            confirmationCode,
            confirmationCodeFocused,
        } = this.state;
        const {
            verifyPhoneSuccess,
        } = this.props;

        const phoneNumberFocusedClass = cr('pg-confirm__content-phone-col-content', {
            'pg-confirm__content-phone-col-content--focused': phoneNumberFocused,
        });

        const confirmationCodeFocusedClass = cr('pg-confirm__content-phone-col-content', {
            'pg-confirm__content-phone-col-content--focused': confirmationCodeFocused,
        });

        return (
            <div className="pg-confirm__content-phone">
                <h2 className="pg-confirm__content-phone-head">{this.translate('page.body.kyc.phone.head')}</h2>
                <div className="pg-confirm__content-phone-col">
                    <div className="pg-confirm__content-phone-col-text">
                        1. {this.translate('page.body.kyc.phone.enterPhone')}
                    </div>
                    <fieldset className={phoneNumberFocusedClass}>
                        <InputGroup>
                            <PhoneCodeDropdown 
                                onSelect={this.handlePhoneCode} 
                                placeholder={this.translate('page.body.kyc.phone.selectphoneCode')} 
                            />
                            <CustomInput
                                label={phoneNumber ? this.translate('page.body.kyc.phone.phoneNumber') : ''}
                                defaultLabel={phoneNumber ? this.translate('page.body.kyc.phone.phoneNumber') : ''}
                                placeholder={this.translate('page.body.kyc.phone.phoneNumber')}
                                type="string"
                                inputValue={phoneNumber}
                                handleChangeInput={this.handleChangePhoneNumber}
                                onKeyPress={this.handleSendEnterPress}
                                autoFocus={true}
                                handleFocusInput={this.handleFieldFocus('phoneNumber')}
                            />
                            <InputGroup.Append>
                                <Button
                                    block={true}
                                    onClick={this.handleSendCode}
                                    size="lg"
                                    variant="primary"
                                    disabled={!phoneNumber}
                                >
                                    {this.state.resendCode ? this.translate('page.body.kyc.phone.resend') : this.translate('page.body.kyc.phone.send')}
                                </Button>
                            </InputGroup.Append>
                        </InputGroup>
                    </fieldset>
                </div>
                <div className="pg-confirm__content-phone-col">
                    <div className="pg-confirm__content-phone-col-text">
                        2. {this.translate('page.body.kyc.phone.enterCode')}
                    </div>
                    <fieldset className={confirmationCodeFocusedClass}>
                        <CustomInput
                            type="string"
                            label={confirmationCode ? this.translate('page.body.kyc.phone.code') : ''}
                            defaultLabel={confirmationCode ? this.translate('page.body.kyc.phone.code') : ''}
                            handleChangeInput={this.handleChangeConfirmationCode}
                            onKeyPress={this.handleConfirmEnterPress}
                            inputValue={confirmationCode}
                            placeholder={this.translate('page.body.kyc.phone.code')}
                            handleFocusInput={this.handleFieldFocus('confirmationCode')}
                        />
                    </fieldset>
                </div>
                {verifyPhoneSuccess && <p className="pg-confirm__success">{this.translate(verifyPhoneSuccess)}</p>}
                <div className="pg-confirm__content-deep">
                    <Button
                        block={true}
                        onClick={this.confirmPhone}
                        size="lg"
                        variant="primary"
                        disabled={!confirmationCode}
                    >
                        {this.translate('page.body.kyc.next')}
                    </Button>
                </div>
            </div>
        );
    }
    private handlePhoneCode = (code:string) => {
        this.setState({
            phoneCode: code
        });
        if(!this.state.changePhoneCode){
            this.setState({
                changePhoneCode: true
            })
        }

    }

    private handleFieldFocus = (field: string) => {
        return() => {
            switch (field) {
                case 'phoneNumber':
                    this.setState(prev => ({
                        phoneNumberFocused: !prev.phoneNumberFocused,
                    }));
                    break;
                case 'confirmationCode':
                    this.setState({
                        confirmationCodeFocused: !this.state.confirmationCodeFocused,
                    });
                    break;
                default:
                    break;
            }
        };
    }

    private handleConfirmEnterPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.confirmPhone();
        }
    }

    private handleSendEnterPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.handleSendCode();
        }
    }

    private confirmPhone = () => {
        const requestProps = {
            phone_number: String(`${this.state.phoneCode}${this.state.phoneNumber}`),
            verification_code: String(this.state.confirmationCode),
        };
        this.props.verifyPhone(requestProps);
    }

    
    private handleChangePhoneNumber = (value: string) => {
        if (this.inputPhoneNumber(value)) {
            this.setState({
                phoneNumber: value,
                resendCode: false,
            });
        }
    }

    private handleChangeConfirmationCode = (value: string) => {
        if (this.inputConfirmationCode(value)) {
            this.setState({
                confirmationCode: value,
            });
        }
    };

    private inputPhoneNumber = (value: string) => {
        const convertedText = value.trim();
        //const condition = new RegExp('^\\+\\d*?$');
        const condition = new RegExp('^\\d*?$');
        if(this.state.changePhoneCode){
            return condition.test(convertedText);
        }
        return false;
        
    }

    private inputConfirmationCode = (value: string) => {
        const convertedText = value.trim();
        const condition = new RegExp('^\\d*?$');
        return condition.test(convertedText);
    }

    private handleSendCode = () => {
        const requestProps = {
            phone_number: String(`${this.state.phoneCode}${this.state.phoneNumber}`),
        };
        if (!this.state.resendCode) {
            this.props.sendCode(requestProps);
            this.setState({
                resendCode: true,
            });
        } else {
            this.props.resendCode(requestProps);
        }
    };
}

const mapStateToProps = (state: RootState): ReduxProps => ({
    verifyPhoneSuccess: selectVerifyPhoneSuccess(state),
});

const mapDispatchProps: MapDispatchToPropsFunction<DispatchProps, {}> =
    dispatch => ({
        resendCode: phone => dispatch(resendCode(phone)),
        sendCode: phone => dispatch(sendCode(phone)),
        verifyPhone: payload => dispatch(verifyPhone(payload)),
        changeUserLevel: payload => dispatch(changeUserLevel(payload)),
    });

// tslint:disable-next-line
export const Phone = injectIntl(connect(mapStateToProps, mapDispatchProps)(PhoneComponent) as any);
