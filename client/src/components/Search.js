import React from "react";
import { trackPromise } from 'react-promise-tracker';
import Item from './Item';
let domain;
if (process.env.NODE_ENV === 'development') {
  domain = '';
}
if (process.env.NODE_ENV === 'production') {
  domain = 'https://iris-lp-scanner-server.herokuapp.com';
}

class Search extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      barcodeInput: '',
      barcode: '',
      title: '',
      image_url: '',
      quantity: 0,
      price: '',
      quantity_received: '',
      total_quantity: '',
      item_id: '',
      item_variation_id: '',
      item_variation_version: '',
      item_state: '',
      saved: false,
      error: false
    };
    this.searchInput = React.createRef();
    this.handleBarcodeInput = this.handleBarcodeInput.bind(this);
    this.searchForItem = this.searchForItem.bind(this);
    this.handleTitleValue = this.handleTitleValue.bind(this);
    this.handlePriceValue = this.handlePriceValue.bind(this);
    this.handleTotalQuantityValue = this.handleTotalQuantityValue.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.cancel = this.cancel.bind(this);
  }

  componentDidMount() {
    this.searchInput.current.focus();
  }

  handleBarcodeInput(e) {
    this.setState({
      barcodeInput: e.target.value,
      barcode: e.target.value
    });
  }

  searchForItem(e) {
    e.preventDefault();
    // this.searchInput.current.blur();
    this.setState({ saved: false})
    trackPromise(
      fetch(`${domain}/search/${this.state.barcodeInput}`, { mode: 'cors' })
    )
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        if (json.quantity) {
          var quantity = json.quantity;
        } else {
          quantity = this.state.quantity;
        }
        this.setState({
          title: json.title,
      	  image_url: json.cover_image,
          quantity: quantity,
          price: json.price,
          barcodeInput: '',
          item_id: json.item_id,
          item_variation_id: json.item_variation_id,
          item_variation_version: json.item_variation_version,
          item_state: json.item_state,
        });
      })
      .catch((error) => {
        this.setState({
          error: true
        });
        console.log('error searching for item\n');
        console.log(error);
      });
  }

  handleTitleValue(e) {
    e.preventDefault();
    this.setState({ title: e.target.value });
  }

  handlePriceValue(e) {
    e.preventDefault();
    this.setState({ price: e.target.value});
  }

  handleTotalQuantityValue(e) {
    e.preventDefault();
    var total_quantity = parseInt(e.target.value) + parseInt(this.state.quantity);
    this.setState({
      quantity_received: e.target.value,
      total_quantity: total_quantity });
  }

  create(e) {
    e.preventDefault();
    this.searchInput.current.focus();
    const data = this.state;
    fetch(`${domain}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      mode: 'cors'
    })
      .then(response => {
        return response.text();
      })
      .catch((error) => {
        this.setState({
          error: true
        });
        console.log('error creating item');
        console.log(error);
      });
      this.setState({
        barcodeInput: '',
        barcode: '',
        title: '',
        image_url: '',
        quantity: 0,
        price: '',
        quantity_received: '',
        total_quantity: '',
        item_id: '',
        item_variation_id: '',
        item_variation_version: '',
        item_state: '',
        saved: true
      });
  }

  update(e) {
    e.preventDefault();
    this.searchInput.current.focus();
    const data = this.state;
    fetch(`${domain}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      mode: 'cors'
    })
      .then((response) => {
        return response.text();
      })
      .catch((error) => {
        this.setState({
          error: true
        });
        console.log('error updating item\n');
        console.log(error);
      });
      this.setState({
        barcodeInput: '',
        barcode: '',
        title: '',
        image_url: '',
        quantity: 0,
        price: '',
        quantity_received: '',
        total_quantity: '',
        item_id: '',
        item_variation_id: '',
        item_variation_version: '',
        item_state: '',
        saved: true
      });
  }

  cancel(e) {
    e.preventDefault();
    this.setState({
      barcodeInput: '',
      barcode: '',
      title: '',
      image_url: '',
      quantity: 0,
      price: '',
      quantity_received: '',
      total_quantity: '',
      item_id: '',
      item_variation_id: '',
      item_variation_version: '',
      item_state: '',
      saved: false
    });
  }

  render() {
      return (
        <div>
          {this.state.title === '' || this.state.title === 'Item not found' ?
            <form>
              <div className="ml-3 form-group row">
                <input className="form-control col-3" type="text" name="barcode" value={this.state.barcodeInput} onChange={this.handleBarcodeInput} ref={this.searchInput} placeholder="Scan or enter barcode" />
                <button className="btn btn-primary ml-1" onClick={this.searchForItem}>
                  <svg className="bi bi-search" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10.442 10.442a1 1 0 011.415 0l3.85 3.85a1 1 0 01-1.414 1.415l-3.85-3.85a1 1 0 010-1.415z" clipRule="evenodd"/>
                    <path fillRule="evenodd" d="M6.5 12a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM13 6.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
            </form>
          :
          <form>
            <div className="ml-3 form-group row">
              <input className="form-control col-3" type="text" name="barcode" value={this.state.barcodeInput} onChange={this.handleBarcodeInput} ref={this.searchInput} placeholder="Scan or enter barcode" disabled/>
              <button className="btn btn-primary ml-1" onClick={this.searchForItem}>
                <svg className="bi bi-search" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10.442 10.442a1 1 0 011.415 0l3.85 3.85a1 1 0 01-1.414 1.415l-3.85-3.85a1 1 0 010-1.415z" clipRule="evenodd"/>
                  <path fillRule="evenodd" d="M6.5 12a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM13 6.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
          </form>
          }

          <Item
            title={this.state.title}
            image_url={this.state.image_url}
            barcode={this.state.barcode}
            quantity={this.state.quantity}
            price={this.state.price}
            handleTitleValue={this.handleTitleValue}
            handlePriceValue={this.handlePriceValue}
            handleTotalQuantityValue={this.handleTotalQuantityValue}
            quantity_received={this.state.quantity_received}
            total_quantity={this.state.total_quantity}
            saved={this.state.saved}
            error={this.state.error}
            item_variation_id={this.state.item_variation_id}
            item_variation_version={this.state.item_variation_version}
            create={this.create}
            update={this.update}
            cancel={this.cancel}
          />

        </div>
      );
  } // end render()
} // end class

export default Search;
