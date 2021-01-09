import React from 'react'
import { usePromiseTracker } from 'react-promise-tracker';
import recordSpinning from './recordSpinning.mp4';

export const LoadingSpinner = (props) => {
	const { promiseInProgress } = usePromiseTracker();

	return (
		<div className="ml-3">
			{
				(promiseInProgress === true) ?
				<video autoPlay loop muted>
    			<source src={recordSpinning} type='video/mp4' />
				</video> : null
			}
		</div>
		)
};
