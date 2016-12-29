import React, {Component} from 'react';
import './App.css';

// RegExps for queries
const reUrl = /https?:\/\/[\w.-]+?\.\w{2,9}(?:\/(?:[^\s]*[\w\/-])?)?/gi;
const reUser = /(@\w+)/g;
const reTag = /(#\w+)/g;
const reImg = /^https?:.+(?:png|jpeg|jpg|ico)$/i;

class App extends Component {

	constructor(props) {
		super(props);
		this.handleInput = this.handleInput.bind(this);
		this.request = this.request.bind(this);
	}

	componentWillMount() {
		this.setState({
			input: this.props.input,
			urlData: new Map(),
			lastUpdate: null,
			urlsLoaded: []
		});
	}

	request(url) {
		// Ajax request
		console.info('Query data for ' + url);
		let req = new XMLHttpRequest();
		req.open("POST", 'http://link-preview.cluster.brandslisten.com');
		req.setRequestHeader('Content-type', 'application/json');
		req.addEventListener("load", ev => {
			if (ev.target.status === 200) {
				let json;
				try {
					json = JSON.parse(ev.target.responseText);
				} catch(er) {
					console.error('Kein gültiges JSON', er, url, ev.target.responseText);
				}
				let myMap = this.state.urlData;
				myMap.set(url, json);
				this.setState({urlData: myMap})
				this.setState({lastUpdate: Date.now()}); // necessary for output update
				console.info('Update ' + url, this.state.urlData);
			} else {
				console.error('Probleme mit URL ' + url, ev.target.status);
			}
		});
		req.send('{"url": "' + url + '", "force": true}');
	}

	handleInput(ev) {
		// parse input for URLs, user names, tags
		let init = (typeof ev === 'object' && ev.target)? false : true;
		let text = init? ev : ev.target.value;
		let urls = text.match(reUrl);

		if (urls) {
			// query URLs
			urls.forEach(url => {
				if (this.state.urlData.has(url))
					return; // already queried
				this.request(url);
			});
			// clean obsolete URL data
			let myMap = this.state.urlData;
			myMap.forEach((val, key) => {
				if (urls.indexOf(key) < 0)
					myMap.delete(key);
			});
			this.setState({urlData: myMap});
		}

		this.setState({
			input: text,
			usernames: text.match(reUser),
			tags: text.match(reTag)
		}, () => {
			this.setState({'lastUpdate': Date.now()});
		});
	}

	render() {
		return(
			<div className="App">
				<h2>React-Anfängerdemo</h2>
				<Input defaultValue={this.state.input} process={this.handleInput}/>
				<Output urlData={this.state.urlData} usernames={this.state.usernames} tags={this.state.tags}></Output>
			</div>
		);
	}
}

/* Textarea field */
class Input extends Component {
	componentDidMount() {
		this.props.process(this.props.defaultValue);
	}

	render() {
		return React.createElement('textarea', {
			value: this.props.defaultValue,
			autoFocus: 'true',
			onChange: this.props.process
		});
	}
}

/* Output area */
class Output extends Component {
	render() {
		if (!this.props)
			return(<div className="Output"></div>);
		return(
		  <div className="Output">
		  	<h3 className="urls">URLs</h3>
				<List data={this.props.urlData}/>
				<h3 className="usernames">Benutzer</h3>
				<List data={this.props.usernames}/>
				<h3 className="tags">Tags</h3>
				<List data={this.props.tags}/>
			</div>
		);
	}
}

/* List in output area */
class List extends Component {
	constructor() {
    super();
    this.state = {
    	items: [],
    };
  }

	componentWillReceiveProps() {
		let items = [];
		let data = (this.props && this.props.data)? this.props.data : [];
		if (data.constructor === Map) {
			data.forEach((val, key) => {
				items.push(<li key={key}>{key}<UrlProp data={val}/></li>);
			});
		} else {
			data.forEach((el, i) => {
				items.push(<li key={i}>{el}</li>);
			});
		}
		this.setState({
			items: items
		});
	}

	render() {
		return(
			<ul>{this.state.items}</ul>
		);
	}
}

/* URL details in Output area list */
class UrlProp extends Component {
	constructor() {
    super();
    this.state = {
    	items: [],
    };
  }

	componentWillReceiveProps() {
		let items = [];
		let data = (this.props && this.props.data)? this.props.data : [];
		Object.keys(data).forEach((el, i) => {
			let val = data[el];
			if (typeof val === 'string') {
				items.push(<li key={el}><dfn>{el}</dfn> {val}</li>);
			} else if (typeof val === 'object') {
				Object.keys(val).forEach((subEl) => {
					let subVal = val[subEl];
					let desc = (val.constructor === Array)? el + '.' + subEl : subEl;
					if (reImg.test(subVal))
						items.push(<li key={desc}><dfn>{desc}</dfn> <img src={subVal} alt={subEl}/></li>)
					else
						items.push(<li key={desc}><dfn>{desc}</dfn> {subVal}</li>);
				});
			}
		});
		this.setState({
			items: items
		});
	}

	render() {
		return(
			<ul>{this.state.items}</ul>
		);
	}
}


/*
App.defaultProps = {
	input: `Hey, @bl!
https://heise.de/
http://woerter.de/index.html
https://ct.de.
http://ct.de/?x=1
#tag #tag2
@wortwart`
}
*/

App.defaultProps = {
	input: `Hey, @bl!
https://heise.de/
https://amazon.com!
#tag #tag2
@wortwart`
}

/*
App.defaultProps = {
	input: `Hey, @bl!
#tag #tag2
@wortwart`
}
*/

export default App;
