import React, { lazy, Suspense } from 'react';
// import Footer from 'website1/Footer';
import Footer2 from './Footer';

const Title = lazy(() => import('./Title'));

export default () => (
	<>
		<Suspense fallback={'fallback'}>
			<Title />
		</Suspense>
		<p>This is Website 2</p>
		<Footer2 />
	</>
);
