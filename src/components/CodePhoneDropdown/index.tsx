import classnames from 'classnames';
import * as React from 'react';
import { Dropdown } from 'react-bootstrap';

import {countryCodes} from '../../constants/CountryCodes';


export interface PhoneCodeComponents {
    /**
     * Selection callback function
     * @default empty
     */
    onSelect?: (code: string) => void;
    /**
     *  By default class name 'cr-dropwdown'
     *  This property gives an additional class name
     *  @default empty
     */
    className?: string;
    /**
     * Value for placeholder of Dropdown components
     * @default empty
     */
    placeholder?: string;
    /**
     * Value for disabling contentEditable property
     * @default false
     */
    disableContentEditable?: boolean;
}

interface PhoneCodeState {
    selected: string;
    selectedIndex: string;
}



class PhoneCodeDropdown extends React.Component<PhoneCodeComponents & {}, PhoneCodeState>{
    list = countryCodes;
    constructor (props: PhoneCodeComponents){

        super(props)
        const selectedValue = this.props.placeholder || String(this.list[0].dial_code);
        this.state = {
            selected: selectedValue,
            selectedIndex: '0',
        };
    }

    render(){
        const { selected } = this.state;
        const list = this.list;

        const cx = classnames('cr-dropdown', this.props.className);

        return (
            <div className={cx}>
                <Dropdown>
                    <Dropdown.Toggle id="dropdown-basic">
                        {selected}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {list.map((elem, index) => this.renderElem(elem, index))}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        );
    }
    private renderElem = (elem, index) => {
        return  (
            <Dropdown.Item
                key={index}
                onSelect={ (eventKey: any, e?: React.SyntheticEvent<unknown>) => this.handleSelect(elem, index)}
                className="dropdown-between"
            >
                <span>{elem.name}</span>
                <span>{elem.dial_code}</span>
            </Dropdown.Item>
        );
    }

    handleSelect = (elem, index) => {
        this.props.onSelect && this.props.onSelect(elem.dial_code);
        this.setState({
            selected: elem.dial_code ,
            selectedIndex: index.toString(),
        });
    }


}

export {
    PhoneCodeDropdown,
};