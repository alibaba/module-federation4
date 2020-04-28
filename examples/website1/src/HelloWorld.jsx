import React, { lazy, Suspense, useState } from 'react';
import Footer from './Footer';

console.log('react', React);

// import from another online project
const Title = lazy(() => import('website2/Title').then(mod => mod.default));

export default () => {
	return (
		<>
			<Suspense fallback={<div>loading</div>}>
				<Title />
			</Suspense>
			<p>
				This app loads the heading above from website2, and doesnt expose
				anything itself.
			</p>
			<Footer />
		</>
	);
};
