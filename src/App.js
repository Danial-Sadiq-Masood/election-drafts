import './App.css';
import { Routes, Route, HashRouter } from 'react-router-dom';
import { AppContext } from './contexts';
import Landing from './views/landing';
import DataView from './views/dataView';
import ReactGA from "react-ga4";
import { useEffect, useState } from 'react';


function App() {

  const [app, setFbApp] = useState(null);

  useEffect(() => {
      ReactGA.initialize("G-FKREF78QMV");
  }, []);

  console.log(process.env.PUBLIC_URL);

  return (
    <div className="App">
      <HashRouter basename={process.env.PUBLIC_URL}>
        <AppContext.Provider value={{app}}>
          <Routes>
            <Route
              exact
              path='/'
              element = { <DataView mapType="choropleth"/> } 
            />
            <Route
              exact
              path='/gridmap'
              element = { <DataView mapType="gridMap"/> } 
            />
            <Route
              exact
              path='/gridmap'
              element = { <DataView mapType="gridMap"/> } 
            />
          </Routes>
        </AppContext.Provider>
      </HashRouter>
    </div>
  );
}

export default App;
