import React from "react";
import { useAuth0 } from "../react-auth0-spa";

const NavBar = () => {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();

  return (
    <div>
        <nav className="navbar navbar-expand-md navbar-light bg-light mb-4">
          <h4 className="navbar-brand mt-2">IRIS LP Scanner</h4>
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse text-right" id="navbarCollapse">
            <ul className="navbar-nav nav-items ml-auto mr-3">
              <li className="nav-item">
                {!isAuthenticated && (<button onClick={() => loginWithRedirect({})}>Log in</button>)}
                {isAuthenticated &&  (<span>{user.email}<button className="ml-3" onClick={() => logout()}>Log out</button></span>)}
              </li>
            </ul>
          </div>
        </nav>
    </div>
  );
};

export default NavBar;
