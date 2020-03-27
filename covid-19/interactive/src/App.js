import React from 'react';
import './App.css';
import Barchart from './Barchart.js'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        COVID-19 U.S. Testing Activity
      </header>
      <Barchart />
    </div>
  );
}

export default App;
