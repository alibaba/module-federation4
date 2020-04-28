import React, { lazy, Suspense } from 'react';
import HelloWorld from './HelloWorld';

import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link
} from "react-router-dom";


const Website2 = lazy(() => import('website2/App').then(mod => mod.default));

export default () => <Router>
    <nav>
        <ul>
        <li>
            <Link to="/">Home</Link>
        </li>
        <li>
            <Link to="/website2">Website2</Link>
        </li>
        </ul>
    </nav>
    <Switch>
        <Route path="/website2">
            <Suspense fallback={<div>loading</div>}>
                <Website2 />
            </Suspense>
        </Route>
        <Route path="/">
            <HelloWorld />
        </Route>
    </Switch>
</Router>;
