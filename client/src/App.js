// src/App.js

import React from "react";
import { Router, Route } from "react-router-dom";
import history from "./utils/history";
import NavBar from "./components/NavBar";
import Search from "./components/Search";
import { useAuth0 } from "./react-auth0-spa";

function App() {
  const { isAuthenticated, loading } = useAuth0();

  if (loading) {
    return <div>Loading...</div>;
  } else {
    return (
      <div className="App">
        <Router history={history}>
          <Route path="/" exact />
          <NavBar />
          {!isAuthenticated && (
            <div className="text-center mt-5">
              <h5>Please login to begin.</h5>
            </div>
          )}
          {isAuthenticated && (
            <div>
              <Search />
            </div>
          )}
        </Router>
      </div>
    );
  }
}

export default App;
